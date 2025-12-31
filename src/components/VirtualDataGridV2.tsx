import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DuckDBEngine } from '../db/duckdbEngine';
import type { ColumnInfo, ColumnStats } from '../types/duckdb';
import { useI18n } from '../contexts/I18nContext';
import { formatTimestamp } from '../utils/dateUtils';
import { Loader, ChevronDown, ChevronUp, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useErrorToast } from '../hooks/useErrorToast';
import { NumericStatsPanel } from './datagrid/NumericStatsPanel';
import { CategoricalStatsPanel } from './datagrid/CategoricalStatsPanel';
import { MiniHistogram } from './datagrid/MiniHistogram';
import { MiniBarChart } from './datagrid/MiniBarChart';
import { SingleValueIndicator } from './datagrid/SingleValueIndicator';
import './VirtualDataGrid.css';

interface VirtualDataGridProps {
    tableName: string;
    rowCount: number;
    columns: ColumnMetadata[];
    selectedColumns?: number[]; // 可选：选中的列索引数组
    showStats?: boolean;
}

// 常量定义（符合规则4：禁止魔法数字）
const 每页行数 = 10; // 固定值：每页显示行数
const 最小列宽 = 120; // 最小列宽（px）
const 最大列宽 = 300; // 最大列宽（px）
const 列名字符宽度系数 = 10; // 每个字符占用的像素宽度
const 列宽基础偏移 = 60; // 列宽计算的基础偏移量
const 序号列宽度 = 60; // 序号列固定宽度（px）
const 最大文本长度 = 100; // 单元格文本最大长度

/**
 * 获取类型图标化显示（对齐 Design 页面）
 */
const getTypeIcon = (dbType: string): string => {
    const typeUpper = dbType.toUpperCase();

    // 数值型
    if (typeUpper.includes('INT') || typeUpper.includes('DOUBLE') ||
        typeUpper.includes('DECIMAL') || typeUpper.includes('FLOAT') ||
        typeUpper.includes('NUMBER') || typeUpper.includes('NUMERIC')) {
        return '123';
    }

    // 文本型
    if (typeUpper.includes('VARCHAR') || typeUpper.includes('TEXT') ||
        typeUpper.includes('STRING') || typeUpper.includes('CHAR')) {
        return 'Txt';
    }

    // 布尔型
    if (typeUpper.includes('BOOL')) {
        return 'T/F';
    }

    // 默认返回 Txt
    return 'Txt';
};

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
    if (str.length > 最大文本长度) return str.substring(0, 最大文本长度) + '...';
    return str;
};

/**
 * 简化版数据表格（带统计信息）- V2 Updated
 */
