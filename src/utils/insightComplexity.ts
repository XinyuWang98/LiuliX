/**
 * 洞察复杂度评分系统
 * 基于Worker Prompt的计算复杂度进行排序和时间预估
 */

import { WORKER_COMPLEXITY_SCORES } from './insightComplexity.generated';
import type { InsightNode } from '@/types/insightTree';

/**
 * 获取Worker的复杂度评分
 */
export function getComplexityScore(promptId: string): number {
    return WORKER_COMPLEXITY_SCORES[promptId] || 50;  // 默认中等复杂度
}

/**
 * 预估单个任务的执行时间（秒）
 */
export function estimateExecutionTime(
    node: InsightNode,
    totalRows: number
): number {
    const score = getComplexityScore(node.promptId);

    // 基础时间（秒）= 复杂度评分 / 10
    const baseTime = score / 10;

    // 数据规模系数
    let dataFactor = 1.0;
    if (totalRows > 100000) {
        dataFactor = 3.0;    // 超大数据集
    } else if (totalRows > 50000) {
        dataFactor = 2.0;    // 大数据集
    } else if (totalRows > 10000) {
        dataFactor = 1.5;    // 中等数据集
    }

    return baseTime * dataFactor;
}

/**
 * 对洞察节点按复杂度排序（轻量级在前）
 */
export function sortNodesByComplexity(nodes: InsightNode[]): InsightNode[] {
    return [...nodes].sort((a, b) => {
        const scoreA = getComplexityScore(a.promptId);
        const scoreB = getComplexityScore(b.promptId);
        return scoreA - scoreB;  // 升序：轻量级在前
    });
}

/**
 * 预估总执行时间
 */
export function estimateTotalTime(
    nodes: InsightNode[],
    concurrency: number,
    totalRows: number
): number {
    const times = nodes.map(node => estimateExecutionTime(node, totalRows));

    if (concurrency === 1) {
        // 串行：累加所有时间
        return times.reduce((sum, t) => sum + t, 0);
    } else {
        // 并行：计算关键路径时间
        // 简化模型：将任务分配到不同Worker，取最大值
        const workerTimes: number[] = Array(concurrency).fill(0);
        const sortedTimes = [...times].sort((a, b) => b - a);  // 降序

        sortedTimes.forEach((time, i) => {
            const workerIdx = i % concurrency;
            workerTimes[workerIdx] += time;
        });

        return Math.max(...workerTimes);
    }
}
