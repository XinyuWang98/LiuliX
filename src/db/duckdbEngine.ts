import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_eh_wasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import duckdb_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import { IngestionOptions, IngestionResult, ColumnMetadata } from '../types/duckdb';
import { logger } from '../utils/logger';

// 导入拆分的模块
import * as IngestionModule from './duckdbIngestion';
import * as QueryModule from './duckdbQuery';
import * as StatsModule from './duckdbStats';
import * as CleaningModule from './duckdbCleaning';

/**
 * 极简务实的 DuckDB Singleton 引擎
 * 负责：初始化、连接管理
 * 核心职责已拆分到专门模块：Ingestion、Query、Stats、Cleaning
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
        worker.onerror = (e) => console.error("❌ DuckDB Worker 报错:", e.message, e.filename, e.lineno, e);
        worker.onmessageerror = (e) => console.error("❌ DuckDB Worker 消息错误:", e);

        // 3. 启动 DB (使用VoidLogger禁用DuckDB内部日志)
        const voidLogger = new duckdb.VoidLogger();
        this.db = new duckdb.AsyncDuckDB(voidLogger, worker);
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
        logger.log('DuckDB', '初始化完成');
    }

    public async terminate() {
        await this.db?.terminate();
    }

    // ==================== CSV摄入模块 ====================

    /**
     * 快速分析 CSV 文件，返回抽样建议
     */
    public async analyzeCSV(file: File): Promise<{
        strategy: 'FORCE_SAMPLE' | 'WARN' | 'SAFE';
        rowCount: number;
    }> {
        if (!this.db || !this.conn) throw new Error('DB not ready');
        return IngestionModule.analyzeCSV(this.db, this.conn, file);
    }

    /**
     * 流式读取 + 自动抽样 100万行 CSV
     */
    public async ingestCSV(
        file: File,
        options: IngestionOptions = {},
        onProgress?: (percent: number) => void
    ): Promise<IngestionResult> {
        if (!this.db || !this.conn) throw new Error('DB not ready');
        return IngestionModule.ingestCSV(this.db, this.conn, file, options, onProgress);
    }

    // ==================== 查询模块 ====================

    /**
     * 分页查询 - 专门配合 Virtual Scroll
     */
    public async queryChunk(tableName: string, offset: number, limit: number): Promise<any[]> {
        if (!this.conn) return [];
        return QueryModule.queryChunk(this.conn, tableName, offset, limit);
    }

    /**
     * 零拷贝导出 Arrow Table (用于 Pyodide)
     */
    public async exportArrowTable(tableName: string): Promise<Uint8Array> {
        if (!this.conn) throw new Error('No connection');
        return QueryModule.exportArrowTable(this.conn, tableName);
    }

    /**
     * 获取表的所有列信息
     */
    public async getTableColumns(tableName: string): Promise<ColumnMetadata[]> {
        if (!this.conn) return [];
        return QueryModule.getTableColumns(this.conn, tableName);
    }

    /**
     * 执行任意SQL查询（便捷方法）
     */
    public async runQuery(sql: string): Promise<any[]> {
        if (!this.conn) throw new Error('DB not ready');
        return QueryModule.runQuery(this.conn, sql);
    }

    // ==================== 统计模块 ====================

    /**
     * 获取表的所有列详细统计信息
     * 包括：基础统计、数值统计(五数概括+标准差+偏度)、分类统计(TOP 5)、分布直方图
     */
    public async getColumnStats(tableName: string): Promise<any[]> {
        if (!this.conn) return [];
        return StatsModule.getColumnStats(this.conn, tableName);
    }

    // ==================== 清洗模块 ====================

    /**
     * 执行清洗 SQL
     * @param sql 清洗用的 SQL 语句
     * @returns 新表名或受影响行数信息
     */
    public async executeCleaningSQL(sql: string): Promise<string> {
        if (!this.conn) throw new Error('DB not ready');
        return CleaningModule.executeCleaningSQL(this.conn, sql);
    }

    /**
     * 重置工作表到原始状态
     * @param workingTableName 工作表名（格式：t_{fileId}_working）
     * @returns 是否成功
     */
    public async resetWorkingTable(workingTableName: string): Promise<boolean> {
        if (!this.conn) throw new Error('DB not ready');
        return CleaningModule.resetWorkingTable(this.conn, workingTableName);
    }

    /**
     * 修改列的数据类型
     * 使用 ALTER TABLE ... ALTER ... TYPE ... 语法
     * @param tableName 表名
     * @param columnName 列名
     * @param newType 新数据类型 (e.g. 'INTEGER', 'DOUBLE', 'VARCHAR')
     * @returns 是否成功
     */
    public async alterColumnType(tableName: string, columnName: string, newType: string): Promise<boolean> {
        if (!this.conn) throw new Error('DB not ready');
        return CleaningModule.alterColumnType(this.conn, tableName, columnName, newType);
    }
}
