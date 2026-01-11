/**
 * 执行策略评估器
 * 根据设备能力和数据规模，决策最优执行策略
 */

import type { InsightNode } from '@/types/insightTree';
import { getPlatformAdapter, getPlatformConfig } from '@/platforms';
import { estimateTotalTime } from './insightComplexity';

/**
 * 执行模式
 */
export type ExecutionMode = 'serial' | 'parallel';

/**
 * 执行策略
 */
export interface ExecutionStrategy {
    /** 执行模式 */
    mode: ExecutionMode;
    /** 并发数 */
    concurrency: number;
    /** 是否按复杂度排序 */
    sortByComplexity: boolean;
    /** 是否启用采样 */
    enableSampling: boolean;
    /** 预估总时间（秒） */
    estimatedTime: number;
    /** 决策原因 */
    reason: string;
}

/**
 * 评估执行策略
 */
export function assessExecutionStrategy(
    nodes: InsightNode[],
    totalRows: number
): ExecutionStrategy {
    const adapter = getPlatformAdapter();
    const config = getPlatformConfig();

    const browserMemory = adapter.getAvailableMemory();
    const optimalConcurrency = adapter.getOptimalConcurrency(nodes);

    // 估算任务内存占用
    const taskMemories = nodes.map(node =>
        estimateTaskMemory(node.promptId, totalRows)
    );
    const maxTaskMemory = Math.max(...taskMemories, 100);

    // 计算并发执行的内存需求
    const parallel2Memory = maxTaskMemory * 2;
    const parallel3Memory = maxTaskMemory * 3;

    const ratio2 = parallel2Memory / browserMemory;
    const ratio3 = parallel3Memory / browserMemory;

    // 决策逻辑
    const { thresholds } = config;

    // 策略1：高性能并行
    if (
        ratio3 < thresholds.highPerfMemoryRatio &&
        totalRows < thresholds.highPerfRowLimit &&
        browserMemory >= thresholds.minMemoryForParallel
    ) {
        return {
            mode: 'parallel',
            concurrency: optimalConcurrency,
            sortByComplexity: true,
            enableSampling: false,
            estimatedTime: estimateTotalTime(nodes, optimalConcurrency, totalRows),
            reason: `高性能模式：内存充足(${browserMemory}MB)，全并发执行`
        };
    }

    // 策略2：半并行
    if (
        ratio2 < 0.5 &&
        totalRows < thresholds.highPerfRowLimit
    ) {
        return {
            mode: 'parallel',
            concurrency: 2,
            sortByComplexity: true,
            enableSampling: false,
            estimatedTime: estimateTotalTime(nodes, 2, totalRows),
            reason: `平衡模式：并发2个任务`
        };
    }

    // 策略3：串行 + 采样
    if (totalRows > thresholds.samplingThreshold) {
        return {
            mode: 'serial',
            concurrency: 1,
            sortByComplexity: true,
            enableSampling: true,
            estimatedTime: estimateTotalTime(nodes, 1, thresholds.samplingThreshold),
            reason: `采样模式：数据量过大(${totalRows}行)，采样到${thresholds.samplingThreshold}行`
        };
    }

    // 策略4：串行
    return {
        mode: 'serial',
        concurrency: 1,
        sortByComplexity: true,
        enableSampling: false,
        estimatedTime: estimateTotalTime(nodes, 1, totalRows),
        reason: `串行模式：内存有限(${browserMemory}MB)`
    };
}

/**
 * 估算单个任务的内存占用（MB）
 */
function estimateTaskMemory(_promptId: string, totalRows: number): number {
    // 🔧 修复BigInt错误：确保totalRows是Number类型
    const rows = typeof totalRows === 'bigint' ? Number(totalRows) : totalRows;

    // 简化估算：每行3列 × 8字节 × 3倍pandas开销
    const bytesPerRow = 3 * 8 * 3;
    const memoryBytes = rows * bytesPerRow;
    return memoryBytes / (1024 * 1024);
}
