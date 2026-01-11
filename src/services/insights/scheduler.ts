/**
 * 执行调度器
 * 根据策略执行串行或并行任务
 */

import type { InsightNode } from '@/types/insightTree';
import type { ExecutionContext } from '@/platforms/types';
import { getPlatformAdapter } from '@/platforms';
import { sortNodesByComplexity } from '@/utils/insightComplexity';
import { logger } from '@/utils/logger';

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
    context: ExecutionContext,
    onNodeComplete?: NodeCompleteCallback
): Promise<void> {
    const adapter = getPlatformAdapter();

    logger.group('AI服务', `串行执行 ${nodes.length} 个洞察`);

    for (const node of nodes) {
        try {
            node.status = 'loading';
            onNodeComplete?.(node);

            logger.log('AI服务', `执行: ${node.title}`);
            const result = await adapter.executeCode(node.code || '', context);

            node.status = 'completed';
            node.result = result;
            onNodeComplete?.(node);

        } catch (error) {
            node.status = 'error';
            node.error = error instanceof Error ? error.message : String(error);
            onNodeComplete?.(node);

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
    context: ExecutionContext,
    concurrency: number,
    onNodeComplete?: NodeCompleteCallback
): Promise<void> {
    const adapter = getPlatformAdapter();

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
            batch.map(async (node) => {
                try {
                    node.status = 'loading';
                    onNodeComplete?.(node);

                    const result = await adapter.executeCode(node.code || '', context);

                    node.status = 'completed';
                    node.result = result;
                    onNodeComplete?.(node);

                } catch (error) {
                    node.status = 'error';
                    node.error = error instanceof Error ? error.message : String(error);
                    onNodeComplete?.(node);

                    logger.error('AI服务', `执行失败: ${node.title}`, error);
                }
            })
        );
    }

    logger.groupEnd();
}
