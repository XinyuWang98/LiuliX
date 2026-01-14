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
export async function assessExecutionStrategy(
    nodes: InsightNode[],
    totalRows: number,
    // @ts-expect-error - 保留参数以兼容调用方，Native版恢复动态评估时会用到
    columnCount: number
): Promise<ExecutionStrategy> {
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

    // 🆕 判断是否需要采样（固定上限策略，Web版MVP：2026-01-14）
    // 注：动态评估已废弃，详见docs/01-架构设计/05-架构-动态内存评估与采样策略.md
    const MAX_PYODIDE_ROWS = 100000;  // Pyodide内存限制，固定10万行上限
    const maxRows = MAX_PYODIDE_ROWS;
    const needsSampling = totalRows > maxRows;
    const effectiveRows = needsSampling ? maxRows : totalRows;

    // ========== 策略1：高性能并行（优先级1）==========
    if (
        ratio3 < thresholds.highPerfMemoryRatio &&
        browserMemory >= thresholds.minMemoryForParallel
    ) {
        return {
            mode: 'parallel',
            concurrency: optimalConcurrency,
            sortByComplexity: true,
            enableSampling: needsSampling,  // 🆕 大数据集也支持并行+采样
            estimatedTime: estimateTotalTime(nodes, optimalConcurrency, effectiveRows),
            reason: needsSampling
                ? `高性能并行+采样：内存${browserMemory}MB充足，${optimalConcurrency}并发，采样${effectiveRows}行`
                : `高性能并行：内存${browserMemory}MB充足，${optimalConcurrency}并发`
        };
    }

    // ========== 策略2：半并行+采样（优先级2）==========
    if (
        ratio2 < 0.5 &&
        browserMemory >= 8000  // 至少8GB
    ) {
        return {
            mode: 'parallel',
            concurrency: 2,
            sortByComplexity: true,
            enableSampling: needsSampling,
            estimatedTime: estimateTotalTime(nodes, 2, effectiveRows),
            reason: needsSampling
                ? `平衡并行+采样：2并发，采样${effectiveRows}行`
                : `平衡并行：2并发`
        };
    }

    // ========== 策略3：串行+采样（内存不足时）==========
    if (needsSampling) {
        return {
            mode: 'serial',
            concurrency: 1,
            sortByComplexity: true,
            enableSampling: true,
            estimatedTime: estimateTotalTime(nodes, 1, effectiveRows),
            reason: `串行+采样：内存有限(${browserMemory}MB)，采样${effectiveRows}行`
        };
    }

    // ========== 策略4：串行（兜底）==========
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
