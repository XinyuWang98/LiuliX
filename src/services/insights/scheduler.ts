/**
 * 执行调度器
 * 根据策略执行串行或并行任务
 */

import type { InsightNode } from '@/types/insightTree';
import { sortNodesByComplexity } from '@/utils/insightComplexity';
import { logger } from '@/utils/logger';

/**
 * 任务执行器类型定义 (返回 Promise)
 */
export type TaskRunner = (node: InsightNode) => Promise<void>;

/**
 * 进度回调函数
 */
export type ProgressCallback = (current: number, total: number) => void;

/**
 * 节点完成回调函数
 */
export type NodeCompleteCallback = (node: InsightNode) => void;

/**
 * 串行执行
 */
export async function executeSerial(
    nodes: InsightNode[],
    taskRunner: TaskRunner
): Promise<void> {

    logger.group('AI服务', `串行执行 ${nodes.length} 个洞察`);

    for (const node of nodes) {
        try {
            node.status = 'loading';

            logger.log('AI服务', `执行: ${node.title}`);

            // ✅ 使用传入的 taskRunner 执行任务
            await taskRunner(node);

        } catch (error) {
            node.status = 'error';
            node.error = error instanceof Error ? error.message : String(error);
            // onNodeComplete 已移除，由 taskRunner 内部处理或忽略

            logger.error('AI服务', `执行失败: ${node.title}`, error);
        }
    }

    logger.groupEnd();
}

/**
 * 并行执行
 */
export async function executeParallel(
    nodes: InsightNode[],
    concurrency: number,
    taskRunner: TaskRunner
): Promise<void> {

    logger.group('AI服务', `并发执行 ${nodes.length} 个洞察 (并发数: ${concurrency})`);

    // 按复杂度排序（轻量级在前）
    const sortedNodes = sortNodesByComplexity(nodes);

    // 分批执行
    const batches: InsightNode[][] = [];
    for (let i = 0; i < sortedNodes.length; i += concurrency) {
        batches.push(sortedNodes.slice(i, i + concurrency));
    }

    for (const batch of batches) {
        logger.log('AI服务', `执行批次: ${batch.map(n => n.title).join(', ')}`);

        await Promise.all(
            batch.map(async (node, index) => {
                // 🎬 节点执行计时
                const nodeStartTime = performance.now();
                const batchIndex = batches.indexOf(batch) + 1;

                logger.log('AI服务', `[Scheduler] 🚀 洞察开始执行`, {
                    data: {
                        洞察: node.title,
                        批次: `${batchIndex}/${batches.length}`,
                        索引: index,
                        promptId: node.promptId || 'N/A'
                    }
                });

                try {
                    node.status = 'loading';

                    // ⏱️ 代码执行计时
                    const execStartTime = performance.now();

                    // ✅ 使用传入的 taskRunner 执行任务
                    await taskRunner(node);

                    const execDuration = performance.now() - execStartTime;

                    logger.log('AI服务', `[Scheduler] ✅ 洞察执行成功`, {
                        data: {
                            洞察: node.title,
                            执行耗时: `${execDuration.toFixed(0)}ms`,
                            总耗时: `${(performance.now() - nodeStartTime).toFixed(0)}ms`
                        }
                    });

                } catch (error) {
                    node.status = 'error';
                    node.error = error instanceof Error ? error.message : String(error);
                    // onNodeComplete 已移除

                    logger.error('AI服务', `执行失败: ${node.title}`, error);
                }
            })
        );
    }

    logger.groupEnd();
}
