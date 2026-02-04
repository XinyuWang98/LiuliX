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
 * @param conn DuckDB连接
 * @param tableName 表名
 * @param maxRows 最大行数限制（可选），用于内存优化
 */
export async function exportArrowTable(
    conn: duckdb.AsyncDuckDBConnection,
    tableName: string,
    maxRows?: number
): Promise<Uint8Array> {
    if (!conn) throw new Error('No connection');

    let query = `SELECT * FROM ${tableName}`;
    if (maxRows) {
        query += ` LIMIT ${maxRows}`;
    }

    const result = await conn.query(query);

    // 🔧 使用 tableFromArrays 桥接方法解决 DuckDB-WASM 与 Apache Arrow CDN 版本冲突
    // 将 DuckDB 的列数据提取为原生数组，然后重新构建 Arrow Table
    try {
        // @ts-ignore - 动态CDN导入，运行时加载
        const { tableFromArrays, tableToIPC } = await import('https://cdn.jsdelivr.net/npm/apache-arrow@16.1.0/+esm');

        const columnData: Record<string, any> = {};
        for (const field of result.schema.fields) {
            columnData[field.name] = result.getChild(field.name)!.toArray();
        }

        const table = tableFromArrays(columnData);
        return tableToIPC(table, 'stream');
    } catch (error) {
        throw new Error(`Arrow export failed: ${error}`);
    }
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
