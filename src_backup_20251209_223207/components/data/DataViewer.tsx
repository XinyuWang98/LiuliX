import { useState, useEffect } from 'react';
import { Project } from '@utils/projectUtils';
import { useI18n } from '@contexts/I18nContext';
import { ParsedFileData } from '@utils/fileParser';
import { FileText, Database, Columns3, LayoutGrid, Loader } from 'lucide-react';
import { pyodideManager } from '../../services/PyodideManager';
import { ColumnStats } from '@/types/data';
import { DataTable } from './DataTable';
import { VirtualDataGrid } from '../VirtualDataGrid';
import { DuckDBEngine } from '../../db/duckdbEngine';
import { ColumnMetadata } from '../../types/duckdb';
import { loadProjects } from '@utils/indexedDB';

interface DataViewerProps {
    project: Project | null;
    fileData?: ParsedFileData | null; // Kept for compatibility
}

interface DataFrameInfo {
    columns: ColumnStats[];
    row_count: number;
    column_count: number;
    preview_data: any[][];
}

interface DuckDBInfo {
    tableName: string;
    rowCount: number;
    columns: ColumnMetadata[];
}

/**
 * 数据查看器组件 - Kaggle 风格
 * 智能路由：小文件走 Pyodide + DataTable，大文件/CSV 走 DuckDB + VirtualDataGrid
 */
