import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DuckDBEngine } from '../db/duckdbEngine';
import { ColumnMetadata, ColumnStats } from '../types/duckdb';
import { useI18n } from '../contexts/I18nContext';
import { formatTimestamp } from '../utils/dateUtils';
import { Loader, ChevronDown, Check } from 'lucide-react';
import { useErrorToast } from '../hooks/useErrorToast';
import './VirtualDataGrid.css';
import { NumericStatsPanel } from './datagrid/NumericStatsPanel';
import { CategoricalStatsPanel } from './datagrid/CategoricalStatsPanel';
import { MiniHistogram } from './datagrid/MiniHistogram';
import { MiniBarChart } from './datagrid/MiniBarChart';
import { SingleValueIndicator } from './datagrid/SingleValueIndicator';

interface VirtualDataGridProps {
    tableName: string;
    rowCount: number;
    columns: ColumnMetadata[];
    selectedColumns?: number[]; // 可选：选中的列索引数组
    showStats?: boolean;
}

// 常量定义（符合规则4：禁止魔法数字）
const PAGE_SIZE = 10; // 固定值：每页显示行数
const MIN_COLUMN_WIDTH = 120; // 最小列宽（px）
const MAX_COLUMN_WIDTH = 300; // 最大列宽（px）
const CHAR_WIDTH_COEFFICIENT = 10; // 每个字符占用的像素宽度
const COLUMN_WIDTH_BASE_OFFSET = 60; // 列宽计算的基础偏移量
const INDEX_COLUMN_WIDTH = 60; // 序号列固定宽度（px）
const MAX_TEXT_LENGTH = 100; // 单元格文本最大长度

/**
 * 格式化单元格值（类型感知）
 */
const formatCellValue = (value: any, type: string, t: (key: string) => string): string => {
    const typeUpper = type.toUpperCase();

    // NULL 值处理
    if (value === null || value === undefined) {
        return '-';
    }

    // 日期类型
    if (typeUpper.includes('DATE') || typeUpper.includes('TIMESTAMP')) {
        return formatTimestamp(value, typeUpper.includes('TIMESTAMP'));
    }

    // 数值类型 - 添加千分位分隔
    if (typeUpper.includes('INT') || typeUpper.includes('DOUBLE') || typeUpper.includes('DECIMAL') || typeUpper.includes('FLOAT') || typeUpper.includes('NUMBER')) {
        const num = Number(value);
        if (isNaN(num)) return String(value);
        if (typeUpper.includes('DOUBLE') || typeUpper.includes('DECIMAL') || typeUpper.includes('FLOAT')) {
            return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        }
        return num.toLocaleString(undefined);
    }

    // 布尔类型
    if (typeUpper === 'BOOLEAN' || typeUpper === 'BOOL') return value ? t('common.yes') : t('common.no');

    const str = String(value);
    if (str.length > MAX_TEXT_LENGTH) return str.substring(0, MAX_TEXT_LENGTH) + '...';
    return str;
};

/**
 * 简化版数据表格（带统计信息）
 */
