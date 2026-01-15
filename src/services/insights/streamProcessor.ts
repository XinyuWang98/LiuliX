/**
 * 洞察流式处理器 (Insight Stream Processor)
 * 
 * 实现膨胀-执行流式处理，任务膨胀完成后立即执行，提升 TTFI
 * 
 * @author AntiGravity
 * @date 2026-01-15
 */

import { InsightNode, L1Recommendation } from '@/types/insightTree';
import { inflateRecommendation } from './inflater';
import { executeAndFillResult } from './executor';
import { logger } from '@/utils/logger';
import { promptRegistry } from '@/services/promptRegistry';  // 🆕 用于获取prompt配置

/**
 * 流式处理执行上下文
 */
export interface StreamProcessingContext {
    /** 数据表名称 */
    tableName: string;
    /** 有效列名列表 */
    validColumns: string[];
    /** 总行数 */
    totalRows: number;
    /** 列数 */
    columnCount?: number;
}

/**
 * 流式处理回调
 */
export interface StreamProcessingCallbacks {
    /** 节点完成回调（用于 UI 流式更新） */
    onNodeComplete?: (node: InsightNode) => void;
    /** 进度回调 */
    onProgress?: (current: number, total: number) => void;
}

/**
 * 流式处理配置选项
 */
export interface StreamProcessingOptions {
    /** 膨胀并发度（默认 2） */
    inflateConcurrency?: number;
    /** 执行并发度（默认 1，保守设置避免资源竞争） */
    executeConcurrency?: number;
    /** 是否启用质量门控（默认 true） */
    enableQualityGate?: boolean;
    /** 是否启用列名校验（默认 true） */
    enableColumnValidation?: boolean;
}

/**
 * 流式处理推荐：膨胀完成 → 立即执行
 * 
 * 核心优化：不等待全部膨胀完成，每个任务膨胀后立即加入执行队列
 * 
 * @param recommendations L1 推荐列表
 * @param context 执行上下文
 * @param callbacks 回调函数
 * @param options 配置选项
 * @returns 处理后的洞察节点数组
 */
