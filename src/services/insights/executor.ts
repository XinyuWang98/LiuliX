/**
 * 洞察执行器 (Insight Executor)
 * 
 * 统一处理洞察节点的代码执行和结果填充逻辑
 * 解决 rawCode 处理分散在多处导致的不一致问题
 * 
 * @author AntiGravity
 * @date 2026-01-07
 */

import { InsightNode, ExecutionResult } from '@/types/insightTree';
import { getRenderedCode } from '@/services/insights/inflater';
import { executeInsightWithMode } from '@/services/skills/modeExecutor';
import { validateExecutionResult } from '@/utils/postExecutionGate';
import { assessMemoryBeforeExecution } from '@/utils/memoryAssessment';
import { logger } from '@/utils/logger';

/**
 * 执行上下文配置
 */
export interface ExecutionContext {
    /** 数据表名称 */
    tableName: string;
    /** 总行数（用于内存评估） */
    totalRows?: number;
    /** 是否启用质量门控 */
    enableQualityGate?: boolean;
    /** 日志前缀（用于区分调用来源） */
    logPrefix?: string;
}

/**
 * 执行结果
 */
interface ExecutorResult {
    /** 是否成功 */
    success: boolean;
    /** 错误信息 */
    error?: string;
    /** 填充后的 ExecutionResult */
    result?: ExecutionResult;
}

/**
 * 执行洞察节点并填充结果
 * 
 * 统一处理：
 * 1. 代码渲染（如需要）
 * 2. 内存评估
 * 3. 代码执行
 * 4. 质量门控（可选）
 * 5. 结果填充（包含 rawCode）
 * 
 * @param node 洞察节点
 * @param context 执行上下文
 * @returns 执行结果
 */
