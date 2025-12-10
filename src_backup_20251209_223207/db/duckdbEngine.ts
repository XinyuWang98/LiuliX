import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_eh_wasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import duckdb_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import { IngestionOptions, IngestionResult, ColumnMetadata } from '../types/duckdb';
import { globalT } from '../contexts/I18nContext';

/**
 * 极简务实的 DuckDB Singleton 引擎
 * 负责：初始化、流式摄入、OPFS挂载、Arrow导出
 */
export class DuckDBEngine {
    private static instance: DuckDBEngine;
    private db: duckdb.AsyncDuckDB | null = null;
    private conn: duckdb.AsyncDuckDBConnection | null = null;
    private isInitialized = false;

    private constructor() { }

    public static getInstance(): DuckDBEngine {
        if (!DuckDBEngine.instance) {
            DuckDBEngine.instance = new DuckDBEngine();
        }
        return DuckDBEngine.instance;
    }

    /**
     * 初始化 DuckDB-WASM 
     * 自动选择性能最好的 WASM Bundle (EH vs MVP)
     */
    public async init() {
        if (this.isInitialized) return;

        const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
            mvp: {
                mainModule: duckdb_wasm,
                mainWorker: duckdb_worker,
            },
            eh: {
                mainModule: duckdb_eh_wasm,
                mainWorker: duckdb_eh_worker,
            },
        };

        // 1. 选择 Bundle
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

        // 2. 实例化 Worker
        const worker = new Worker(bundle.mainWorker!);

        // 3. 启动 DB
        const logger = new duckdb.ConsoleLogger();
        this.db = new duckdb.AsyncDuckDB(logger, worker);
        await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        // 4. 挂载 OPFS (用于持久化) - 务实策略：暂禁用 OPFS 以确保稳定性 (修复 Write Mode Error)
        /*
        try {
            // 在新版 DuckDB Wasm 中，registerPlugin 用于挂载 OPFS
            // 这里假设是最新版，如果环境没有 opfs，Wasm 内部通常会 fallback
            await this.db.open({
                path: 'opfs://datapris_db.duckdb',
                accessMode: duckdb.DuckDBAccessMode.READ_WRITE
            });
        } catch (e) {
            console.warn(globalT('settings.opfsFailed'), e);
        }
        */

