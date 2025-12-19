// SQL语句构建工具

import { SimpleSuggestion } from '../types/cleaning.types';

/**
 * 根据建议生成对应的SQL语句（使用__TABLE_NAME__占位符）
 * @param sugg 建议对象
 * @returns SQL语句字符串
 */
export const buildCleaningSQL = (sugg: SimpleSuggestion): string => {
    const tableName = '__TABLE_NAME__';

    switch (sugg.action) {
        case 'dedup':
            return `CREATE OR REPLACE TABLE ${tableName} AS SELECT DISTINCT * FROM ${tableName}`;

        case 'fill':
            if (sugg.column) {
                return `UPDATE ${tableName} SET "${sugg.column}" = COALESCE("${sugg.column}", 0) WHERE "${sugg.column}" IS NULL`;
            }
            return `-- 填充缺失值`;

        case 'drop_column':
            if (sugg.column) {
                return `ALTER TABLE ${tableName} DROP COLUMN "${sugg.column}"`;
            }
            return `-- 删除列`;

        default:
            return `-- ${sugg.label}`;
    }
};
