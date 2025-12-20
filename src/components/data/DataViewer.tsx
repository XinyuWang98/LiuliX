import { useState, useEffect } from 'react';
import { Project } from '@utils/projectUtils';
import { useI18n } from '@contexts/I18nContext';
import { ParsedFileData } from '@utils/fileParser';
import { Database, Columns3, Loader, BarChart2 } from 'lucide-react';
import { DataTable } from './DataTable';
import { VirtualDataGrid } from '../VirtualDataGrid';
import { SmartFileTabBar } from './SmartFileTabBar';
import { useDataLoader } from './hooks/useDataLoader';

interface DataViewerProps {
    project: Project | null;
    fileData?: ParsedFileData | null; // Kept for compatibility
    activeFileId?: string; // 从外部接收当前激活的文件ID
    onProjectUpdate?: (project: Project) => void;
    onFileChange?: (fileId: string) => void;
    children?: React.ReactNode;
}

/**
 * 数据查看器组件 - Kaggle 风格
 * 智能路由：小文件走 Pyodide + DataTable，大文件/CSV 走 DuckDB + VirtualDataGrid
 */
export function DataViewer({ project, activeFileId: externalActiveFileId, onProjectUpdate, onFileChange, children }: DataViewerProps) {
    const { t } = useI18n();

    // 列筛选器状态
    const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    // 详细统计信息显示状态
    const [showStats, setShowStats] = useState(false);

    // 活动文件ID状态
    const [activeFileId, setActiveFileId] = useState<string | null>(null);

    // 初始化：使用外部传入的activeFileId，或选择第一个文件
    useEffect(() => {
        if (project && project.files.length > 0) {
            // 优先使用外部传入的activeFileId
            if (externalActiveFileId && project.files.find(f => f.id === externalActiveFileId)) {
                setActiveFileId(externalActiveFileId);
            } else if (!activeFileId || !project.files.find(f => f.id === activeFileId)) {
                setActiveFileId(project.files[0].id);
            }
        }
    }, [project?.id, externalActiveFileId]); // 监听外部activeFileId变化

    // 🆕 使用 useDataLoader hook 管理数据加载
    const { loading, error, dataInfo, duckInfo, useDuckDB } = useDataLoader(
        project,
        activeFileId,
        onProjectUpdate
    );

    // 初始化列筛选器（当DuckDB数据加载后）
    useEffect(() => {
        if (duckInfo && duckInfo.columns.length > 0) {
            const defaultColumnCount = Math.min(10, duckInfo.columns.length);
            setSelectedColumns(Array.from({ length: defaultColumnCount }, (_, i) => i));
        }
    }, [duckInfo]);

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
                padding: 'var(--gap-s) var(--gap-xs)', /* Reduced padding to 4px left/right */
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                borderBottom: '1px solid var(--border)', /* Optional: add border for separation */
                background: 'var(--bg-panel)',
            }}>
                {/* 左侧：文件切换 Tabs */}
                {project && (
                    <SmartFileTabBar
                        files={project.files}
                        activeFileId={activeFileId}
                        onFileChange={(id) => {
                            setActiveFileId(id);
                            if (onFileChange) {
                                onFileChange(id);
                            }
                        }}
                    />
                )}

                {/* 右侧：数据信息与工具 */}
                {(dataInfo || duckInfo) && (
                    <div style={{
                        display: 'flex',
                        gap: 'var(--gap-l)',
                        alignItems: 'center',
                        marginLeft: 'var(--gap-l)', /* Ensure separation from tabs */
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)' }}>
                            <Database size={14} style={{ color: 'var(--text-secondary)' }} />
                            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                                {(duckInfo?.rowCount || dataInfo?.row_count || 0).toLocaleString()} {t('pagination.rows')}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-s)' }}>
                            <Columns3 size={14} style={{ color: 'var(--text-secondary)' }} />

                            {/* 列筛选器按钮 (Swap Order: 1st) */}
                            {useDuckDB && duckInfo ? (
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setShowColumnSelector(!showColumnSelector)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--gap-xs)',
                                            padding: 'var(--gap-xs) var(--gap-s)',
                                            background: 'transparent',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-s)',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: 'var(--fs-sm)',
                                            transition: 'all var(--transition-fast)',
                                        }}
                                    >
                                        <span>{t('grid.selectedColumns', {
                                            count: selectedColumns.length,
                                            total: duckInfo.columns.length
                                        })}</span>
                                    </button>

                                    {/* 列筛选下拉框 */}
                                    {showColumnSelector && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '110%',
                                            right: 0,
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-m)',
                                            boxShadow: 'var(--shadow-lv2)',
                                            padding: 'var(--gap-s)',
                                            minWidth: '250px',
                                            maxHeight: '400px',
                                            zIndex: 1000,
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}>
                                            {/* 全选/取消全选按钮 - 固定在顶部 */}
                                            <div style={{
                                                display: 'flex',
                                                gap: 'var(--gap-s)',
                                                marginBottom: 'var(--gap-s)',
                                                paddingBottom: 'var(--gap-s)',
                                                borderBottom: '1px solid var(--border)',
                                                flexShrink: 0,
                                            }}>
                                                <button
                                                    onClick={() => setSelectedColumns(duckInfo.columns.map((_, idx) => idx))}
                                                    style={{
                                                        flex: 1,
                                                        padding: 'var(--gap-xs) var(--gap-s)',
                                                        background: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: 'var(--radius-s)',
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        fontSize: 'var(--fs-xs)',
                                                    }}
                                                >
                                                    {t('grid.selectAll')}
                                                </button>
                                                <button
                                                    onClick={() => setSelectedColumns([])}
                                                    style={{
                                                        flex: 1,
                                                        padding: 'var(--gap-xs) var(--gap-s)',
                                                        background: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: 'var(--radius-s)',
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        fontSize: 'var(--fs-xs)',
                                                    }}
                                                >
                                                    {t('grid.deselectAll')}
                                                </button>
                                            </div>

                                            {/* 列选择列表 - 可滚动区域 */}
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 'var(--gap-xs)',
                                                overflowY: 'auto',
                                                maxHeight: '300px',
                                            }}>
                                                {duckInfo.columns.map((col, idx) => (
                                                    <label
                                                        key={idx}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--gap-s)',
                                                            padding: 'var(--gap-xs)',
                                                            borderRadius: 'var(--radius-s)',
                                                            cursor: 'pointer',
                                                            transition: 'background var(--transition-fast)',
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedColumns.includes(idx)}
                                                            onChange={() => {
                                                                if (selectedColumns.includes(idx)) {
                                                                    setSelectedColumns(selectedColumns.filter(i => i !== idx));
                                                                } else {
                                                                    setSelectedColumns([...selectedColumns, idx].sort((a, b) => a - b));
                                                                }
                                                            }}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                        <span style={{
                                                            fontSize: 'var(--fs-sm)',
                                                            color: 'var(--text-primary)',
                                                        }}>
                                                            {col.name}
                                                        </span>
                                                        <span style={{
                                                            marginLeft: 'auto',
                                                            fontSize: 'var(--fs-xxs)',
                                                            color: 'var(--text-tertiary)',
                                                        }}>
                                                            {col.type}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                                    {(duckInfo ? duckInfo.columns.length : dataInfo?.column_count || 0)} 列
                                </span>
                            )}

                            {/* 统计切换按钮 (Swap Order: 2nd) */}
                            {useDuckDB && duckInfo && (
                                <button
                                    onClick={() => setShowStats(!showStats)}
                                    title={showStats ? t('grid.clickToCollapse') : t('grid.clickToExpand')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--gap-xs)',
                                        padding: 'var(--gap-xs) var(--gap-s)',
                                        background: showStats ? 'var(--bg-accent-subtle)' : 'transparent',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-s)',
                                        color: showStats ? 'var(--primary)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: 'var(--fs-sm)',
                                        transition: 'all var(--transition-fast)',
                                    }}
                                >
                                    <BarChart2 size={14} />
                                    <span>{t('grid.distribution')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 注入的内容 (如 AI Panel) */}
            {children}

            {/* 内容区域 (虚拟列表或普通表格) */}
            <div style={{
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                padding: '0',
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
                        borderRadius: 'var(--radius-m)',
                        overflow: 'hidden',
                        background: 'var(--bg-panel)'
                    }}>
                        <VirtualDataGrid
                            tableName={duckInfo.tableName}
                            rowCount={duckInfo.rowCount}
                            columns={duckInfo.columns}
                            selectedColumns={selectedColumns}
                            showStats={showStats}
                        />
                    </div>
                ) : dataInfo ? (
                    /* 常规 Pyodide 表格 */
                    <DataTable
                        columns={dataInfo.columns}
                        data={dataInfo.preview_data}
                        rowCount={dataInfo.row_count}
                    />
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
