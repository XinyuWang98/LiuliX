/**
 * 列名校验工具模块
 * 
 * 统一管理列名校验逻辑，确保 Router 和 Inflater 使用相同的白名单机制
 * 避免维护时修改 A 忘记修改 B 的问题
 */

/**
 * 非列名参数白名单（函数名、配置参数等）
 * 
 * 这些参数不应该被校验为列名：
 * - 聚合函数名：agg_func
 * - 时间参数：period
 * - 窗口参数：window, window_size
 * - 阈值参数：threshold, iqr_multiplier
 * - 分箱参数：bins
 * - 算法方法：method
 */
export const NON_COLUMN_PARAMS = new Set([
    'agg_func',      // worker-groupby: 聚合函数名 (sum/mean/median/count)
    'period',        // worker-time-decomposition: 时间周期
    'window',        // 窗口大小
    'window_size',   // 滚动窗口大小
    'threshold',     // 阈值参数
    'bins',          // 分箱数
    'method',        // 算法方法
    'iqr_multiplier' // IQR 倍数
]);

/**
 * 判断参数键是否为列名参数
 * 
 * @param key 参数键
 * @returns true 如果是列名参数，false 如果是非列名参数（如函数名、配置参数）
 * 
 * @example
 * isColumnParam('group_col')  // true
 * isColumnParam('agg_func')   // false
 */
export function isColumnParam(key: string): boolean {
    return !NON_COLUMN_PARAMS.has(key);
}

/**
 * 从参数对象中提取列名参数的值
 * 
 * 架构改进（v2.0）：
 * - 🆕 优先使用 inputVariables（配置驱动），避免硬编码
 * - 🆕 使用白名单机制，跳过非列名参数（如 agg_func）
 * - 🔄 兼容旧版：如果未提供 inputVariables，降级到硬编码 columnKeys
 * 
 * @param params 参数对象
 * @param inputVariables 可选：prompt 的 inputVariables（优先使用）
 * @returns 提取的列名数组
 * 
 * @example
 * extractColumnParams(
 *   { group_col: 'payment_method', value_col: 'total_amount', agg_func: 'sum' },
 *   ['group_col', 'value_col', 'agg_func']
 * )
 * // 返回: ['payment_method', 'total_amount']  // ✅ 跳过 agg_func
 */
export function extractColumnParams(
    params: Record<string, unknown>,
    inputVariables?: string[]
): string[] {
    const columns: string[] = [];

    // 🆕 架构改进：优先使用 prompt.inputVariables（配置驱动）
    if (inputVariables && inputVariables.length > 0) {
        // 🎯 核心逻辑：从 params 中提取 inputVariables 对应的列名
        for (const key of inputVariables) {
            // 🆕 跳过非列名参数（白名单机制）
            if (!isColumnParam(key)) {
                continue;
            }

            const value = params[key];

            if (typeof value === 'string') {
                // 单列参数
                columns.push(value);
            } else if (Array.isArray(value)) {
                // 数组类型的列名参数（如 feature_cols）
                for (const item of value) {
                    if (typeof item === 'string') {
                        columns.push(item);
                    }
                }
            }
        }

        return columns;
    }

    // 🔄 降级处理：如果未提供 inputVariables，使用硬编码 columnKeys（向后兼容）
    const columnKeys = [
        // 通用单列字段
        'column_name', 'col_x', 'col_y', 'x_column', 'y_column',
        // 特定用途单列
        'date_col', 'value_col', 'group_col', 'category_col', 'metric_col',
        // 回归/ML相关
        'target_col', 'feature_col',
        // 聚类相关（可能是数组）
        'cluster_col'
    ];

    // 数组类型的列名字段
    const arrayColumnKeys = [
        'feature_cols', 'group_cols', 'category_cols'
    ];

    // 提取单列参数
    for (const key of columnKeys) {
        if (params[key] && typeof params[key] === 'string') {
            columns.push(params[key] as string);
        }
    }

    // 提取数组类型的列名参数
    for (const key of arrayColumnKeys) {
        if (Array.isArray(params[key])) {
            const arr = params[key] as unknown[];
            for (const item of arr) {
                if (typeof item === 'string') {
                    columns.push(item);
                }
            }
        }
    }

    return columns;
}
