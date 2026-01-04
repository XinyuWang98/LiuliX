import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '@utils/projectUtils';
import { useI18n } from '@contexts/I18nContext';
import { ParsedFileData } from '@utils/fileParser';
import { Database, Columns3, Loader, BarChart2 } from 'lucide-react';
import { DataTable } from './DataTable';
import { LiuliGlass } from '../common/liulix/LiuliGlass';
import { VirtualDataGridV2 } from '../VirtualDataGridV2';
import { SmartFileTabBar } from './SmartFileTabBar';
import { useDataLoader } from './hooks/useDataLoader';
import { ColumnSelectorButton } from './ColumnSelectorButton';
import './DataViewerV2.css'; // [FIX] Import CSS style

interface DataViewerProps {
    project: Project | null;
    fileData?: ParsedFileData | null; // Kept for compatibility
    activeFileId?: string; // 从外部接收当前激活的文件ID
    onProjectUpdate?: (project: Project) => void;
    onFileChange?: (fileId: string) => void;
    children?: React.ReactNode;
}

/**
 * 数据查看器组件 - Kaggle 风格 (V2 Updated)
 * 智能路由：小文件走 Pyodide + DataTable，大文件/CSV 走 DuckDB + VirtualDataGridV2
 */
export function DataViewerV2({ project, activeFileId: externalActiveFileId, onProjectUpdate, onFileChange, children }: DataViewerProps) {
    const { t } = useI18n();

    // 列筛选器状态
    const [selectedColumns, setSelectedColumns] = useState<number[]>([]);

    // 详细统计信息显示状态（默认展开以对齐 Design 页面）
    const [showStats, setShowStats] = useState(true);

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
            // overflow: 'hidden', // [FIX] Removed to allow dropdown to overflow
        }}>
            {/* 顶栏 */}
            <div className="data-viewer-v2-topbar">
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
                    <div className="data-viewer-toolbar-right">
                        <div className="data-viewer-stats-info">
                            <Database size={14} />
                            <span>
                                {(duckInfo?.rowCount || dataInfo?.row_count || 0).toLocaleString()} {t('pagination.rows')}
                            </span>
                        </div>
                        <div className="data-viewer-controls">
                            <Columns3 size={14} style={{ color: 'var(--text-secondary)' }} />

                            {/* 列筛选器按钮 (Swap Order: 1st) */}
                            {useDuckDB && duckInfo ? (
                                <ColumnSelectorButton
                                    selectedColumns={selectedColumns}
                                    totalColumns={duckInfo.columns.length}
                                    columns={duckInfo.columns}
                                    onSelectionChange={setSelectedColumns}
                                />
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
                                    className={`data-viewer-btn ${showStats ? 'active' : ''}`}
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
                    /* DuckDB 虚拟表格 V2 - 使用 LiuliGlass 组件 */
                    <LiuliGlass intensity="medium" className="virtual-grid-glass-wrapper">
                        <VirtualDataGridV2
                            tableName={duckInfo.tableName}
                            rowCount={duckInfo.rowCount}
                            columns={duckInfo.columns}
                            selectedColumns={selectedColumns}
                            showStats={showStats}
                        />
                    </LiuliGlass>
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
