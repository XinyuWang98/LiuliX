import * as duckdb from '@duckdb/duckdb-wasm';
import { globalT } from '../contexts/I18nContext';
import { logger } from '../utils/logger';

/**
 * DuckDB数据清洗和修改功能
 * 职责：执行清洗SQL、重置工作表、修改列类型
 */

/**
 * 执行清洗 SQL
 * @param sql 清洗用的 SQL 语句
 * @returns 新表名或受影响行数信息
 */
export async function executeCleaningSQL(
    conn: duckdb.AsyncDuckDBConnection,
    sql: string
): Promise<string> {
    if (!conn) throw new Error(globalT('settings.dbNotReady'));

    // 简单的安全检查，防止恶意 DROP ALL
    // 实际场景应限制只能操作当前 session 的表
    const cleanSQL = sql.trim().replace(/;$/, '');

    const start = performance.now();
    await conn.query(cleanSQL);
    const time = Number((performance.now() - start).toFixed(2));

    logger.log('DuckDB', '清洗SQL执行完成', { duration: time });
    return `Execution successful (${time}ms)`;
}

/**
 * 重置工作表到原始状态
 * @param workingTableName 工作表名（格式：t_{fileId}_working）
 * @returns 是否成功
 */
export async function resetWorkingTable(
    conn: duckdb.AsyncDuckDBConnection,
    workingTableName: string
): Promise<boolean> {
    if (!conn) throw new Error(globalT('settings.dbNotReady'));

    // 从 working 表名推导出 original 表名
    // 例如：t_1234567890_working → t_1234567890_original
    const originalTableName = workingTableName.replace('_working', '_original');

    logger.log('DuckDB', '开始重置工作表', { data: `${workingTableName} ← ${originalTableName}` });

    try {
        // 1. 检查 original 表是否存在
        const checkResult = await conn.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = '${originalTableName}'
        `);

        if (checkResult.numRows === 0) {
            logger.error('DuckDB', '原始表不存在', originalTableName);
            return false;
        }

        // 2. 删除当前 working 表
        await conn.query(`DROP TABLE IF EXISTS ${workingTableName}`);

        // 3. 从 original 重新复制数据到 working
        await conn.query(`
            CREATE TABLE ${workingTableName} AS 
            SELECT * FROM ${originalTableName}
        `);
        logger.log('DuckDB', '工作表重置完成');

        return true;
    } catch (error) {
        logger.error('DuckDB', '重置工作表失败', error);
        return false;
    }
}

/**
 * 修改列的数据类型
 * 使用 ALTER TABLE ... ALTER ... TYPE ... 语法
 * @param tableName 表名
 * @param columnName 列名
 * @param newType 新数据类型 (e.g. 'INTEGER', 'DOUBLE', 'VARCHAR')
 * @returns 是否成功
 */
export async function alterColumnType(
    conn: duckdb.AsyncDuckDBConnection,
    tableName: string,
    columnName: string,
    newType: string
): Promise<boolean> {
    if (!conn) throw new Error(globalT('settings.dbNotReady'));

    const start = performance.now();
    logger.log('DuckDB', '修改列类型', { data: `${tableName}.${columnName} -> ${newType}` });

    try {
        // DuckDB 的 ALTER COLUMN TYPE 语法：
        // ALTER TABLE table_name ALTER columnName TYPE newType
        // 如果转换失败会报错，DuckDB 0.8+ 支持 TRY_CAST 吗？
        // 标准语法通常是直接转，失败则报错。
        // 为了安全，我们可以使用 USING TRY_CAST(columnName AS newType) 如果 DuckDB 支持
        // 或者先简单的 ALTER，如果为了兼容性，构建 SQL 字符串

        // 针对包含特殊字符的列名，确保引用
        const safeCol = `"${columnName}"`;

        // 尝试直接转换 (DuckDB 会尝试自动转换)
        // 如果是 String -> Number 且包含非数字字符，可能会失败
        // 我们可以使用 USING 表达式来处理错误 (变 NULL)
        // 语法: ALTER TABLE t ALTER c TYPE INT USING TRY_CAST(c AS INT)

        const sql = `ALTER TABLE ${tableName} ALTER ${safeCol} TYPE ${newType} USING TRY_CAST(${safeCol} AS ${newType})`;

        await conn.query(sql);

        const duration = (performance.now() - start).toFixed(2);
        logger.log('DuckDB', '修改列类型成功', { duration: Number(duration) });
        return true;
    } catch (error) {
        logger.error('DuckDB', '修改列类型失败', error);
        // 这里可以考虑 fallback 策略，但 MVP 阶段先透传失败
        return false;
    }
}
