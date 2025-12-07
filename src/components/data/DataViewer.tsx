import { useState, useEffect } from 'react';
import { Project } from '@utils/projectUtils';
import { useI18n } from '@contexts/I18nContext';
import { ParsedFileData } from '@utils/fileParser';
import { FileText, Database, Columns3, LayoutGrid, Loader } from 'lucide-react';
import { pyodideManager } from '../../services/PyodideManager';
import { ColumnStats } from '@/types/data';
import { ColumnStatsCard } from './ColumnStatsCard';
import { DataTable } from './DataTable';
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

/**
 * 数据查看器组件 - Kaggle 风格
 * 显示列统计卡片 + 数据表格
 */
export function DataViewer({ project }: DataViewerProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [dataInfo, setDataInfo] = useState<DataFrameInfo | null>(null);
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

        try {
            // 1. 从 IndexedDB 加载项目数据
            const projects = await loadProjects();
            const projectData = projects.find((p: Project) => p.id === project.id);
            if (!projectData) throw new Error('项目数据未找到');

            // 2. 找到当前活动文件
            const file = projectData.files.find((f: any) => f.id === activeFileId);
            if (!file || !file.data) throw new Error('文件内容未找到');

            // 3. 使用 Pyodide 加载数据
            const fileContent = JSON.stringify(file.data);
            const loadResult = await pyodideManager.loadDataFromFile(
                fileContent,
                file.data.fileName.endsWith('.json') ? 'json' : 'csv',
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
                {dataInfo && (
                    <div style={{
                        display: 'flex',
                        gap: 'var(--gap-l)',
                        alignItems: 'center',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)' }}>
                            <Database size={14} style={{ color: 'var(--text-secondary)' }} />
                            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                                {dataInfo.row_count.toLocaleString()} 行
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)' }}>
                            <Columns3 size={14} style={{ color: 'var(--text-secondary)' }} />
                            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                                {dataInfo.column_count} 列
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
                ) : dataInfo ? (
                    /* 数据展示 */
                    <>
                        {/* 列统计卡片区 - 横向滚动 */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--gap-m)',
                            overflowX: 'auto',
                            paddingBottom: 'var(--gap-m)',
                            flexShrink: 0
                        }}>
                            {dataInfo.columns.map((col) => (
                                <ColumnStatsCard key={col.column_name} stats={col} />
                            ))}
                        </div>

                        {/* 数据表格 */}
                        <DataTable
                            columns={dataInfo.columns}
                            data={dataInfo.preview_data}
                            rowCount={dataInfo.row_count}
                        />

                        {/* Sheet 切换器 */}
                        {project && project.files.length > 1 && (
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
            </div>
        </div>
    );
}
