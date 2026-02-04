import * as duckdb from '@duckdb/duckdb-wasm';
import { IngestionOptions, IngestionResult, ColumnMetadata } from '../types/duckdb';
import { globalT } from '../contexts/I18nContext';
import { logger } from '../utils/logger';
import { assessMemoryBeforeExecution } from '../utils/memoryAssessment';

// 🔧 DuckDB CSV 配置常量
const MAX_CSV_LINE_SIZE = 50 * 1024 * 1024; // 50MB
// TODO (P2): 改为可配置 options.maxLineSize || MAX_CSV_LINE_SIZE

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB 浏览器安全上限

/**
 * CSV数据摄入相关功能
 * 职责：文件分析、CSV流式导入、自动抽样
 */

/**
 * 🆕 文件校验（防止非CSV/空文件/超大文件导致崩溃）
 */
function validateCSVFile(file: File): void {
    // 1. 文件类型校验
    if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error(globalT('errors.invalidFileType') || `Invalid file type. Expected CSV, got ${file.name}`);
    }

    // 2. 空文件校验
    if (file.size === 0) {
        throw new Error(globalT('errors.emptyFile') || 'File is empty');
    }

    // 3. 文件大小校验
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(0);
        const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        throw new Error(globalT('errors.fileTooLarge') || `File too large (${sizeMB}MB). Maximum ${maxMB}MB allowed`);
    }
}

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

    // 🆕 文件校验（P0）
    validateCSVFile(file);

    // 注册临时句柄用于分析
    await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

    // 快速 Count (忽略错误行，防止因个别脏数据导致全盘失败)
    // 添加 max_line_size 参数支持超长行（默认2MB，这里设置为10MB）
    const result = await conn.query(`SELECT count(*) as c FROM read_csv_auto('${file.name}', ignore_errors=true, max_line_size=${MAX_CSV_LINE_SIZE})`);
    const row = result.get(0);
    const count = row ? Number(row['c']) : 0;

    // 获取列信息用于内存评估
    try {
        const schemaResult = await conn.query(`DESCRIBE SELECT * FROM read_csv_auto('${file.name}', ignore_errors=true, max_line_size=${MAX_CSV_LINE_SIZE})`);
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

        // 🔧 降级策略：假设平均列数，使用动态评估
        const { calculateMaxRowsForPyodide } = await import('../utils/memoryAssessment');
        const estimatedColumns = 10;  // 保守估计10列
        const maxRows = calculateMaxRowsForPyodide(estimatedColumns);

        if (count > maxRows * 2) {
            return { strategy: 'FORCE_SAMPLE', rowCount: count };  // 超过2倍阈值，强制采样
        } else if (count > maxRows) {
            return { strategy: 'WARN', rowCount: count };  // 超过阈值，警告
        }
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
    _options: IngestionOptions = {},  // 🔧 保留参数以兼容API，但已不使用硬编码阈值
    onProgress?: (percent: number) => void
): Promise<IngestionResult> {
    if (!db || !conn) throw new Error(globalT('settings.dbNotReady'));

    // 🆕 文件校验（P0）
    validateCSVFile(file);

    // 🆕 生成文件唯一标识（UUID防并发冲突）
    const fileId = crypto.randomUUID().replace(/-/g, '_');
    const originalTable = `t_${fileId}_original`; // 原始数据表（只读）
    const workingTable = `t_${fileId}_working`;  // 工作表（可清洗）

    // ✅ 删除硬编码阈值，改为动态计算

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

    // 2. 创建 original 表（完整数据）
    // TODO (P2): onProgress可以更均匀，避免40%→100%卡很久，但需DuckDB streaming API支持
    if (onProgress) onProgress(10);
    const start = performance.now();

    await conn.query(`
        CREATE TABLE ${originalTable} AS 
        SELECT * FROM read_csv_auto('${file.name}', ignore_errors=true, max_line_size=${MAX_CSV_LINE_SIZE})
    `);

    if (onProgress) onProgress(40);

    // 3. 🆕 纯内存评估采样策略
    // Step 3.1: 获取总行数和列数
    const countResult = await conn.query(`SELECT COUNT(*) as total FROM ${originalTable}`);
    const countRow = countResult.get(0);
    const totalRows = countRow ? Number(countRow['total']) : 0;

    const schemaResult = await conn.query(`DESCRIBE ${originalTable}`);
    const columnCount = schemaResult.numRows;

    // Step 3.2: 动态计算最大行数（基于设备内存和列数）
    // 2026-02-04: 恢复动态内存评估，结合 Arrow 传输（4-5x 加速）
    // Pyodide 0.29.3 WASM 限制: 2GB（不是旧版 256MB）
    const { calculateMaxRowsForPyodide } = await import('../utils/memoryAssessment');
    const maxRows = calculateMaxRowsForPyodide(columnCount);
    // 示例结果：
    // - 16GB设备 + 14列 → ~1,400,000 行（vs 旧版 178,756 行）
    // - 8GB设备 + 20列 → ~1,000,000 行（vs 旧版 125,000 行）
    // - 4GB设备 + 5列 → ~5,400,000 行（vs 旧版 680,000 行）

    // Step 3.3: 判断是否需要采样（纯行数比较，无文件大小条件）
    const shouldSample = totalRows > maxRows;

    logger.log('DuckDB', `采样决策（纯内存评估）`, {
        data: {
            原始行数: totalRows,
            列数: columnCount,
            内存评估最大行数: maxRows,
            是否采样: shouldSample,
            决策依据: '基于设备内存动态计算'
        }
    });

    let actualRows = totalRows;
    let sampleStrategy: 'memory-based' | 'full' = 'full';

    if (shouldSample) {
        // Step 3.4: 采样到maxRows行（精确行数，非百分比）
        await conn.query(`
            CREATE TABLE ${workingTable} AS 
            SELECT * FROM ${originalTable} 
            LIMIT ${maxRows}
        `);

        const sampledResult = await conn.query(`SELECT COUNT(*) as count FROM ${workingTable}`);
        const sampledRow = sampledResult.get(0);
        actualRows = sampledRow ? Number(sampledRow['count']) : 0;
        sampleStrategy = 'memory-based';

        logger.log('DuckDB', `✅ 采样完成`, {
            data: {
                原始: totalRows,
                采样后: actualRows,
                采样率: `${((actualRows / totalRows) * 100).toFixed(1)}%`
            }
        });
    } else {
        // Step 3.5: 不需要采样，创建working表（完整副本）
        await conn.query(`CREATE TABLE ${workingTable} AS SELECT * FROM ${originalTable}`);

        logger.log('DuckDB', `✅ 无需采样`, {
            data: {
                行数: totalRows,
                列数: columnCount,
                原因: '数据量在内存评估范围内'
            }
        });
    }

    if (onProgress) onProgress(100);
    const time = (performance.now() - start).toFixed(2);
    logger.log('DuckDB', '双表创建完成', { data: `${file.name}`, duration: Number(time) });

    // 4. 获取列信息（从 working 表）
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
        tableName: workingTable,
        rowCount: actualRows,
        originalRowCount: totalRows,  // 🆕 保留原始行数
        isSampled: shouldSample,
        sampleStrategy,  // 🆕 标记策略
        columns
    };
}
