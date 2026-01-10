/**
 * 列名校验工具 - Inflater 层的前置校验
 * 
 * 作为 SchemaService 优化的第三道防线，在代码膨胀前验证所有列名
 */

import { logger } from '@/utils/logger';
import { getTableSchema } from '@/services/schemaService';

/**
 * 校验推荐参数中的所有列名是否存在于表中
 * 
 * @param params 推荐参数
 * @param tableName 表名
 * @returns 校验结果 { valid: boolean, invalidColumns: string[] }
 * 
 * @example
 * const result = await validateRecommendationColumns(
 *     { column_name: 'value', col_x: 'age' },
 *     'user_data'
 * );
 * if (!result.valid) {
 *     logger.warn('发现非法列名', result.invalidColumns);
 * }
 */
export async function validateRecommendationColumns(
    params: Record<string, unknown>,
    tableName: string
): Promise<{ valid: boolean; invalidColumns: string[] }> {
    try {
        // 获取表的实际列名
        const schema = await getTableSchema(tableName);
        const validColumns = new Set(schema.map((col: { name: string }) => col.name));

        // 提取参数中的所有列名字段
        const columnKeys = [
            'column_name', 'col_x', 'col_y',
            'date_col', 'value_col', 'group_col',
            'category_col', 'metric_col'
        ];

        const invalidColumns: string[] = [];

        for (const key of columnKeys) {
            const value = params[key];
            if (typeof value === 'string' && value.trim() !== '') {
                // 检查列名是否在有效列表中
                if (!validColumns.has(value)) {
                    invalidColumns.push(value);
                }
            }
        }

        return {
            valid: invalidColumns.length === 0,
            invalidColumns
        };
    } catch (error) {
        logger.error('AI服务', '[InflaterValidator] Schema获取失败', { error });
        // 获取Schema失败时,让请求通过（fail-open策略）
        return { valid: true, invalidColumns: [] };
    }
}

/**
 * 常见的"幻觉列名"黑名单
 * 
 * 这些是 AI 最容易臆造的通用列名
 */
export const HALLUCINATION_COLUMN_BLACKLIST = new Set([
    'value', 'count', 'data', 'item',
    'date', 'time', 'timestamp', 'datetime',
    'category', 'type', 'name', 'label', 'status',
    'column', 'field', 'col', 'x', 'y', 'id'
]);

/**
 * 快速检查列名是否是常见幻觉
 * 
 * @param columnName 列名
 * @returns 是否为幻觉列名
 */
export function isHallucinationColumn(columnName: string): boolean {
    return HALLUCINATION_COLUMN_BLACKLIST.has(columnName.toLowerCase());
}
