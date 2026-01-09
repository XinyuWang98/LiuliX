/**
 * 数据准备Hook
 * 负责:
 * - 列信息获取
 * - 数据采样
 * - 数据脱敏
 * - 列类型推断
 */
import { DuckDBEngine } from '@/db/duckdbEngine';
import { sampleDataForAI } from '@/utils/sampleData';
import { getAnalysisConfig } from '@/config/analysisConfig';
import { logger } from '@/utils/logger';

export interface PreparedData {
    selectedColumns: string[];
    sampledData: any[];
    columnTypes?: Record<string, string>;
    privacyMode: 'raw' | 'sanitized';
    totalRows: number;
}

export async function useDataPreparation(
    columns: string[],
    rowCount: number,
    tableName?: string
): Promise<PreparedData> {
    logger.group('数据准备', '开始准备分析数据');

    // ========== 步骤1: 获取列信息 ==========
    let validColumns: string[] = columns || [];
    let totalRows = rowCount || 0;

    if (validColumns.length === 0 && tableName) {
        const engine = DuckDBEngine.getInstance();
        await engine.init();
        const describeResult = await engine.runQuery(`DESCRIBE ${tableName}`);
        validColumns = describeResult.map((row: any) => row.column_name);

        const countResult = await engine.runQuery(`SELECT COUNT(*) as cnt FROM ${tableName}`);
        totalRows = countResult[0]?.cnt || 0;
    }

    logger.log('数据准备', '列信息获取完成', { data: { columns: validColumns.length, totalRows } });

    // ========== 步骤2: 列数限制 ==========
    const analysisConfig = getAnalysisConfig();
    const MAX_COLUMNS = analysisConfig.maxColumns;
    let selectedColumns = validColumns;
    if (validColumns.length > MAX_COLUMNS) {
        selectedColumns = validColumns.slice(0, MAX_COLUMNS);
        logger.warn('数据准备', `列数过多,限制到${MAX_COLUMNS}列`, {
            data: { original: validColumns.length, limited: selectedColumns.length }
        });
    }

    // ========== 步骤3: 数据采样 ==========
    let sampledData: any[] = [];
    if (tableName) {
        const SAMPLE_ROWS = analysisConfig.samplingRows;
        const { sampledData: data } = await sampleDataForAI(tableName, SAMPLE_ROWS);
        sampledData = data;
    }

    // ========== 步骤4: 列类型获取 ==========
    let columnTypes: Record<string, string> | undefined;
    if (tableName) {
        try {
            const engine = DuckDBEngine.getInstance();
            const describeResult = await engine.runQuery(`DESCRIBE ${tableName}`);
            columnTypes = Object.fromEntries(
                describeResult.map((row: any) => [row.column_name, row.column_type])
            );
        } catch (e) {
            logger.warn('数据准备', '列类型获取失败,继续执行');
        }
    }

    // ========== 步骤5: 数据脱敏 ==========
    let columnInfo: any[] = [];
    let statsInfo: any[] = [];
    if (tableName) {
        try {
            const engine = DuckDBEngine.getInstance();
            const describeResult = await engine.runQuery(`DESCRIBE ${tableName}`);
            columnInfo = describeResult.map((row: any) => ({
                name: row.column_name,
                type: row.column_type
            }));
            statsInfo = columnInfo.map((col: any) => {
                const values = sampledData.map((row: any) => row[col.name]);
                return {
                    sampleData: values.slice(0, 3)
                };
            });
        } catch (e) {
            logger.warn('数据准备', '获取列信息失败,使用空列表');
        }
    }

    const { unifiedSanitize } = await import('@/utils/unifiedDataSanitizer');
    const { privacyMode } = await unifiedSanitize(
        columnInfo,
        statsInfo,
        sampledData,
        {
            respectUserSettings: true,
            intelligentDetection: true,
            granularity: 'coarse'
        }
    );

    logger.log('数据准备', `脱敏完成 模式=${privacyMode}`, {
        data: { columns: columnInfo.length, mode: privacyMode }
    });

    logger.groupEnd();

    return {
        selectedColumns,
        sampledData,
        columnTypes,
        privacyMode,
        totalRows
    };
}
