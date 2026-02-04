/**
 * 数据传输方案选择器
 * 根据数据规模和系统能力自动选择最优传输方式（JSON vs Arrow）
 */

import { logger } from './logger';

/** 传输方法类型 */
export type TransferMethod = 'JSON' | 'ARROW';  // 移除 ARROW_SAMPLED

/** 传输策略 */
export interface TransferStrategy {
    /** 传输方法 */
    method: TransferMethod;
    /** 最大行数限制 */
    maxRows: number;
    /** 决策原因 */
    reason: string;
    // ✅ 移除 needsSampling，采样决策统一在 duckdbIngestion.ts
}

/** 策略阈值配置 */
const STRATEGY_THRESHOLDS = {
    /** 小数据集上限（<= 此值使用 JSON） */
    SMALL_DATA_LIMIT: 50000,
    // 注意：Arrow 上限由 DuckDB 动态内存评估决定，无需硬编码
} as const;

/**
 * 选择最优数据传输方案（简化版）
 * 
 * ✅ 2026-02-04 简化：仅负责选择传输方式，不再决策采样
 * - 采样决策统一在 duckdbIngestion.ts（基于动态内存评估）
 * - Arrow 策略仅选择 JSON vs Arrow（传输优化）
 * - 传入 totalRows 已是 workingTable 行数（已采样）
 * 
 * @param totalRows 总行数（注意：这是 workingTable 的行数，已完成采样）
 * @param columnCount 列数（可选，用于日志）
 * @returns 传输策略
 */
export async function selectTransferStrategy(
    totalRows: number,
    columnCount: number = 10
): Promise<TransferStrategy> {
    // 1. 检查 Arrow 可用性
    const arrowAvailable = await checkArrowAvailability();

    logger.log('AI服务', '评估传输方案', {
        data: {
            totalRows,
            columnCount,
            arrowAvailable
        }
    });

    // 2. 小数据集：使用 JSON（简单快速）
    if (totalRows <= STRATEGY_THRESHOLDS.SMALL_DATA_LIMIT) {
        return {
            method: 'JSON',
            maxRows: totalRows,  // 全部传输（已采样）
            reason: `小数据集（${totalRows.toLocaleString()} 行 ≤ ${STRATEGY_THRESHOLDS.SMALL_DATA_LIMIT.toLocaleString()}），JSON 传输简单高效`,
        };
    }

    // 3. 中大数据集：优先使用 Arrow（性能提升明显）
    if (arrowAvailable) {
        return {
            method: 'ARROW',
            maxRows: totalRows,  // 全部传输（已采样）
            reason: `中大数据集（${totalRows.toLocaleString()} 行），Arrow 零拷贝传输，性能提升 4-5x`,
        };
    }

    // 4. 降级：Arrow 不可用 → 使用 JSON
    logger.warn('AI服务', 'Arrow 不可用，降级到 JSON', {
        reason: 'Arrow 加载失败'
    });

    return {
        method: 'JSON',
        maxRows: totalRows,
        reason: `Arrow 不可用，降级到 JSON（${totalRows.toLocaleString()} 行）`,
    };
}

/**
 * 检查 Arrow 传输是否可用
 * @returns Promise<boolean> Arrow 是否可用
 */
export async function checkArrowAvailability(): Promise<boolean> {
    try {
        // 检查 Pyodide 是否已加载 pyarrow
        const { pyodideManager } = await import('../services/PyodideManager');

        // 等待 Pyodide 就绪（带超时）
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Pyodide timeout')), 5000)
        );

        await Promise.race([
            pyodideManager.waitForReady(),
            timeout
        ]);

        // 简单测试：尝试导入 pyarrow
        const result = await pyodideManager.runPython(`
import sys
'pyarrow' in sys.modules or __import__('pyarrow')
print('OK')
`);

        return result?.includes('OK') ?? false;

    } catch (error) {
        logger.warn('AI服务', 'Arrow 可用性检查失败', error);
        return false;
    }
}

/**
 * 获取策略阈值配置（用于测试和调试）
 */
export function getStrategyThresholds() {
    return { ...STRATEGY_THRESHOLDS };
}
