/**
 * 内存评估器
 * 根据数据规模和浏览器可用内存，决策最佳执行模式
 */

import { logger } from './logger';
import {
    getBrowserMemory,
    RESOURCE_LIMITS,
    checkAvailableMemory
} from './resourceLimits';

/** 执行模式 */
export type ExecutionMode = 'full' | 'sampled' | 'aggregated';

/** 内存评估结果 */
export interface MemoryAssessment {
    /** 执行模式 */
    mode: ExecutionMode;
    /** 预估内存占用（MB） */
    estimatedMemory: number;
    /** 浏览器可用内存（MB） */
    browserMemory: number;
    /** 内存占比 */
    memoryRatio: number;
    /** 警告信息 */
    warningMessage?: string;
}

/** 内存预算配置 */
interface MemoryBudget {
    /** full模式阈值（20%） */
    full: number;
    /** sampled模式阈值（50%） */
    sampled: number;
}

const DEFAULT_BUDGET: MemoryBudget = {
    full: 0.2,    // 20%以内使用全量
    sampled: 0.5  // 50%以内使用采样
};

// 默认浏览器内存（当performance.memory不可用时）
const DEFAULT_BROWSER_MEMORY = 4096; // 4GB

/**
 * 评估内存需求并决策执行模式
 * @param totalRows 总行数
 * @param columns AI选择的列名列表
 * @returns 内存评估结果
 */
export async function assessMemoryBeforeExecution(
    totalRows: number,
    columns: string[]
): Promise<MemoryAssessment> {
    try {
        // 计算数据点
        const columnCount = columns.length;
        const totalRowsNum = Number(totalRows);  // ✅ BigInt转Number
        const dataPoints = totalRowsNum * columnCount;

        // 计算预估内存占用（MB）
        // 每个数据点：8 bytes (number) × 3 (pandas开销系数)
        const bytesPerDataPoint = 8 * 3;
        const estimatedBytes = dataPoints * bytesPerDataPoint;
        const estimatedMemory = estimatedBytes / (1024 * 1024); // 转MB

        // 获取浏览器可用内存
        const browserMemory = getBrowserMemory();

        // 计算内存占比
        const memoryRatio = estimatedMemory / browserMemory;

        // 决策执行模式
        let mode: ExecutionMode;
        let warningMessage: string | undefined;

        if (memoryRatio < DEFAULT_BUDGET.full) {
            mode = 'full';
            logger.log('内存评估', '全量模式', {
                data: {
                    totalRows,
                    columns: columnCount,
                    estimatedMemory: `${estimatedMemory.toFixed(2)}MB`,
                    ratio: `${(memoryRatio * 100).toFixed(1)}%`
                }
            });
        } else if (memoryRatio < DEFAULT_BUDGET.sampled) {
            mode = 'sampled';
            warningMessage = `数据量较大，将使用采样模式（预估内存: ${estimatedMemory.toFixed(0)}MB）`;
            logger.log('内存评估', '采样模式', {
                data: {
                    totalRows,
                    columns: columnCount,
                    estimatedMemory: `${estimatedMemory.toFixed(2)}MB`,
                    ratio: `${(memoryRatio * 100).toFixed(1)}%`
                }
            });
        } else {
            mode = 'aggregated';
            warningMessage = `数据量超大，将使用DuckDB预聚合模式（预估内存: ${estimatedMemory.toFixed(0)}MB）`;
            logger.log('内存评估', 'DuckDB预聚合模式', {
                data: {
                    totalRows,
                    columns: columnCount,
                    estimatedMemory: `${estimatedMemory.toFixed(2)}MB`,
                    ratio: `${(memoryRatio * 100).toFixed(1)}%`
                }
            });
        }

        // ❗ 安全上限检查：超过70%强制降级
        if (memoryRatio > RESOURCE_LIMITS.SAFETY_LIMITS.MEMORY_HARD_LIMIT) {
            logger.warn('内存评估', `内存超限${(memoryRatio * 100).toFixed(0)}% > 70%，强制aggregated模式`);
            mode = 'aggregated';
            warningMessage = '内存不足，已强制降级到预聚合模式';
        }

        // 检查可用内存
        const freeMemory = checkAvailableMemory();
        if (freeMemory < RESOURCE_LIMITS.SAFETY_LIMITS.MIN_FREE_MEMORY) {
            logger.warn('内存评估', `可用内存不足${(freeMemory / 1024 / 1024).toFixed(0)}MB < 500MB`);
            mode = 'aggregated';
            warningMessage = '系统内存不足，已降级到预聚合模式';
        }

        return {
            mode,
            estimatedMemory,
            browserMemory,
            memoryRatio,
            warningMessage
        };

    } catch (error) {
        logger.warn('内存评估', '评估失败，降级到采样模式', error);

        // 降级策略：出错时使用采样模式
        return {
            mode: 'sampled',
            estimatedMemory: 0,
            browserMemory: DEFAULT_BROWSER_MEMORY,
            memoryRatio: 0,
            warningMessage: '内存评估失败，已降级到采样模式'
        };
    }
}



