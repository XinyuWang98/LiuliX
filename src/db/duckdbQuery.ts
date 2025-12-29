import * as duckdb from '@duckdb/duckdb-wasm';
import { ColumnMetadata } from '../types/duckdb';
import { globalT } from '../contexts/I18nContext';

/**
 * DuckDB查询相关功能
 * 职责：分页查询、任意SQL执行、Arrow导出、列信息获取
 */

/**
 * 分页查询 - 专门配合 Virtual Scroll
 */
export async function queryChunk(
    conn: duckdb.AsyncDuckDBConnection,
    tableName: string,
    offset: number,
    limit: number
): Promise<any[]> {
    if (!conn) return [];
    const result = await conn.query(`SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`);
    // toJSON() returns a basic JS object for each row
    return result.toArray().map((row: any) => row.toJSON());
}

/**
 * 零拷贝导出 Arrow Table (用于 Pyodide)
 */
export async function exportArrowTable(
    conn: duckdb.AsyncDuckDBConnection,
    tableName: string
): Promise<Uint8Array> {
    if (!conn) throw new Error('No connection');
    const result = await conn.query(`SELECT * FROM ${tableName}`);
    // DuckDB-WASM Arrow Table directly supports toIPCStream() in recent versions
    // If strict types complain, we can cast to any or use a polyfill
    return (result as any).toIPCStream();
}

/**
 * 获取表的所有列信息
 */
export async function getTableColumns(
    conn: duckdb.AsyncDuckDBConnection,
    tableName: string
): Promise<ColumnMetadata[]> {
    if (!conn) return [];
    const result = await conn.query(`DESCRIBE ${tableName}`);
    const columns: ColumnMetadata[] = [];
    for (let i = 0; i < result.numRows; i++) {
        const row = result.get(i);
        if (row) {
            columns.push({
                name: String(row['column_name']),
                type: String(row['column_type'])
            });
        }
    }
    return columns;
}

/**
 * 执行任意SQL查询（便捷方法）
 */
export async function runQuery(
    conn: duckdb.AsyncDuckDBConnection,
    sql: string
): Promise<any[]> {
    if (!conn) throw new Error(globalT('settings.dbNotReady'));
    const result = await conn.query(sql);
    const rows: any[] = [];
    for (let i = 0; i < result.numRows; i++) {
        const row = result.get(i);
        if (row) {
            rows.push(row);
        }
    }
    return rows;
}