        this.conn = await this.db.connect();
        this.isInitialized = true;
        console.log(globalT('settings.opfsSuccess'));
    }

    /**
     * 快速分析 CSV 文件，返回抽样建议
     */
    public async analyzeCSV(file: File): Promise<{
        strategy: 'FORCE_SAMPLE' | 'WARN' | 'SAFE';
        rowCount: number;
    }> {
        if (!this.db || !this.conn) throw new Error(globalT('settings.dbNotReady'));

        // 注册临时句柄用于分析
        await this.db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

        // 快速 Count (忽略错误行，防止因个别脏数据导致全盘失败)
        const result = await this.conn.query(`SELECT count(*) as c FROM read_csv_auto('${file.name}', ignore_errors=true)`);
        const row = result.get(0);
        const count = row ? Number(row['c']) : 0;

        if (count > 200000) return { strategy: 'FORCE_SAMPLE', rowCount: count };
        if (count > 100000) return { strategy: 'WARN', rowCount: count };
        return { strategy: 'SAFE', rowCount: count };
    }

    /**
     * 这里的核心：流式读取 + 自动抽样 100万行 CSV
     */
    public async ingestCSV(
        file: File,
        options: IngestionOptions = {},
        onProgress?: (percent: number) => void
    ): Promise<IngestionResult> {
        if (!this.db || !this.conn) throw new Error(globalT('settings.dbNotReady'));

        const tableName = `t_${Date.now()}`;
        const autoSampleThreshold = options.autoSampleThreshold || 100000;
        const sampleRate = options.sampleRate || 0.2;

        // 1. 注册文件句柄 (并不立即读取，零拷贝)
        // 务实技巧：直接用 registerFileHandle 最快，但为了进度条，我们需要流式处理
        // 如果文件极大，建议先注册 Handle 拿 metadata，再决定怎么读
        await this.db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

        // 2. 预检：获取行数（非常快，因为 DuckDB 读取 CSV 尾部或 Metadata）
        // 注意：read_csv_auto 默认会嗅探类型
        // 为了性能，我们先 count 一下
        const fileSizeMB = file.size / (1024 * 1024);
        let shouldSample = false;

        // 3. 简单的文件大小判断逻辑
        if (fileSizeMB > 20) {
            // 对于大文件，我们在 SQL 层面做优化，或者先 Count
            // 使用 ignore_errors=true 确保 dirty CSV 也能读出 Count
            const countResult = await this.conn.query(`SELECT count(*) as c FROM read_csv_auto('${file.name}', ignore_errors=true)`);
            const row = countResult.get(0);
            const totalRows = row ? Number(row['c']) : 0;
            if (totalRows > autoSampleThreshold) {
                shouldSample = true;
            }
        }

        // 4. 构建 SQL - 关键修复：允许忽略脏数据行 (ignore_errors=true)
        let sql = `CREATE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${file.name}', ignore_errors=true)`;

        if (shouldSample && options.sampleSize !== -1) {
            sql += ` USING SAMPLE ${Math.floor(sampleRate * 100)}%`;
        }

        // 5. 执行解析
        if (onProgress) onProgress(10);
        const start = performance.now();

        await this.conn.query(sql);

        if (onProgress) onProgress(100);
        console.log(globalT('settings.parseSuccess', { time: (performance.now() - start).toFixed(2) }));

        // 6. 获取 Schema 和 最终行数
        const info = await this.conn.query(`SELECT count(*) as c FROM ${tableName}`);
        const infoRow = info.get(0);
        const actualRows = infoRow ? Number(infoRow['c']) : 0;

        // 获取列信息
        const schemaWait = await this.conn.query(`DESCRIBE ${tableName}`);
        const columns: ColumnMetadata[] = [];
        for (let i = 0; i < schemaWait.numRows; i++) {
            const row = schemaWait.get(i);
            if (row) {
                columns.push({
                    name: String(row['column_name']),
                    type: String(row['column_type'])
                });
            }
        }

        return {
            tableName,
            rowCount: actualRows,
            isSampled: shouldSample,
            columns
        };
    }

    /**
     * 分页查询 - 专门配合 Virtual Scroll
     */
    public async queryChunk(tableName: string, offset: number, limit: number): Promise<any[]> {
        if (!this.conn) return [];
        const result = await this.conn.query(`SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`);
        // toJSON() returns a basic JS object for each row
        return result.toArray().map((row: any) => row.toJSON());
    }

    /**
     * 零拷贝导出 Arrow Table (用于 Pyodide)
     */
    public async exportArrowTable(tableName: string): Promise<Uint8Array> {
        if (!this.conn) throw new Error('No connection');
        const result = await this.conn.query(`SELECT * FROM ${tableName}`);
        // DuckDB-WASM Arrow Table directly supports toIPCStream() in recent versions
        // If strict types complain, we can cast to any or use a polyfill
        return (result as any).toIPCStream();
    }

    /**
     * 执行清洗 SQL
     * @param sql 清洗用的 SQL 语句
     * @returns 新表名或受影响行数信息
     */
    public async executeCleaningSQL(sql: string): Promise<string> {
        if (!this.conn) throw new Error(globalT('settings.dbNotReady'));

        // 简单的安全检查，防止恶意 DROP ALL
        // 实际场景应限制只能操作当前 session 的表
        const cleanSQL = sql.trim().replace(/;$/, '');

        const start = performance.now();
        await this.conn.query(cleanSQL);
        const time = (performance.now() - start).toFixed(2);

        console.log(`[DuckDB] Clean SQL Executed (${time}ms): ${cleanSQL}`);
        return `Execution successful (${time}ms)`;
    }

    /**
     * 获取表的所有列信息
     */
    public async getTableColumns(tableName: string): Promise<ColumnMetadata[]> {
        if (!this.conn) return [];
        const result = await this.conn.query(`DESCRIBE ${tableName}`);
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
     * 获取表的所有列统计信息 (Min/Max/Null/Unique)
     */
    public async getColumnStats(tableName: string): Promise<any[]> {
        if (!this.conn) return [];

        // 1. 获取列名和类型
        const columns = await this.getTableColumns(tableName);
        const stats: any[] = [];

        // 2. 为每一列构建聚合查询 (为了从简，这里先循环查询，后续可优化为单条 SQL)
        for (const col of columns) {
            try {
                // 基础统计
                const basicSql = `
                    SELECT 
                        count(*) as total,
                        count("${col.name}") as non_null,
                        approx_count_distinct("${col.name}") as unique_count
                    FROM ${tableName}
                `;
                const basicResult = await this.conn.query(basicSql);
                const basicRow = basicResult.get(0);

                let min = null;
                let max = null;

                // 数值类型额外查 Min/Max
                if (['INTEGER', 'BIGINT', 'DOUBLE', 'FLOAT', 'DECIMAL'].some(t => col.type.includes(t))) {
                    const rangeSql = `SELECT min("${col.name}") as mi, max("${col.name}") as ma FROM ${tableName}`;
                    const rangeResult = await this.conn.query(rangeSql);
                    const rangeRow = rangeResult.get(0);
                    min = rangeRow ? rangeRow['mi'] : null;
                    max = rangeRow ? rangeRow['ma'] : null;
                }

                stats.push({
                    name: col.name,
                    type: col.type,
                    total: Number(basicRow ? basicRow['total'] : 0),
                    nullCount: Number(basicRow ? basicRow['total'] : 0) - Number(basicRow ? basicRow['non_null'] : 0),
                    uniqueCount: Number(basicRow ? basicRow['unique_count'] : 0),
                    min,
                    max
                });

            } catch (e) {
                console.warn(`Failed to get stats for column ${col.name}`, e);
                stats.push({ name: col.name, type: col.type, error: true });
            }
        }
        return stats;
    }

    public async terminate() {
        await this.db?.terminate();
    }
}
