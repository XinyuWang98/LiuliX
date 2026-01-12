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
        totalRows: rawTotalRows,  // 🔍 不设默认值，保留原始值
        enableQualityGate = false,
        logPrefix = 'Executor'
    } = context;

    // 🔍 关键修复：检查 totalRows 是否传递
    const totalRows = rawTotalRows || 0;
    if (!rawTotalRows) {
        logger.warn('AI服务', `[${logPrefix}] ⚠️ totalRows 未传递，使用默认值0（可能影响内存评估）`, {
            data: { context }
        });
    }

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
        logger.log('AI服务', `[${logPrefix}] 内存评估准备`, {
            data: {
                totalRows,
                columnsUsed: node.columnsUsed
            }
        });

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
 * 批量执行洞察节点（🆕 策略自适应版本）
 * 
 * @param nodes 洞察节点数组
 * @param context 执行上下文
 * @param onProgress 进度回调
 * @param onNodeComplete 节点完成回调（流式渲染）
 */
export async function executeBatchNodes(
    nodes: InsightNode[],
    context: ExecutionContext,
    _onProgress?: (current: number, total: number) => void,
    onNodeComplete?: (node: InsightNode) => void
): Promise<void> {
    const total = nodes.length;
    const batchStartTime = performance.now();

    logger.group('AI服务', `[Executor] 🚀 批量执行 ${total} 个洞察`);

    // ========== 🆕 步骤1：策略评估 ==========
    const { assessExecutionStrategy } = await import('@/utils/executionStrategy');
    const { sortNodesByComplexity } = await import('@/utils/insightComplexity');
    const { executeSerial, executeParallel } = await import('./scheduler');

    const strategy = assessExecutionStrategy(nodes, context.totalRows || 0);

    logger.log('AI服务', `[Executor] 📊 策略评估完成`, {
        data: {
            mode: strategy.mode,
            concurrency: strategy.concurrency,
            sortByComplexity: strategy.sortByComplexity,
            enableSampling: strategy.enableSampling,
            estimatedTime: `${strategy.estimatedTime.toFixed(1)}秒`,
            reason: strategy.reason
        }
    });

    // ========== 🆕 步骤2：复杂度排序 ==========
    const sortedNodes = strategy.sortByComplexity
        ? sortNodesByComplexity(nodes)
        : nodes;

    if (strategy.sortByComplexity) {
        logger.log('AI服务', `[Executor] 🔄 已按复杂度排序（轻量级在前）`);
    }

    // ========== 🆕 步骤3：采样处理 ==========
    if (strategy.enableSampling) {
        logger.log('AI服务', `[Executor] ⚠️ 启用采样模式`, {
            data: { originalRows: context.totalRows }
        });

        // 标记所有节点为采样模式
        sortedNodes.forEach(node => {
            // @ts-ignore - 临时添加采样标记
            node.isSampled = true;
            // @ts-ignore
            node.sampleSize = 5000;
            // @ts-ignore
            node.originalRows = context.totalRows;
        });
    }

    // ========== 🆕 步骤4：执行调度 ==========
    // 节点完成回调包装（集成原有逻辑）
    const wrappedCallback = async (node: InsightNode) => {
        // 执行原有的executeAndFillResult逻辑
        const executorResult = await executeAndFillResult(node, {
            ...context,
            logPrefix: `洞察-${node.title}`
        });

        if (executorResult.success && executorResult.result) {
            node.result = executorResult.result;
            node.status = 'completed';
        } else {
            node.error = executorResult.error;
            node.status = 'error';
        }

        // 调用外部回调（用于流式渲染）
        onNodeComplete?.(node);
    };

    // 根据策略选择执行模式
    if (strategy.mode === 'parallel') {
        await executeParallel(
            sortedNodes,
            context,
            strategy.concurrency,
            wrappedCallback
        );
    } else {
        await executeSerial(
            sortedNodes,
            context,
            wrappedCallback
        );
    }

    // ========== 步骤5：统计总结 ==========
    const totalDuration = performance.now() - batchStartTime;
    const successful = nodes.filter(n => n.result && !n.error).length;

    logger.log('AI服务', `[Executor] 🏁 批量执行完成`, {
        data: {
            total,
            successful,
            failed: total - successful,
            duration: `${totalDuration.toFixed(1)}ms`,
            avgPerNode: `${(totalDuration / total).toFixed(1)}ms`
        }
    });

    logger.groupEnd();
}
