/**
 * 列名校验工具
 * 用于验证 AI 返回的参数中的列名是否存在于实际数据集
 */

import { logger } from './logger';

/**
 * 列名校验结果
 */
export interface ColumnValidationResult {
    valid: boolean;
    invalidColumns?: string[];
}

/**
 * 验证参数对象中的列名是否都存在于有效列名列表中
 * 
 * @param params AI 返回的参数对象（如 { column_name: 'Price', col_x: 'Area' }）
 * @param validColumns 有效的列名列表
 * @returns 校验结果
 * 
 * @example
 * const result = validateColumnsExist(
 *     { column_name: 'Price', col_x: 'Area' },
 *     ['Price', 'Area', 'Location']
 * );
 * // result.valid === true
 */
export function validateColumnsExist(
    params: Record<string, unknown>,
    validColumns: string[]
): ColumnValidationResult {
    const invalidColumns: string[] = [];

    // 🆕 调试日志：记录校验开始
    logger.log('列名校验', '开始校验参数列名', {
        data: {
            params,
            validColumns,
            validColumnsCount: validColumns.length
        }
    });

    // 常见的列名参数键
    const columnKeys = [
        'column_name',
        'col_x',
        'col_y',
        'date_col',
        'value_col',
        'group_col',
        'feature_cols'  // 数组形式
    ];

    for (const key of columnKeys) {
        if (params[key]) {
            const paramValue = params[key];

            // 🆕 调试日志：记录当前检查的参数
            logger.log('列名校验', `检查参数键: ${key}`, {
                data: { key, value: paramValue, type: typeof paramValue }
            });

            // 处理数组参数（如 feature_cols: ['col1', 'col2']）
            if (Array.isArray(paramValue)) {
                const invalid = paramValue.filter(col => !validColumns.includes(String(col)));
                if (invalid.length > 0) {
                    // 🆕 调试日志：记录数组中的无效列
                    logger.warn('列名校验', `数组参数 ${key} 包含无效列`, {
                        data: { invalid, total: paramValue }
                    });
                }
                invalidColumns.push(...invalid.map(String));
            }
            // 处理字符串参数（如 column_name: 'Price'）
            else if (typeof paramValue === 'string' && !validColumns.includes(paramValue)) {
                // 🆕 调试日志：记录字符串无效列
                logger.warn('列名校验', `字符串参数 ${key} 无效`, {
                    data: { key, value: paramValue }
                });
                invalidColumns.push(paramValue);
            }
        }
    }

    const valid = invalidColumns.length === 0;

    // 🆕 调试日志：记录最终结果
    logger.log('列名校验', `校验完成: ${valid ? '✅ 通过' : '❌ 失败'}`, {
        data: { valid, invalidColumns, totalChecked: Object.keys(params).length }
    });

    if (!valid) {
        logger.warn('列名校验', '检测到无效列名', {
            data: { invalidColumns, validColumns, params }
        });
    }

    return {
        valid,
        invalidColumns: invalidColumns.length > 0 ? invalidColumns : undefined
    };
}

/**
 * 从 SQL 语句中提取引用的列名并进行校验
 * 
 * @param sql SQL 语句
 * @param validColumns 有效的列名列表
 * @param tableName 表名（用于过滤）
 * @returns 校验结果
 */
export function validateColumnNamesInSQL(
    sql: string,
    validColumns: string[],
    tableName?: string
): ColumnValidationResult {
    // 提取所有双引号括起的列名
    const columnPattern = /"([^"]+)"/g;
    const matches = [...sql.matchAll(columnPattern)];
    const referencedColumns = matches.map(m => m[1]);

    // 过滤掉表名引用
    const invalidColumns = referencedColumns.filter(col =>
        !validColumns.includes(col) && col !== tableName
    );

    const valid = invalidColumns.length === 0;

    if (!valid) {
        logger.warn('列名校验', 'SQL中存在无效列名', {
            data: { invalidColumns, sql: sql.substring(0, 100) + '...' }
        });
    }

    return {
        valid,
        invalidColumns: invalidColumns.length > 0 ? invalidColumns : undefined
    };
}

/**
 * 校验 Prompt 参数是否完整
 * 
 * @param params 参数对象
 * @param requiredKeys 必需的参数键列表
 * @returns 是否通过校验
 */
export function validateRequiredParams(
    params: Record<string, unknown>,
    requiredKeys: string[]
): { valid: boolean; missingKeys?: string[] } {
    const missingKeys = requiredKeys.filter(key => !(key in params));

    return {
        valid: missingKeys.length === 0,
        missingKeys: missingKeys.length > 0 ? missingKeys : undefined
    };
}