/**
 * 计算推荐采样行数（基于内存预算）
 * @param totalRows 总行数
 * @param columns 列数
 * @param budget 内存预算比例（默认0.2，即20%）
 * @returns 推荐采样行数
 */
export function calculateRecommendedSampleRows(
    totalRows: number,
    columns: number,
    budget: number = 0.2
): number {
    const browserMemory = getBrowserMemory();
    const targetMemoryMB = browserMemory * budget;
    const bytesPerDataPoint = 8 * 3;
    const bytesPerRow = columns * bytesPerDataPoint;
    const targetMemoryBytes = targetMemoryMB * 1024 * 1024;

    const recommendedRows = Math.floor(targetMemoryBytes / bytesPerRow);

    // 不超过总行数
    return Math.min(recommendedRows, totalRows);
}

/**
 * 🚫 已废弃（Web版MVP）- 改为固定10万行上限（2026-01-14）
 * 
 * Pyodide专用：根据设备内存和列数动态计算最大安全行数
 * 
 * @deprecated Web版MVP已改为固定常量MAX_PYODIDE_ROWS=100000
 * @reason Pyodide WASM内存限制导致动态评估收益有限，复杂度与稳定性不成正比
 * @preserve 保留此函数作为未来Native离线版参考（CPython无WASM限制）
 * 
 * @param columnCount 数据列数
 * @returns 最大行数（考虑Pyodide内存开销和安全系数）
 * 
 * @example Native版使用示例（未来）
 * ```typescript
 * const maxRows = calculateMaxRowsForPyodide(columnCount);
 * ```
 */
export function calculateMaxRowsForPyodide(columnCount: number): number {
    // 动态获取浏览器内存
    const browserMemory = getBrowserMemory();
    const memoryGB = browserMemory / (1024 ** 3);

    // 6档精细化预算比例（严格遵循55-专题-内存评估与采样策略规范）
    let budgetRatio = 0.1; // 默认10% (低配)
    if (memoryGB >= 32) {
        budgetRatio = 0.4;  // 🟣 极致 32GB+    → 40%
    } else if (memoryGB >= 24) {
        budgetRatio = 0.35; // 🔵 旗舰 24-32GB → 35%
    } else if (memoryGB >= 16) {
        budgetRatio = 0.3;  // 🟢 高性能 16-24GB → 30%
    } else if (memoryGB >= 8) {
        budgetRatio = 0.2;  // 🟡 主流 8-16GB  → 20%
    } else if (memoryGB >= 4) {
        budgetRatio = 0.15; // 🟠 标准 4-8GB   → 15%
    }
    // <4GB 保持默认10%

    // 🔧 Pyodide绝对内存上限：Worker进程限制，不管设备多大都不超过256MB
    const PYODIDE_MAX_MEMORY_MB = 256;  // 保守值，确保不会MemoryError
    const dynamicMemoryMB = (browserMemory / (1024 * 1024)) * budgetRatio;
    const availableMemoryMB = Math.min(dynamicMemoryMB, PYODIDE_MAX_MEMORY_MB);

    // 每个数据点：8 bytes (number) × 6-8 (pandas+matplotlib+临时变量开销)
    // 🔧 修复：原3倍系数导致MemoryError，基于实际测试调整为6-8倍
    const OVERHEAD_MULTIPLIER = columnCount > 10 ? 8 : 6;  // 列多时更保守
    const BYTES_PER_DATAPOINT = 8 * OVERHEAD_MULTIPLIER;
    const SAFETY_MARGIN = 0.6; // 安全系数60%，保留40%缓冲（更保守）

    const availableBytes = availableMemoryMB * 1024 * 1024 * SAFETY_MARGIN;
    const maxDataPoints = availableBytes / BYTES_PER_DATAPOINT;
    const maxRows = Math.floor(maxDataPoints / columnCount);

    // ✅ 信任动态计算作为唯一真理来源（6-8倍系数+60%安全系数已足够保守）
    const MIN_ROWS = 1000;  // 最小保护：避免极端情况下行数过少

    return Math.max(MIN_ROWS, maxRows);
}

