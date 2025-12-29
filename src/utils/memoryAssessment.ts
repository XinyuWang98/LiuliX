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
 * 计算Pyodide可安全加载的最大行数
 * 根据列数和浏览器实际内存动态计算，避免硬编码魔法数字
 * 
 * @param columnCount 列数
 * @returns 最大行数
 */
export function calculateMaxRowsForPyodide(columnCount: number): number {
    // 动态获取浏览器内存
    const browserMemory = getBrowserMemory();
    const memoryGB = browserMemory / (1024 ** 3);

    // 根据内存分层调整预算比例
    let budgetRatio = 0.2; // 默认20%
    if (memoryGB >= 16) {
        budgetRatio = 0.25; // 16GB+ → 25%
    } else if (memoryGB >= 8) {
        budgetRatio = 0.2;  // 8GB  → 20%
    } else if (memoryGB >= 4) {
        budgetRatio = 0.15; // 4GB  → 15%
    } else {
        budgetRatio = 0.1;  // <4GB → 10%
    }

    const availableMemoryMB = (browserMemory / (1024 * 1024)) * budgetRatio;

    // 每个数据点：8 bytes (number) × 3 (pandas开销系数)
    const BYTES_PER_DATAPOINT = 8 * 3;
    const SAFETY_MARGIN = 0.7; // 安全系数70%，保留30%缓冲

    const availableBytes = availableMemoryMB * 1024 * 1024 * SAFETY_MARGIN;
    const maxDataPoints = availableBytes / BYTES_PER_DATAPOINT;
    const maxRows = Math.floor(maxDataPoints / columnCount);

    // 动态边界：根据内存调整
    const MIN_ROWS = 1000;
    const MAX_ROWS = memoryGB >= 16 ? 200000 :
        memoryGB >= 8 ? 100000 :
            memoryGB >= 4 ? 50000 : 30000;

    return Math.max(MIN_ROWS, Math.min(maxRows, MAX_ROWS));
}

