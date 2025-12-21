/**
 * SQL校验工具
 * 三层校验机制：JSON格式 → SQL安全 → DuckDB Dry Run
 */

import type { CleaningSuggestion } from '@/services/aiService';

// ==================== 第1层: JSON格式校验 ====================

export interface ValidationError {
    valid: false;
    error: string;
}

export interface ValidationSuccess {
    valid: true;
}

export type ValidationResult = ValidationSuccess | ValidationError;

/**
 * 校验AI返回的JSON格式
 */
export function validateAIResponse(
    response: string,
    t: (key: string, params?: Record<string, any>) => string
): CleaningSuggestion[] | null {
    try {
        const parsed = JSON.parse(response);

        // 检查必要字段
        if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
            console.error(t('cleaning.validationError.missingSuggestions'));
            return null;
        }

        // 验证每个建议
        const required = ['id', 'type', 'label', 'reason', 'confidence', 'sql'];
        for (const sugg of parsed.suggestions) {
            for (const field of required) {
                if (!(field in sugg)) {
                    console.error(t('cleaning.validationError.missingField', { field }));
                    return null;
                }
            }

            // 验证type
            if (!['dedup', 'fill', 'filter', 'normalize'].includes(sugg.type)) {
                console.error(t('cleaning.validationError.invalidType', { type: sugg.type }));
                return null;
            }

            // 验证confidence范围
            if (sugg.confidence < 0 || sugg.confidence > 1) {
                console.error(t('cleaning.validationError.confidenceOutOfRange'));
                return null;
            }
        }

        return parsed.suggestions;
    } catch (error) {
        console.error(t('cleaning.validationError.jsonFormat'), error);
        return null;
    }
}

// ==================== 第2层: SQL安全校验 ====================

// 危险关键字黑名单
const FORBIDDEN_KEYWORDS = [
    'DROP',
    'TRUNCATE',
    'DELETE FROM',
    'ALTER TABLE',
    'DROP TABLE',
    'DROP DATABASE'
];

// 允许的SQL类型模式
const ALLOWED_SQL_PATTERNS = [
    /^SELECT/i,
    /^UPDATE/i,
    /^CREATE\s+OR\s+REPLACE\s+TABLE/i
];

/**
 * 校验SQL安全性
 */
export function validateSQLSafety(
    sql: string,
    tableName: string,
    t: (key: string, params?: Record<string, any>) => string
): ValidationResult {
    const upperSQL = sql.toUpperCase();

    // 1. 黑名单检查
    for (const keyword of FORBIDDEN_KEYWORDS) {
        if (upperSQL.includes(keyword)) {
            return {
                valid: false,
                error: t('cleaning.validationError.forbiddenKeyword', { keyword })
            };
        }
    }

    // 2. 必须引用指定表名
    if (!upperSQL.includes(tableName.toUpperCase())) {
        return {
            valid: false,
            error: t('cleaning.validationError.tableNotReferenced', { table: tableName })
        };
    }

    // 3. 必须是允许的SQL类型
    const isAllowed = ALLOWED_SQL_PATTERNS.some(pattern => pattern.test(sql));
    if (!isAllowed) {
        return {
            valid: false,
            error: t('cleaning.validationError.invalidSqlType')
        };
    }

    return { valid: true };
}

// ==================== 第3层: DuckDB Dry Run ====================

/**
 * 在临时表上执行Dry Run测试SQL
 */
export async function validateWithDryRun(
    sql: string,
    tableName: string,
    duckdbEngine: any, // DuckDBEngine实例
    t: (key: string, params?: Record<string, any>) => string
): Promise<ValidationResult & { affectedRows?: number }> {

    // 🛠️ 使用时间戳 + 随机数确保并发调用时表名唯一
    // ✅ 修复：临时表不再以 t_ 开头，避免与正式表命名冲突
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const tempTable = `dryrun_${Date.now()}_${randomSuffix}`;

    try {
        // 1. 使用EXPLAIN检查语法
        try {
            await duckdbEngine.runQuery(`EXPLAIN ${sql}`);
        } catch (error: any) {
            return {
                valid: false,
                error: t('cleaning.validationError.syntaxError', { error: error.message })
            };
        }

        // 2. 创建临时表（先删除可能存在的同名表，防止冲突）
        await duckdbEngine.runQuery(`DROP TABLE IF EXISTS ${tempTable}`);
        await duckdbEngine.runQuery(`
            CREATE TEMP TABLE ${tempTable} AS 
            SELECT * FROM ${tableName} LIMIT 100
        `);

        // 3. 在临时表上执行SQL
        const modifiedSQL = sql.replace(
            new RegExp(`\\b${tableName}\\b`, 'gi'),
            tempTable
        );

        await duckdbEngine.runQuery(modifiedSQL);

        // 4. 获取影响行数
        const countResult = await duckdbEngine.runQuery(`SELECT COUNT(*) as cnt FROM ${tempTable}`);
        const affectedRows = countResult[0]?.cnt || 0;

        // 5. 清理临时表
        await duckdbEngine.runQuery(`DROP TABLE ${tempTable}`);

        return {
            valid: true,
            affectedRows
        };

    } catch (error: any) {
        // 清理临时表
        try {
            await duckdbEngine.runQuery(`DROP TABLE IF EXISTS ${tempTable}`);
        } catch (e) {
            // 忽略清理错误
        }

        return {
            valid: false,
            error: t('cleaning.validationError.dryRunFailed', { error: error.message })
        };
    }
}

/**
 * 完整的三层校验流程
 */
export async function validateCleaningSuggestion(
    suggestion: CleaningSuggestion,
    tableName: string,
    duckdbEngine: any,
    t: (key: string, params?: Record<string, any>) => string
): Promise<ValidationResult & { affectedRows?: number }> {

    // 第2层：SQL安全校验
    const safetyCheck = validateSQLSafety(suggestion.sql, tableName, t);
    if (!safetyCheck.valid) {
        return safetyCheck;
    }

    // 第3层：DuckDB Dry Run
    const dryRunResult = await validateWithDryRun(
        suggestion.sql,
        tableName,
        duckdbEngine,
        t
    );

    return dryRunResult;
}
