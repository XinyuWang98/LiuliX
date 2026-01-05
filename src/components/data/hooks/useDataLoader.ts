import { useState, useEffect } from 'react';
import { Project } from '@utils/projectUtils';
import { DuckDBEngine } from '../../../db/duckdbEngine';
import { DataLoadingService } from '../../../services/dataLoadingService';
import { logger } from '../../../utils/logger';
import { ColumnMetadata } from '../../../types/duckdb';
import { ColumnStats } from '@/types/data';
import { pyodideManager } from '../../../services/PyodideManager';

export interface DataFrameInfo {
    columns: ColumnStats[];
    row_count: number;
    column_count: number;
    preview_data: any[][];
}

export interface DuckDBInfo {
    tableName: string;
    rowCount: number;
    columns: ColumnMetadata[];
}

/**
 * 数据加载 Hook
 * 职责：封装数据加载逻辑和状态管理
 */
export function useDataLoader(
    project: Project | null,
    activeFileId: string | null,
    onProjectUpdate?: (project: Project) => void
) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataInfo, setDataInfo] = useState<DataFrameInfo | null>(null);
    const [duckInfo, setDuckInfo] = useState<DuckDBInfo | null>(null);
    const [useDuckDB, setUseDuckDB] = useState(false);

    useEffect(() => {
        if (project && activeFileId) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.id, activeFileId, project?.files.find(f => f.id === activeFileId)?.data?.lastModified]);

    async function loadData() {
        if (!project || !activeFileId) return;

        setLoading(true);
        setError(null);
        setDuckInfo(null);
        setDataInfo(null);
        setUseDuckDB(false);

        try {
            const file = project.files.find((f: any) => f.id === activeFileId);
            if (!file || !file.data) throw new Error('文件内容未找到');

            const fileName = file.data.fileName.toLowerCase();
            const isCSV = fileName.endsWith('.csv');

            // 策略：CSV 文件优先尝试 DuckDB
            if (isCSV) {
                try {
                    const updateProjectState = (tableName: string) => {
                        if (project && onProjectUpdate && activeFileId) {
                            const updatedProject = DataLoadingService.updateProjectTableName(
                                project,
                                activeFileId,
                                tableName
                            );
                            onProjectUpdate(updatedProject);
                            logger.log('文件管理', '已更新Project状态中的tableName', { data: { tableName } });
                        }
                    };

                    const engine = DuckDBEngine.getInstance();
                    await engine.init();

                    // 优先使用已存在的tableName
                    if (file.data.tableName) {
                        logger.log('文件管理', '使用已有tableName', { data: { tableName: file.data.tableName } });

                        // 1. 先尝试清理失效表名
                        const cleanedProject = await DataLoadingService.cleanupInvalidTableName(
                            project,
                            activeFileId,
                            engine
                        );

                        if (cleanedProject) {
                            // tableName 已失效，触发项目更新并重新 ingest
                            onProjectUpdate?.(cleanedProject);
                            const result = await DataLoadingService.loadWithDuckDB(file, engine);
                            setDuckInfo(result);
                            setUseDuckDB(true);
                            updateProjectState(result.tableName);
                            return;
                        }

                        // 2. tableName 有效，直接使用
                        const columns = await engine.getTableColumns(file.data.tableName);
                        const countResult = await engine.runQuery(`SELECT COUNT(*) as count FROM ${file.data.tableName}`);
                        const rowCount = countResult[0]?.count || 0;

                        setDuckInfo({ tableName: file.data.tableName, rowCount, columns });
                        setUseDuckDB(true);
                        return;
                    }


                    // 重新 ingest
                    const result = await DataLoadingService.loadWithDuckDB(file, engine);
                    setDuckInfo(result);
                    setUseDuckDB(true);
                    updateProjectState(result.tableName);
                    return;

                } catch (duckErr) {
                    console.warn('DuckDB 加载失败，回退到 Pyodide', duckErr);
                }
            }

            // 回退到 Pyodide
            let fileContent = '';

            if (file.data.rawContent) {
                fileContent = file.data.rawContent;
            } else if (Array.isArray(file.data.data) && file.data.data.length > 0) {
                // Reconstruct CSV from data if rawContent is missing
                // This handles the case where rawContent was dropped or not saved, but we have parsed rows
                const Papa = (await import('papaparse')).default;
                fileContent = Papa.unparse({
                    fields: file.data.columns,
                    data: file.data.data
                });
            } else {
                // Fallback for valid JSON or last resort
                fileContent = JSON.stringify(file.data);
            }

            const loadResult = await pyodideManager.loadDataFromFile(
                fileContent,
                fileName.endsWith('.json') ? 'json' : 'csv',
                { maxRows: 100000, sample: false }
            );

            const columnStats = await pyodideManager.calculateColumnStats();

            setDataInfo({
                columns: columnStats,
                row_count: loadResult.row_count,
                column_count: loadResult.column_count,
                preview_data: loadResult.preview_data
            });

        } catch (err) {
            console.error('数据加载失败:', err);
            setError(err instanceof Error ? err.message : '数据加载失败');
        } finally {
            setLoading(false);
        }
    }

    return {
        loading,
        error,
        dataInfo,
        duckInfo,
        useDuckDB,
        reload: loadData
    };
}