export const VirtualDataGrid: React.FC<VirtualDataGridProps> = ({ tableName, rowCount, columns, selectedColumns: propsSelectedColumns, showStats = false }) => {
    const { t } = useI18n();
    const { showError } = useErrorToast();

    // Refs - 必须在顶层定义
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const tableBodyRef = useRef<HTMLDivElement>(null);

    // 状态
    const [currentPage, setCurrentPage] = useState(0);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<ColumnStats[]>([]);
    const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colName: string } | null>(null);

    // 交互状态
    const [modifyingColumn, setModifyingColumn] = useState<string | null>(null);
    const [activeTypeMenu, setActiveTypeMenu] = useState<string | null>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

    // 自适应列宽状态
    const [containerWidth, setContainerWidth] = useState(0);
    const [bonusWidth, setBonusWidth] = useState(0);

    // 类型定义
    const AVAILABLE_TYPES = [
        { label: t('grid.dataType.string'), value: 'VARCHAR' },
        { label: t('grid.dataType.integer'), value: 'INTEGER' },
        { label: t('grid.dataType.double'), value: 'DOUBLE' },
        { label: t('grid.dataType.boolean'), value: 'BOOLEAN' },
        { label: t('grid.dataType.date'), value: 'DATE' },
        { label: t('grid.dataType.timestamp'), value: 'TIMESTAMP' },
    ];

    const selectedColumns = propsSelectedColumns || Array.from({ length: columns.length }, (_, i) => i);
    const visibleColumns = columns.filter((_, idx) => selectedColumns.includes(idx));

    const engine = DuckDBEngine.getInstance();
    const rowCountNum = typeof rowCount === 'bigint' ? Number(rowCount) : rowCount;
    const totalPages = Math.ceil(rowCountNum / PAGE_SIZE);

    // 监听滚动或窗口大小变化，关闭下拉菜单
    useEffect(() => {
        const handleScrollOrResize = () => {
            if (activeTypeMenu) {
                setActiveTypeMenu(null);
                setDropdownPos(null);
            }
        };
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [activeTypeMenu]);

    // 监听容器宽度变化
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // 计算列宽逻辑
    useEffect(() => {
        if (containerWidth === 0 || visibleColumns.length === 0) return;
        let totalBaseWidth = INDEX_COLUMN_WIDTH;
        const baseWidths = visibleColumns.map(col => {
            const nameLength = col.name.length;
            return Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, nameLength * CHAR_WIDTH_COEFFICIENT + COLUMN_WIDTH_BASE_OFFSET));
        });
        totalBaseWidth += baseWidths.reduce((a, b) => a + b, 0);
        const availableSpace = containerWidth - 20;
        if (totalBaseWidth < availableSpace) {
            const extra = availableSpace - totalBaseWidth;
            setBonusWidth(Math.floor(extra / visibleColumns.length));
        } else {
            setBonusWidth(0);
        }
    }, [containerWidth, visibleColumns]);

    const getColumnWidth = useCallback((col: ColumnMetadata) => {
        const nameLength = col.name.length;
        const baseWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, nameLength * CHAR_WIDTH_COEFFICIENT + COLUMN_WIDTH_BASE_OFFSET));
        return baseWidth + bonusWidth;
    }, [bonusWidth]);

    // 加载统计信息
    useEffect(() => {
        let active = true;
        const loadStats = async () => {
            try {
                const s = await engine.getColumnStats(tableName);
                if (active) setStats(s);
            } catch (err) {
                console.error(t('grid.loadStatsFailed'), err);
            }
        };
        loadStats();
        return () => { active = false; };
    }, [tableName, engine, t]);

    // 加载数据
    const loadPage = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const offset = page * PAGE_SIZE;
            const rows = await engine.queryChunk(tableName, offset, PAGE_SIZE);
            setData(rows);
        } catch (err) {
            console.error(t('grid.loadDataFailed'), err);
        } finally {
            setLoading(false);
        }
    }, [tableName, engine, t]);

    useEffect(() => {
        loadPage(currentPage);
    }, [currentPage, loadPage]);

    // 处理类型变更
    const handleTypeChange = async (columnName: string, newType: string) => {
        setActiveTypeMenu(null);
        setDropdownPos(null);
        setModifyingColumn(columnName);
        try {
            const success = await engine.alterColumnType(tableName, columnName, newType);
            if (success) {
                await loadPage(currentPage);
                const s = await engine.getColumnStats(tableName);
                setStats(s);
            } else {
                showError({ message: t('grid.dataType.failed') });
            }
        } catch (error) {
            showError({ message: t('grid.dataType.failed') + ': ' + (error as Error).message });
        } finally {
            setModifyingColumn(null);
        }
    };

    // 同步滚动
    const syncScroll = () => {
        if (headerRef.current && tableBodyRef.current) {
            headerRef.current.scrollLeft = tableBodyRef.current.scrollLeft;
        }
    };

    return (
        <div className="virtualGridContainer" ref={containerRef}>
            {/* 表头区 */}
            <div className="enhancedGridHeader" ref={headerRef} style={{ overflowX: 'hidden' }}>
                <div
                    className="enhancedHeaderCell enhancedHeaderCell-index"
                    style={{ minWidth: `${INDEX_COLUMN_WIDTH}px`, maxWidth: `${INDEX_COLUMN_WIDTH}px` }}
                >
                    <div className="headerCellTop">
                        <span className="headerCellName">#</span>
                    </div>
                </div>

                {visibleColumns.map((col, idx) => {
                    const stat = stats.find(s => s.name === col.name);
                    const nullRate = stat ? (stat.nullCount / stat.total) * 100 : 0;
                    const typeUpper = col.type.toUpperCase();
                    const isNumericType = typeUpper.includes('INT') || typeUpper.includes('DOUBLE') || typeUpper.includes('FLOAT') || typeUpper.includes('DECIMAL') || typeUpper.includes('NUMBER');

                    return (
                        <div
                            key={idx}
                            className="enhancedHeaderCell"
                            style={{
                                minWidth: `${getColumnWidth(col)}px`,
                                maxWidth: `${getColumnWidth(col)}px`,
                                textAlign: 'left', // 强制左对齐
                                '--null-rate': `${nullRate}%`,
                                position: 'relative',
                            } as React.CSSProperties}
                        >
                            <div className="headerCellTop">
                                <span className="headerCellName" title={col.name}>{col.name}</span>
                                <div style={{ position: 'relative' }}>
                                    <button
                                        className={`headerCellTypeBadge ${activeTypeMenu === col.name ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (activeTypeMenu === col.name) {
                                                setActiveTypeMenu(null);
                                                setDropdownPos(null);
                                            } else {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                                                setActiveTypeMenu(col.name);
                                            }
                                        }}
                                        disabled={modifyingColumn === col.name}
                                        title={t('grid.dataType.setAs', { type: '' })}
                                    >
                                        {modifyingColumn === col.name ? (
                                            <Loader size={10} className="spinner" />
                                        ) : (
                                            <>
                                                <span>{stat?.type || col.type}</span>
                                                <ChevronDown size={10} style={{ opacity: 0.7 }} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* 缺失率 */}
                            <div className="missing-rate-container" title={`${t('grid.missingPercent', { percent: nullRate.toFixed(1) })} (${stat?.nullCount} rows)`}>
                                <div className="missing-rate-bar-bg">
                                    <div
                                        className="missing-rate-bar-fill"
                                        style={{
                                            width: `${nullRate}%`,
                                            backgroundColor: nullRate > 50 ? 'var(--error)' : nullRate > 10 ? 'var(--warning)' : 'var(--success)'
                                        }}
                                    />
                                </div>
                                <span className="missing-rate-text">{nullRate.toFixed(1)}%</span>
                            </div>

                            {/* 可视化组件 */}
                            {stat?.uniqueCount === 1 ? (
                                <SingleValueIndicator value={stat.categoricalStats?.topValues?.[0]?.value ?? stat.numericStats?.min ?? 'N/A'} type={col.type} />
                            ) : stat?.distribution ? (
                                <MiniHistogram distribution={stat.distribution} type={col.type} columnName={col.name} />
                            ) : stat?.categoricalStats ? (
                                <MiniBarChart categoricalStats={stat.categoricalStats} type={col.type} columnName={col.name} />
                            ) : null}

                            {/* 基础统计文本 */}
                            {stat && (
                                <div className="headerCellStats">
                                    <span className="statMiniText">
                                        {stat.uniqueCount > 0 && t('grid.uniqueValues', { count: stat.uniqueCount })}
                                    </span>
                                </div>
                            )}

                            {/* 详细统计面板 */}
                            {showStats && stat && (
                                <div className="headerDetailedStats">
                                    {isNumericType && stat.numericStats ? (
                                        <NumericStatsPanel stat={stat.numericStats} />
                                    ) : !isNumericType && stat.categoricalStats ? (
                                        <CategoricalStatsPanel stat={stat.categoricalStats} type={col.type} columnName={col.name} />
                                    ) : null}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 表体 */}
            <div className="simpleTableBody" ref={tableBodyRef} onScroll={syncScroll}>
                {loading ? (
                    <div className="loadingPlaceholder">
                        <div className="loadingSpinner" />
                        <span>{t('grid.loading')}</span>
                    </div>
                ) : (
                    data.map((row, rowIdx) => {
                        const isSelectedRow = selectedCell?.rowIdx === rowIdx;
                        return (
                            <div key={rowIdx} className="simpleTableRow">
                                <div
                                    className={`enhancedGridCell enhancedGridCell-index ${isSelectedRow ? 'highlightRow' : ''}`}
                                    style={{ minWidth: `${INDEX_COLUMN_WIDTH}px`, maxWidth: `${INDEX_COLUMN_WIDTH}px` }}
                                    onClick={() => setSelectedCell({ rowIdx, colName: '' })}
                                >
                                    {currentPage * PAGE_SIZE + rowIdx + 1}
                                </div>
                                {visibleColumns.map((col, colIdx) => {
                                    const isSelectedCol = selectedCell?.colName === col.name;
                                    const typeUpper = col.type.toUpperCase();
                                    const isNumericType = typeUpper.includes('INT') || typeUpper.includes('DOUBLE') || typeUpper.includes('FLOAT') || typeUpper.includes('DECIMAL') || typeUpper.includes('NUMBER');

                                    return (
                                        <div
                                            key={colIdx}
                                            className={`enhancedGridCell ${isSelectedRow ? 'highlightRow' : ''} ${isSelectedCol ? 'highlightCol' : ''} ${isSelectedRow && isSelectedCol ? 'highlightCell' : ''}`}
                                            onClick={() => setSelectedCell({ rowIdx, colName: col.name })}
                                            style={{
                                                minWidth: `${getColumnWidth(col)}px`,
                                                maxWidth: `${getColumnWidth(col)}px`,
                                                justifyContent: isNumericType ? 'flex-end' : 'flex-start',
                                            }}
                                            title={String(row[col.name] ?? '')}
                                        >
                                            {formatCellValue(row[col.name], col.type, t)}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
            </div>

            {/* 分页器 */}
            <div className="simplePagination">
                <button
                    className="paginationBtn"
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0 || loading}
                >
                    {t('pagination.prev')}
                </button>
                <span className="paginationInfo">
                    {t('pagination.page')} <strong>{currentPage + 1}</strong> {t('pagination.of')} {totalPages} {t('pagination.totalPages')} · {t('pagination.totalRows')} <strong>{rowCount.toLocaleString()}</strong> {t('pagination.rows')}
                </span>
                <button
                    className="paginationBtn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1 || loading}
                >
                    {t('pagination.next')}
                </button>
            </div>

            {/* Portal Dropdown Menu */}
            {activeTypeMenu && dropdownPos && createPortal(
                <div
                    className="type-dropdown-menu"
                    style={{
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        position: 'fixed'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {AVAILABLE_TYPES.map((typeOption) => {
                        const currentType = stats.find(s => s.name === activeTypeMenu)?.type || 'VARCHAR';
                        const isSelected = currentType === typeOption.value;
                        return (
                            <button
                                key={typeOption.value}
                                className={`type-dropdown-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleTypeChange(activeTypeMenu, typeOption.value)}
                            >
                                {typeOption.label}
                                {isSelected && <Check size={12} />}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
};