export function DataViewer({ project }: DataViewerProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [dataInfo, setDataInfo] = useState<DataFrameInfo | null>(null);

    // DuckDB 状态
    const [duckInfo, setDuckInfo] = useState<DuckDBInfo | null>(null);
    const [useDuckDB, setUseDuckDB] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);

    // 初始化：选择第一个文件
    useEffect(() => {
        if (project && project.files.length > 0) {
            if (!activeFileId || !project.files.find(f => f.id === activeFileId)) {
                setActiveFileId(project.files[0].id);
            }
        }
    }, [project]);

    // 加载数据当项目或活动文件变化时
    useEffect(() => {
        if (project && activeFileId) {
            loadData();
        }
    }, [project, activeFileId]);

    async function loadData() {
        if (!project || !activeFileId) return;

        setLoading(true);
        setError(null);
        setDuckInfo(null);
        setDataInfo(null);
        setUseDuckDB(false);

        try {
            // 1. 从 IndexedDB 加载项目数据
            const projects = await loadProjects();
            const projectData = projects.find((p: Project) => p.id === project.id);
            if (!projectData) throw new Error('项目数据未找到');

            // 2. 找到当前活动文件
            const file = projectData.files.find((f: any) => f.id === activeFileId);
            if (!file || !file.data) throw new Error('文件内容未找到');

            const fileName = file.data.fileName.toLowerCase();
            const isCSV = fileName.endsWith('.csv');

            // 策略：如果是 CSV 且行数 > 5000 或强制使用 DuckDB
            // 这里为了演示 VirtualDataGrid，我们对所有 CSV 优先尝试 DuckDB
            if (isCSV) {
                try {
                    // 尝试使用 DuckDB
                    const engine = DuckDBEngine.getInstance();
                    await engine.init();

                    // Prioritize original raw file (optimized path)
                    if (file.data.originalFile) {
                        const rawFile = file.data.originalFile;

                        // Pass options based on FileUploader's flags
                        // If file.data.isSampled is true, it means FORCE_SAMPLE or User Confirmed Sample
                        const result = await engine.ingestCSV(rawFile, {
                            sampleSize: file.data.isSampled ? 200000 : -1, // Use standard large chunk if sampled
                            sampleRate: 0.2, // Default 20%
                            autoSampleThreshold: 200000 // Force threshold match
                        });

                        setDuckInfo({
                            tableName: result.tableName,
                            rowCount: result.rowCount,
                            columns: result.columns
                        });
                        setUseDuckDB(true);
                        return;
                    }

                    // Fallback: Reconstruct CSV from JSON (Legacy/Edge case)
                    // ... (Original logic kept as safety net)
                    let csvContent = '';
                    const data = file.data.data;
                    if (data && data.length > 0) {
                        const headers = Object.keys(data[0]);
                        csvContent += headers.join(',') + '\n';
                        data.forEach((row: any) => {
                            csvContent += headers.map(h => {
                                const val = row[h];
                                return val === null || val === undefined ? '' : String(val);
                            }).join(',') + '\n';
                        });
                    }

                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const csvFile = new File([blob], fileName, { type: 'text/csv' });

                    const result = await engine.ingestCSV(csvFile);
                    setDuckInfo({
                        tableName: result.tableName,
                        rowCount: result.rowCount,
                        columns: result.columns
                    });
                    setUseDuckDB(true);
                    return;

                } catch (duckErr) {
                    console.warn('DuckDB 加载失败，回退到 Pyodide', duckErr);
                }
            }

            // 3. 使用 Pyodide 加载数据 (Fallback)
            const fileContent = JSON.stringify(file.data);
            const loadResult = await pyodideManager.loadDataFromFile(
                fileContent,
                fileName.endsWith('.json') ? 'json' : 'csv',
                { maxRows: 100000, sample: false }
            );

            // 4. 计算列统计信息
            const columnStats = await pyodideManager.calculateColumnStats();

            // 5. 组合数据
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

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'transparent',
            overflow: 'hidden',
        }}>
            {/* 顶栏 */}
            <div style={{
                padding: 'var(--gap-l)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                <h2 style={{
                    fontSize: 'var(--fs-lg)',
                    fontWeight: 'var(--fw-bold)',
                    margin: 0,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <LayoutGrid size={20} />
                    {project ? project.name : 'Data Explorer'}
                </h2>

                {/* 数据集信息 */}
                {(dataInfo || duckInfo) && (
                    <div style={{
                        display: 'flex',
                        gap: 'var(--gap-l)',
                        alignItems: 'center',
                    }}>
                        {useDuckDB && (
                            <span style={{
                                fontSize: 'var(--fs-xs)',
                                background: 'var(--bg-accent)',
                                color: '#fff',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                DuckDB Turbo
                            </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)' }}>
                            <Database size={14} style={{ color: 'var(--text-secondary)' }} />
                            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                                {(duckInfo?.rowCount || dataInfo?.row_count || 0).toLocaleString()} 行
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)' }}>
                            <Columns3 size={14} style={{ color: 'var(--text-secondary)' }} />
                            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                                {(duckInfo ? duckInfo.columns.length : dataInfo?.column_count || 0)} 列
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 内容区域 */}
            <div style={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: '0 var(--gap-l) var(--gap-l)',
            }}>
                {loading ? (
                    /* 加载状态 */
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <Loader size={40} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>正在加载数据...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : error ? (
                    /* 错误状态 */
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--error)'
                    }}>
                        错误: {error}
                    </div>
                ) : (useDuckDB && duckInfo) ? (
                    /* DuckDB 虚拟表格 */
                    <div style={{
                        flex: 1,
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-m)',
                        overflow: 'hidden',
                        background: 'var(--bg-panel)'
                    }}>
                        <VirtualDataGrid
                            tableName={duckInfo.tableName}
                            rowCount={duckInfo.rowCount}
                            columns={duckInfo.columns}
                        />
                    </div>
                ) : dataInfo ? (
                    /* 常规 Pyodide 表格 */
                    <>
                        <DataTable
                            columns={dataInfo.columns}
                            data={dataInfo.preview_data}
                            rowCount={dataInfo.row_count}
                        />
                        {/* Sheet 切换器 (省略，仅 CSV 场景下通常无多 Sheet) */}
                    </>
                ) : (
                    /* 空状态 */
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        {t('dataSource.noProjects')}
                    </div>
                )}

                {/* 底部 Sheet 切换器 (仅在 Pyodide 模式且多文件时显示) */}
                {(!useDuckDB && project && project.files.length > 1) && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--bg-panel)',
                        borderTop: '1px solid var(--border)',
                        marginTop: 'var(--gap-m)',
                        overflowX: 'auto',
                        borderRadius: 'var(--radius-m)'
                    }}>
                        {project.files.map(file => (
                            <button
                                key={file.id}
                                onClick={() => setActiveFileId(file.id)}
                                style={{
                                    padding: '10px 18px',
                                    border: 'none',
                                    background: activeFileId === file.id ? 'var(--primary)' : 'transparent',
                                    color: activeFileId === file.id ? '#fff' : 'var(--text-secondary)',
                                    borderRight: '1px solid var(--border)',
                                    fontWeight: activeFileId === file.id ? '600' : '400',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <FileText size={14} />
                                {file.data.fileName}
                            </button>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