export async function processRecommendationsStreaming(
    recommendations: L1Recommendation[],
    context: StreamProcessingContext,
    callbacks?: StreamProcessingCallbacks,
    options?: StreamProcessingOptions
): Promise<InsightNode[]> {
    const streamStartTime = performance.now();

    // 解构配置
    const {
        inflateConcurrency = 2,
        executeConcurrency = 1,
        enableQualityGate = true,
        enableColumnValidation = true
    } = options || {};

    const { tableName, validColumns, totalRows, columnCount } = context;
    const { onNodeComplete, onProgress } = callbacks || {};

    logger.log('AI服务', `🚀 [流式处理] 开始膨胀+执行流水线`, {
        data: {
            count: recommendations.length,
            inflateConcurrency,
            executeConcurrency,
            timestamp: Date.now()
        }
    });

    // 导入依赖
    const pLimit = (await import('p-limit')).default;

    // 两层并发控制
    const inflateLimit = pLimit(inflateConcurrency);
    const executeLimit = pLimit(executeConcurrency);

    // 预加载 Schema（性能优化）
    let schemaCache: Array<{ name: string; type: string }> | undefined;
    try {
        const { getTableSchema } = await import('@/services/schemaService');
        schemaCache = await getTableSchema(tableName);
        logger.log('AI服务', `[流式处理] Schema缓存已加载`, {
            data: { columns: schemaCache!.length }
        });
    } catch (error) {
        logger.warn('AI服务', '[流式处理] Schema预加载失败', { error });
    }

    // 列名校验（如启用）
    let validateColumnsExist: ((params: Record<string, unknown>, validColumns: string[]) => { valid: boolean; invalidColumns?: string[] }) | undefined;
    if (enableColumnValidation) {
        const validator = await import('@/utils/columnValidator');
        validateColumnsExist = validator.validateColumnsExist;
    }

    // 流式处理管道：膨胀完成 → 立即执行
    let completedCount = 0;
    const processingPromises = recommendations.map((rec, index) =>
        inflateLimit(async () => {
            const taskStart = performance.now();

            // 步骤1：膨胀单个任务
            const node = await inflateRecommendation(rec as any, tableName, schemaCache, 0);

            if (!node) {
                logger.warn('AI服务', `[流式处理] 任务 ${index + 1}/${recommendations.length} 膨胀失败，跳过`);
                return null;
            }

            const inflateDuration = performance.now() - taskStart;
            logger.log('AI服务', `[流式处理] 任务 ${index + 1}/${recommendations.length} 膨胀完成 (${inflateDuration.toFixed(1)}ms)，立即加入执行队列`);

            // 步骤2：立即执行（不等待其他膨胀）
            return executeLimit(async () => {
                const executeStart = performance.now();

                try {
                    // 🆕 调试日志：记录膨胀后的节点完整信息
                    logger.log('AI服务', `[流式处理] 准备执行节点: ${node.title}`, {
                        data: {
                            promptId: node.promptId,
                            params: node.params,
                            paramsKeys: Object.keys(node.params || {})
                        }
                    });

                    // ========== 列名校验 (使用prompt的inputVariables动态提取) ==========
                    if (enableColumnValidation && validateColumnsExist) {
                        // 🆕 配置驱动的列名参数提取（替代hardcoded列表）
                        // 架构说明：
                        // 1. MVP阶段：直接从prompt.inputVariables获取参数名列表
                        // 2. 扩展点：未来可改为从数据库/缓存获取（支持用户编辑）
                        const prompt = promptRegistry.getPrompt(node.promptId);

                        if (!prompt || !prompt.inputVariables || prompt.inputVariables.length === 0) {
                            // 降级处理：prompt缺失或未定义inputVariables时跳过校验
                            logger.warn('AI服务', `[流式处理] [${node.promptId}] ⚠️ 无法提取列名参数（prompt未定义inputVariables），跳过校验`, {
                                data: {
                                    promptFound: !!prompt,
                                    hasInputVariables: !!prompt?.inputVariables
                                }
                            });
                        } else {
                            // 🎯 核心逻辑：从params中提取inputVariables对应的列名
                            const paramsToValidate: Record<string, unknown> = {};

                            for (const key of prompt.inputVariables) {
                                if (node.params?.[key]) {
                                    paramsToValidate[key] = node.params[key];
                                }
                            }

                            // 调试日志：记录提取的参数
                            logger.log('AI服务', '[流式处理] 准备校验列名', {
                                data: {
                                    promptId: node.promptId,
                                    inputVariables: prompt.inputVariables,  // 配置定义的参数名
                                    extractedParams: Object.keys(paramsToValidate),  // 实际提取到的参数
                                    validColumnsCount: validColumns.length
                                }
                            });

                            const validationResult = validateColumnsExist(paramsToValidate, validColumns);

                            if (!validationResult.valid) {
                                // 校验失败：记录详细错误并跳过此节点
                                logger.warn('AI服务', `[流式处理] [${node.promptId}] ❌ 列名验证失败: 列不存在 [${validationResult.invalidColumns?.join(', ')}]`, {
                                    data: {
                                        promptId: node.promptId,
                                        invalidColumns: validationResult.invalidColumns,
                                        allParams: node.params,
                                        validatedParams: paramsToValidate,
                                        validColumns: validColumns
                                    }
                                });
                                logger.log('AI洞察', `[流式处理] 跳过无效列名的洞察: ${node.title}`, {
                                    data: { invalidColumns: validationResult.invalidColumns }
                                });
                                node.result = {
                                    code: '',
                                    rawCode: '',
                                    summary: `列名校验失败: 列 ${validationResult.invalidColumns?.join(', ')} 不存在于数据集中`,
                                    columnsUsed: []
                                };
                                node.error = '列名校验失败';

                                // 通知 UI
                                onNodeComplete?.(node);
                                completedCount++;
                                onProgress?.(completedCount, recommendations.length);

                                return node;
                            }
                        }
                    }

                    // ========== 执行节点 ==========
                    const executorResult = await executeAndFillResult(node, {
                        tableName,
                        totalRows,
                        columnCount: columnCount || validColumns.length,
                        enableQualityGate,
                        logPrefix: '流式处理'
                    });

                    // ✅ 关键修复：显式将执行结果赋值给节点（保留图片数据）
                    if (executorResult.success && executorResult.result) {
                        node.result = executorResult.result;
                        node.status = 'completed';
                    } else {
                        node.error = executorResult.error;
                        node.status = 'error';
                    }

                    const executeDuration = performance.now() - executeStart;
                    const totalDuration = performance.now() - taskStart;

                    logger.log('AI服务', `[流式处理] ⭐ 任务 ${index + 1}/${recommendations.length} 完成`, {
                        data: {
                            title: node.title,
                            inflateDuration: inflateDuration.toFixed(1) + 'ms',
                            executeDuration: executeDuration.toFixed(1) + 'ms',
                            totalDuration: totalDuration.toFixed(1) + 'ms',
                            hasImage: !!node.result?.image,
                            hasResult: !!node.result
                        }
                    });

                    // 流式更新 UI
                    onNodeComplete?.(node);
                    completedCount++;
                    onProgress?.(completedCount, recommendations.length);

                } catch (error) {
                    logger.error('AI服务', `[流式处理] 任务 ${index + 1} 执行失败: ${node.title}`, { error });
                    node.error = error instanceof Error ? error.message : '执行失败';

                    // 即使失败也通知 UI
                    onNodeComplete?.(node);
                    completedCount++;
                    onProgress?.(completedCount, recommendations.length);
                }

                return node;
            });
        })
    );

    // 等待全部完成
    const results = await Promise.all(processingPromises);
    const successfulNodes = results.filter(node => node !== null) as InsightNode[];

    const streamDuration = (performance.now() - streamStartTime) / 1000;
    logger.log('AI服务', `✅ [流式处理] 流水线完成: ${successfulNodes.length}/${recommendations.length} 个节点成功 (总耗时: ${streamDuration.toFixed(1)}s)`, {
        data: { timestamp: Date.now() }
    });

    return successfulNodes;
}
