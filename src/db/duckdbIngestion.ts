import * as duckdb from '@duckdb/duckdb-wasm';
import { IngestionOptions, IngestionResult, ColumnMetadata } from '../types/duckdb';
import { globalT } from '../contexts/I18nContext';
import { logger } from '../utils/logger';
import { assessMemoryBeforeExecution } from '../utils/memoryAssessment';

/**
 * CSV数据摄入相关功能
 * 职责：文件分析、CSV流式导入、自动抽样
 */

/**
 * 快速分析 CSV 文件，返回抽样建议
 */
export async function analyzeCSV(
    db: duckdb.AsyncDuckDB,
    conn: duckdb.AsyncDuckDBConnection,
    file: File
): Promise<{
    strategy: 'FORCE_SAMPLE' | 'WARN' | 'SAFE';
    rowCount: number;
}> {
    if (!db || !conn) throw new Error(globalT('settings.dbNotReady'));

    // 注册临时句柄用于分析
    await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

    // 快速 Count (忽略错误行，防止因个别脏数据导致全盘失败)
    // 添加 max_line_size 参数支持超长行（默认2MB，这里设置为10MB）
    const result = await conn.query(`SELECT count(*) as c FROM read_csv_auto('${file.name}', ignore_errors=true, max_line_size=10485760)`);
    const row = result.get(0);
    const count = row ? Number(row['c']) : 0;

    // 获取列信息用于内存评估
    try {
        const schemaResult = await conn.query(`DESCRIBE read_csv_auto('${file.name}', ignore_errors=true, max_line_size=10485760)`);
        const columns: string[] = [];
        for (let i = 0; i < schemaResult.numRows; i++) {
            const schemaRow = schemaResult.get(i);
            if (schemaRow) {
                columns.push(String(schemaRow['column_name']));
            }
        }

        // ✅ 使用统一的内存评估策略
        const assessment = await assessMemoryBeforeExecution(count, columns);

        logger.log('DuckDB', `文件分析: ${file.name}`, {
            data: {
                rows: count,
                columns: columns.length,
                mode: assessment.mode,
                estimatedMemory: `${assessment.estimatedMemory.toFixed(0)}MB`
            }
        });

        // 映射评估模式到策略
        if (assessment.mode === 'aggregated') {
            return { strategy: 'FORCE_SAMPLE', rowCount: count };
        } else if (assessment.mode === 'sampled') {
            return { strategy: 'WARN', rowCount: count };
        } else {
            return { strategy: 'SAFE', rowCount: count };
        }
    } catch (error) {
        logger.warn('DuckDB', '获取列信息失败，使用降级策略', error);

        // 降级策略：纯行数判断
        if (count > 200000) return { strategy: 'FORCE_SAMPLE', rowCount: count };
        if (count > 100000) return { strategy: 'WARN', rowCount: count };
        return { strategy: 'SAFE', rowCount: count };
    }
}

/**
 * 流式读取 + 自动抽样 CSV，创建双表结构（original + working）
 */
export async function ingestCSV(
    db: duckdb.AsyncDuckDB,
    conn: duckdb.AsyncDuckDBConnection,
    file: File,
    options: IngestionOptions = {},
    onProgress?: (percent: number) => void
): Promise<IngestionResult> {
    if (!db || !conn) throw new Error(globalT('settings.dbNotReady'));

    // 生成文件唯一标识（基于时间戳）
    const fileId = `${Date.now()}`;
    const originalTable = `t_${fileId}_original`; // 原始数据表（只读）
    const workingTable = `t_${fileId}_working`;  // 工作表（可清洗）

    const autoSampleThreshold = options.autoSampleThreshold || 100000;
    const sampleRate = options.sampleRate || 0.2;

    // 清理可能存在的同名表
    try {
        await conn.query(`DROP TABLE IF EXISTS ${originalTable}`);
        await conn.query(`DROP TABLE IF EXISTS ${workingTable}`);
        logger.log('DuckDB', '创建双表', { data: `${file.name} → ${originalTable} + ${workingTable}` });
    } catch (cleanupErr) {
        logger.warn('DuckDB', '清理表失败(忽略)', cleanupErr);
    }

    // 1. 注册文件句柄（零拷贝）
    await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

    // 2. 预检：判断是否需要抽样
    const fileSizeMB = file.size / (1024 * 1024);
    let shouldSample = false;

    if (fileSizeMB > 20) {
        // 对于大文件，先获取总行数判断是否需要抽样
        const countResult = await conn.query(`SELECT count(*) as c FROM read_csv_auto('${file.name}', ignore_errors=true)`);
        const row = countResult.get(0);
        const totalRows = row ? Number(row['c']) : 0;
        if (totalRows > autoSampleThreshold) {
            shouldSample = true;
        }
    }

    // 3. 构建SQL - 先创建 original 表（原始数据，只读）
    let sql = `CREATE TABLE ${originalTable} AS SELECT * FROM read_csv_auto('${file.name}', ignore_errors=true, max_line_size=10485760)`;

    if (shouldSample && options.sampleSize !== -1) {
        sql += ` USING SAMPLE ${Math.floor(sampleRate * 100)}%`;
    }

    // 4. 执行解析 - 创建原始表
    if (onProgress) onProgress(10);
    const start = performance.now();

    await conn.query(sql);

    if (onProgress) onProgress(50);

    // 5. 从 original 复制数据到 working 表
    await conn.query(`CREATE TABLE ${workingTable} AS SELECT * FROM ${originalTable}`);

    if (onProgress) onProgress(100);
    const time = (performance.now() - start).toFixed(2);
    logger.log('DuckDB', '双表创建完成', { data: `${file.name}`, duration: Number(time) });

    // 6. 获取 Schema 和行数（从 working 表查询）
    const info = await conn.query(`SELECT count(*) as c FROM ${workingTable}`);
    const infoRow = info.get(0);
    const actualRows = infoRow ? Number(infoRow['c']) : 0;

    // 获取列信息
    const schemaWait = await conn.query(`DESCRIBE ${workingTable}`);
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

    // 返回 working 表名（所有后续操作都使用 working 表）
    return {
        tableName: workingTable, // 重要：返回 working 表名
        rowCount: actualRows,
        isSampled: shouldSample,
        columns
    };
}