export async function executeAndFillResult(
    node: InsightNode,
    context: ExecutionContext
): Promise<ExecutorResult> {
    const {
        tableName,
        totalRows = 0,
        enableQualityGate = false,
        logPrefix = 'Executor'
    } = context;

    try {
        // ========== 步骤1：获取代码 ==========
        let code = node.result?.code;
        let rawCode = node.result?.rawCode;

        // 如果节点没有代码，尝试通过 promptId 渲染
        if (!code && node.promptId) {
            const renderedResult = await getRenderedCode(node.promptId, node.params);
            if (!renderedResult) {
                return {
                    success: false,
                    error: `无法渲染模板: ${node.promptId}`
                };
            }
            code = renderedResult.code;
            rawCode = renderedResult.rawCode;

            logger.log('AI服务', `[${logPrefix}] 代码渲染完成`, {
                data: {
                    promptId: node.promptId,
                    codeLength: code.length,
                    rawCodeLength: rawCode.length,
                    hasRawCode: !!rawCode
                }
            });
        }

        if (!code) {
            return {
                success: false,
                error: '节点没有可执行的代码'
            };
        }

        // ========== 步骤2: 列名预验证 (🆕 P1增强) ==========
        const { validateColumnReferences } = await import('@/utils/pythonColumnExtractor');

        try {
            // 🆕 使用 SchemaService 获取Schema
            const { getTableSchema } = await import('@/services/schemaService');
            const schema = await getTableSchema(tableName);
            const actualColumns = schema.map(col => col.name);

            const validation = validateColumnReferences(code, actualColumns);

            if (!validation.isValid) {
                if (validation.placeholderColumns.length > 0) {
                    logger.error('AI服务', `[${logPrefix}] 列名验证失败: 检测到占位符`, {
                        data: {
                            placeholderColumns: validation.placeholderColumns,
                            invalidColumns: validation.invalidColumns,
                            usedColumns: validation.usedColumns
                        }
                    });

                    return {
                        success: false,
                        error: `代码包含占位符列名: ${validation.placeholderColumns.join(', ')}。这是AI生成错误,请重新生成代码。\n可用列: ${actualColumns.join(', ')}`
                    };
                }

                logger.error('AI服务', `[${logPrefix}] 列名验证失败: 列不存在`, {
                    data: {
                        invalidColumns: validation.invalidColumns,
                        availableColumns: actualColumns,
                        usedColumns: validation.usedColumns
                    }
                });

                return {
                    success: false,
                    error: `代码引用了不存在的列: ${validation.invalidColumns.join(', ')}。\n可用列: ${actualColumns.join(', ')}`
                };
            }

            logger.log('AI服务', `[${logPrefix}] 列名验证通过`, {
                data: { validatedColumns: validation.usedColumns }
            });
        } catch (schemaError: any) {
            logger.warn('AI服务', `[${logPrefix}] 列名验证跳过`, {
                data: { reason: schemaError.message }
            });
        }

        // ========== 步骤3：内存评估 ==========
        const assessment = await assessMemoryBeforeExecution(
            totalRows,
            node.columnsUsed
        );

        logger.log('AI服务', `[${logPrefix}] 内存评估: ${assessment.mode}模式`, {
            data: {
                title: node.title,
                memory: `${assessment.estimatedMemory.toFixed(0)}MB`
            }
        });

        // ========== 步骤3：执行代码 ==========
        const execResult = await executeInsightWithMode(
            {
                title: node.title,
                description: '',
                columns_used: node.columnsUsed,
                full_mode: { code },
                aggregated_mode: { sql: '', viz_code: '' }
            },
            assessment.mode,
            tableName,
            node.promptId  // ✅ 传递 promptId 用于自动查询库依赖
        );

        if (!execResult.success) {
            logger.warn('AI服务', `[${logPrefix}] 执行失败`, {
                data: { title: node.title, error: execResult.error }
            });
            return {
                success: false,
                error: execResult.error || '执行失败'
            };
        }

        // ========== 步骤4：质量门控（可选）==========
        if (enableQualityGate) {
            const postScore = validateExecutionResult(
                {
                    title: node.title,
                    description: '',
                    columns_used: node.columnsUsed,
                    full_mode: { code },
                    aggregated_mode: { sql: '', viz_code: '' }
                },
                {
                    image: execResult.data?.image || '',
                    summary: execResult.data?.summary || ''
                }
            );

            if (!postScore.passed) {
                logger.log('AI服务', `[${logPrefix}] 质量不足`, {
                    data: {
                        title: node.title,
                        score: postScore.total,
                        reasons: postScore.reasons
                    }
                });
                return {
                    success: false,
                    error: `质量评分不足：${postScore.total}/100`
                };
            }
        }

        // ========== 步骤5：填充结果（统一处理 rawCode）==========
        const result: ExecutionResult = {
            code,
            rawCode,  // ✅ 统一保留纯净代码
            image: execResult.data?.image,
            summary: execResult.data?.summary || '',
            columnsUsed: node.columnsUsed
        };

        logger.log('AI服务', `[${logPrefix}] 执行成功`, {
            data: {
                title: node.title,
                hasImage: !!result.image,
                hasRawCode: !!result.rawCode,
                rawCodeLength: result.rawCode?.length || 0,
                codeLength: result.code.length
            }
        });

        return {
            success: true,
            result
        };

    } catch (error) {
        logger.error('AI服务', `[${logPrefix}] 执行异常`, error);
        return {
            success: false,
            error: String(error)
        };
    }
}

/**
 * 批量执行洞察节点
 * 
 * @param nodes 洞察节点数组
 * @param context 执行上下文
 * @param onProgress 进度回调
 */
export async function executeBatchNodes(
    nodes: InsightNode[],
    context: ExecutionContext,
    onProgress?: (current: number, total: number) => void
): Promise<void> {
    const total = nodes.length;

    for (let i = 0; i < total; i++) {
        const node = nodes[i];

        // 进度回调
        onProgress?.(i + 1, total);

        // 跳过没有代码的节点
        if (!node.result?.code && !node.promptId) {
            continue;
        }

        node.isLoading = true;

        const executorResult = await executeAndFillResult(node, {
            ...context,
            logPrefix: `洞察${i + 1}`
        });

        node.isLoading = false;

        if (executorResult.success && executorResult.result) {
            node.result = executorResult.result;
        } else {
            node.error = executorResult.error;
        }
    }
}