export const VirtualDataGridV2: React.FC<VirtualDataGridProps> = ({ tableName, rowCount, columns, selectedColumns: propsSelectedColumns, showStats = false }) => {
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
    const totalPages = Math.ceil(rowCountNum / 每页行数);

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
        let totalBaseWidth = 序号列宽度;
        const baseWidths = visibleColumns.map(col => {
            const nameLength = col.name.length;
            return Math.max(最小列宽, Math.min(最大列宽, nameLength * 列名字符宽度系数 + 列宽基础偏移));
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
        const baseWidth = Math.max(最小列宽, Math.min(最大列宽, nameLength * 列名字符宽度系数 + 列宽基础偏移));
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
            const offset = page * 每页行数;
            const rows = await engine.queryChunk(tableName, offset, 每页行数);
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
                    className="enhancedHeaderCell enhancedHeaderCell序号列"
                    style={{ minWidth: `${序号列宽度}px`, maxWidth: `${序号列宽度}px`, width: `${序号列宽度}px` }}
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
                                width: `${getColumnWidth(col)}px`,
                                textAlign: 'left',
                                '--null-rate': `${nullRate}% `,
                                position: 'relative',
                            } as React.CSSProperties}
                        >
                            <div className="header-cell-inline">
                                {/* 1. Column Name & Type Badge */}
                                <div className="column-name">
                                    <span title={col.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</span>

                                    {/* Type Icon + Name (对齐 Design 页面) */}
                                    <div className="column-type">
                                        <span style={{ marginRight: '4px', fontWeight: 'bold' }}>{getTypeIcon(stat?.type || col.type)}</span>
                                        <span style={{ textTransform: 'lowercase', opacity: 0.7, fontSize: '11px' }}>
                                            {isNumericType ? 'numeric' : 'text'}
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Missing Rate Bar */}
                                <div className="missing-rate-container" title={`${t('grid.missingPercent', { percent: nullRate.toFixed(1) })} (${stat?.nullCount} rows)`}>
                                    <div className="missing-rate-bar-bg">
                                        <div
                                            className="missing-rate-bar-fill"
                                            style={{
                                                width: `${nullRate}% `,
                                                backgroundColor: nullRate > 50 ? 'var(--error)' : nullRate > 10 ? 'var(--warning)' : 'var(--success)'
                                            }}
                                        />
                                    </div>
                                    <span className="missing-rate-text">{nullRate.toFixed(1)}%</span>
                                </div>

                                {/* 3. Mini Charts */}
                                {stat?.uniqueCount === 1 ? (
                                    <SingleValueIndicator value={stat.categoricalStats?.topValues?.[0]?.value ?? stat.numericStats?.min ?? 'N/A'} type={col.type} />
                                ) : stat?.distribution ? (
                                    <div style={{ marginTop: '4px' }}>
                                        <MiniHistogram distribution={stat.distribution} type={col.type} columnName={col.name} />
                                    </div>
                                ) : stat?.categoricalStats ? (
                                    <div style={{ marginTop: '4px' }}>
                                        <MiniBarChart categoricalStats={stat.categoricalStats} type={col.type} columnName={col.name} />
                                    </div>
                                ) : null}

                                {/* 4. Unique Count */}
                                {stat && stat.uniqueCount > 0 && (
                                    <div className="unique-count">
                                        {t('grid.uniqueValues', { count: stat.uniqueCount })}
                                    </div>
                                )}

                                {/* 5. Detailed Stats Panel (Expandable) */}
                                {showStats && stat && (
                                    isNumericType && stat.numericStats ? (
                                        <NumericStatsPanel stat={stat.numericStats} />
                                    ) : !isNumericType && stat.categoricalStats ? (
                                        <CategoricalStatsPanel stat={stat.categoricalStats} type={col.type} columnName={col.name} />
                                    ) : null
                                )}
                            </div>
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
                                    className={`enhancedGridCell enhancedGridCell序号 ${isSelectedRow ? 'highlightRow' : ''} `}
                                    style={{ minWidth: `${序号列宽度}px`, maxWidth: `${序号列宽度}px`, width: `${序号列宽度}px` }}
                                    onClick={() => setSelectedCell({ rowIdx, colName: '' })}
                                >
                                    {currentPage * 每页行数 + rowIdx + 1}
                                </div>
                                {visibleColumns.map((col, colIdx) => {
                                    const isSelectedCol = selectedCell?.colName === col.name;
                                    const typeUpper = col.type.toUpperCase();
                                    const isNumericType = typeUpper.includes('INT') || typeUpper.includes('DOUBLE') || typeUpper.includes('FLOAT') || typeUpper.includes('DECIMAL') || typeUpper.includes('NUMBER');

                                    return (
                                        <div
                                            key={colIdx}
                                            className={`enhancedGridCell ${isSelectedRow ? 'highlightRow' : ''} ${isSelectedCol ? 'highlightCol' : ''} ${isSelectedRow && isSelectedCol ? 'highlightCell' : ''} `}
                                            onClick={() => setSelectedCell({ rowIdx, colName: col.name })}
                                            style={{
                                                minWidth: `${getColumnWidth(col)}px`,
                                                maxWidth: `${getColumnWidth(col)}px`,
                                                width: `${getColumnWidth(col)}px`,
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

            {/* 分页器 - Design Style */}
            <div className="simplePagination">
                <div className="paginationInfo">
                    {t('pagination.page')} <strong>{currentPage + 1}</strong> {t('pagination.of')} {totalPages} {t('pagination.totalPages')} · {t('pagination.totalRows')} <strong>{rowCount.toLocaleString()}</strong> rows
                </div>
                <div className="pagination-controls">
                    <button
                        className="paginationBtn"
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0 || loading}
                        title={t('pagination.prev')}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        className="paginationBtn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1 || loading}
                        title={t('pagination.next')}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
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
                                className={`type - dropdown - item ${isSelected ? 'selected' : ''} `}
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
