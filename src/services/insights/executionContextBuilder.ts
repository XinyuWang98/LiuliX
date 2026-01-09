/**
 * Execution Context Builder
 * 
 * 为洞察代码执行构建标准化的上下文对象
 * 
 * @author AntiGravity
 * @date 2026-01-09
 */

import { ExecutionContext } from './executor';

/**
 * ExecutionContext构建选项
 */
export interface ExecutionContextOptions {
    /** 数据表名称 (必需) */
    tableName: string;
    /** 总行数 (可选,用于内存评估) */
    totalRows?: number;
    /** 是否启用质量门控 (可选,默认false) */
    enableQualityGate?: boolean;
    /** 日志前缀 (可选,默认'Insight') */
    logPrefix?: string;
}

/**
 * 构建ExecutionContext对象
 * 
 * 提供默认值和参数验证,简化ExecutionContext对象的创建
 * 
 * @param options 构建选项
 * @returns 标准化的ExecutionContext对象
 * @throws Error 如果tableName为空
 * 
 * @example
 * ```typescript
 * // 基础用法
 * const context = buildExecutionContext({
 *     tableName: 't_123_working'
 * });
 * 
 * // 完整配置
 * const context = buildExecutionContext({
 *     tableName: 't_123_working',
 *     totalRows: 1000,
 *     enableQualityGate: true,
 *     logPrefix: 'SilentTrigger'
 * });
 * ```
 */
export function buildExecutionContext(
    options: ExecutionContextOptions
): ExecutionContext {
    // 验证必需字段
    if (!options.tableName) {
        throw new Error('buildExecutionContext: tableName is required');
    }

    return {
        tableName: options.tableName,
        totalRows: options.totalRows,
        enableQualityGate: options.enableQualityGate ?? false,  // 默认不启用
        logPrefix: options.logPrefix || 'Insight'  // 默认前缀
    };
}

/**
 * 为批量洞察执行创建ExecutionContext (启用质量门控)
 */
export function buildBatchExecutionContext(
    tableName: string,
    totalRows?: number
): ExecutionContext {
    return buildExecutionContext({
        tableName,
        totalRows,
        enableQualityGate: true,
        logPrefix: '洞察'
    });
}

/**
 * 为EDA闭环创建ExecutionContext (不启用质量门控)
 */
export function buildEDAExecutionContext(
    tableName: string
): ExecutionContext {
    return buildExecutionContext({
        tableName,
        enableQualityGate: false,
        logPrefix: 'SilentTrigger'
    });
}
