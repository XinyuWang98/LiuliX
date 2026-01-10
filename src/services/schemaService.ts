/**
 * Schema Service - 统一表结构查询与格式化服务
 * 
 * 职责:
 * 1. 查询 DuckDB 表 Schema (列名+类型)
 * 2. 格式化 Schema 为 AI Prompt 文本
 * 3. 支持多语言、多格式、约束说明
 * 
 * @author AntiGravity
 * @date 2026-01-10
 */

import { DuckDBEngine } from '@/db/duckdbEngine';
import { logger } from '@/utils/logger';

/**
 * 列Schema定义
 */
export interface ColumnSchema {
    /** 列名 */
    name: string;
    /** 数据类型 (DuckDB类型) */
    type: string;
    /** 是否可为空 */
    nullable?: boolean;
    /** 列描述 (可选,未来支持元数据) */
    description?: string;
}

/**
 * Schema格式化选项
 */
export interface FormatOptions {
    /** 是否包含约束说明 */
    includeConstraints?: boolean;
    /** 输出格式 */
    format?: 'markdown' | 'json' | 'list';
    /** 语言 (用于约束说明) */
    language?: 'zh-CN' | 'en-US';
    /** 是否包含类型 */
    includeTypes?: boolean;
    /** 自定义列名映射 (脱敏场景,未来扩展) */
    columnMapping?: Map<string, string>;
}

/**
 * 获取表Schema
 * 
 * @param tableName 表名
 * @returns 列Schema数组
 * 
 * @example
 * const schema = await getTableSchema('t_123_working');
 * // [{ name: 'longitude', type: 'DOUBLE' }, ...]
 */
export async function getTableSchema(
    tableName: string
): Promise<ColumnSchema[]> {
    try {
        const db = DuckDBEngine.getInstance();
        await db.init();

        const result = await db.runQuery(`DESCRIBE ${tableName}`);

        const schema = result.map((row: any) => ({
            name: row.column_name,
            type: row.column_type,
            nullable: row.null === 'YES'
        }));

        logger.log('列名校验', `获取表结构成功 ${tableName}`, {
            data: { columns: schema.length }
        });

        return schema;
    } catch (error) {
        logger.error('列名校验', `获取表结构失败 ${tableName}`, error);
        throw error;
    }
}

/**
 * 批量获取多个表的Schema
 * 
 * @param tableNames 表名数组
 * @returns Schema字典 { tableName: schema[] }
 */
export async function getMultiTableSchema(
    tableNames: string[]
): Promise<Record<string, ColumnSchema[]>> {
    const results: Record<string, ColumnSchema[]> = {};

    await Promise.all(
        tableNames.map(async (name) => {
            try {
                results[name] = await getTableSchema(name);
            } catch (error) {
                logger.warn('列名校验', `跳过表 ${name}`, { data: error });
                results[name] = [];
            }
        })
    );

    return results;
}

/**
 * 格式化Schema为AI Prompt文本
 * 
 * @param schema 列Schema数组
 * @param options 格式化选项
 * @returns 格式化后的文本
 * 
 * @example
 * // Markdown格式 (带约束)
 * const text = formatSchemaForPrompt(schema, {
 *     includeConstraints: true,
 *     language: 'zh-CN'
 * });
 * 
 * // JSON格式
 * const json = formatSchemaForPrompt(schema, {
 *     format: 'json'
 * });
 */
export function formatSchemaForPrompt(
    schema: ColumnSchema[],
    options: FormatOptions = {}
): string {
    const {
        includeConstraints = false,
        format = 'markdown',
        language = 'zh-CN',
        includeTypes = true,
        columnMapping
    } = options;

    // JSON格式直接序列化
    if (format === 'json') {
        return JSON.stringify(schema, null, 2);
    }

    // 格式化列列表
    let lines: string[];

    if (format === 'markdown') {
        lines = schema.map(col => {
            // 支持列名映射 (未来脱敏场景)
            const displayName = columnMapping
                ? columnMapping.get(col.name) || col.name
                : col.name;

            return includeTypes
                ? `- ${displayName} (${col.type})`
                : `- ${displayName}`;
        });
    } else {
        // 'list' 格式: 仅列名
        lines = schema.map(col => {
            const displayName = columnMapping
                ? columnMapping.get(col.name) || col.name
                : col.name;
            return displayName;
        });
    }

    const listText = lines.join('\n');

    // 添加约束说明
    if (includeConstraints) {
        const constraints = getConstraintsText(language);
        return format === 'markdown'
            ? `${listText}\n\n${constraints}`
            : `${listText}\n${constraints}`;
    }

    return listText;
}

/**
 * 获取约束说明文本
 * 
 * @param language 语言
 * @returns 约束文本
 */
function getConstraintsText(language: 'zh-CN' | 'en-US'): string {
    if (language === 'zh-CN') {
        return `
⚠️ **重要约束**:
1. **严格使用上述列名**: 代码中只能使用上述列名，禁止臆造新列
2. **禁止使用通用占位符**: 严禁使用以下通用名称：
   - 'id', 'value', 'count', 'data', 'item'
   - 'date', 'time', 'timestamp', 'datetime'  
   - 'category', 'type', 'name', 'label', 'status'
   - 'column', 'field', 'col', 'x', 'y'
3. **创建新列规则**: 如需新列，必须先创建: df['new_col'] = ...
4. **大小写敏感**: 列名严格区分大小写，必须完全匹配
5. **验证示例**:
   - ❌ 错误: df['value'].mean()  (value不在列表中)
   - ✅ 正确: df['median_income'].mean()  (使用真实列名)
`.trim();
    } else {
        return `
⚠️ **Important Constraints**:
1. **Use Above Columns Only**: Code must only reference the columns listed above
2. **No Generic Placeholders**: Forbidden generic names:
   - 'id', 'value', 'count', 'data', 'item'
   - 'date', 'time', 'timestamp', 'datetime'
   - 'category', 'type', 'name', 'label', 'status'
   - 'column', 'field', 'col', 'x', 'y'
3. **New Column Rule**: To create columns: df['new_col'] = ...
4. **Case Sensitive**: Column names must match exactly
5. **Examples**:
   - ❌ Wrong: df['value'].mean()  (value not in list)
   - ✅ Correct: df['median_income'].mean()  (real column name)
`.trim();
    }
}

/**
 * 从Schema提取列名列表
 * 
 * @param schema 列Schema数组
 * @returns 列名数组
 */
export function extractColumnNames(schema: ColumnSchema[]): string[] {
    return schema.map(col => col.name);
}

/**
 * 从Schema提取列类型映射
 * 
 * @param schema 列Schema数组
 * @returns 列类型字典 { columnName: type }
 */
export function extractColumnTypes(schema: ColumnSchema[]): Record<string, string> {
    return Object.fromEntries(
        schema.map(col => [col.name, col.type])
    );
}
