import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DuckDBEngine } from '../db/duckdbEngine';
import type { ColumnStats, ColumnMetadata } from '../types/duckdb';
import { useI18n } from '../contexts/I18nContext';
import { formatTimestamp } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useErrorToast } from '../hooks/useErrorToast';
import { NumericStatsPanel } from './datagrid/NumericStatsPanel';
import { CategoricalStatsPanel } from './datagrid/CategoricalStatsPanel';
import { MiniHistogram } from './datagrid/MiniHistogram';
import { MiniBarChart } from './datagrid/MiniBarChart';
import { SingleValueIndicator } from './datagrid/SingleValueIndicator';
import { BoxPlotMini } from './datagrid/BoxPlotMini';
import './VirtualDataGrid.css';

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
 * 简化版数据表格（带统计信息）- V2 Updated
 */
export const VirtualDataGridV2: React.FC<VirtualDataGridProps> = ({ tableName, rowCount, columns, selectedColumns: propsSelectedColumns, showStats = false }) => {
    const { t } = useI18n();
    const { showError } = useErrorToast();

    // Refs - 必须在顶层定义
    const containerRef = useRef<HTMLDivElement>(null);

    // 状态
    const [currentPage, setCurrentPage] = useState(0);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<ColumnStats[]>([]);
    const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colName: string } | null>(null);

    // 交互状态
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

    // 计算列宽逻辑 - 优化 bonusWidth 分配策略 (窄列分配 + 上限控制)
    useEffect(() => {
        if (containerWidth === 0 || visibleColumns.length === 0) return;

        const NARROW_COLUMN_THRESHOLD = 180; // 只有基础宽度小于此值的列才分配 bonusWidth
        let totalBaseWidth = INDEX_COLUMN_WIDTH;

        const baseWidths = visibleColumns.map(col => {
            const nameLength = col.name.length;
            return Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, nameLength * CHAR_WIDTH_COEFFICIENT + COLUMN_WIDTH_BASE_OFFSET));
        });

        totalBaseWidth += baseWidths.reduce((a, b) => a + b, 0);
        const availableSpace = containerWidth - 20;

        if (totalBaseWidth < availableSpace) {
            const extra = availableSpace - totalBaseWidth;
            // 只给窄列分配 bonusWidth
            const narrowColumnCount = baseWidths.filter(w => w < NARROW_COLUMN_THRESHOLD).length;
            if (narrowColumnCount > 0) {
                // 每列最多增加 200px
                const maxBonus = 200;
                const calculatedBonus = Math.floor(extra / narrowColumnCount);
                setBonusWidth(Math.min(calculatedBonus, maxBonus));
            } else {
                setBonusWidth(0);
            }
        } else {
            setBonusWidth(0);
        }
    }, [containerWidth, visibleColumns]);

    const getColumnWidth = useCallback((col: ColumnMetadata) => {
        const nameLength = col.name.length;
        const typeUpper = col.type.toUpperCase();

        // 方案C：特殊列类型的宽度优化

        // ✅ 优先级最高：如果显示统计信息，需要为统计面板预留足够空间
        if (showStats) {
            const stat = stats.find(s => s.name === col.name);
            const isNumericType = typeUpper.includes('INT') || typeUpper.includes('DOUBLE') ||
                typeUpper.includes('FLOAT') || typeUpper.includes('DECIMAL') ||
                typeUpper.includes('NUMBER');

            // 数值类型：需要显示SUMMARY面板（MIN/MAX/MEAN/SKEWNESS等）
            // 分类类型：需要显示TOP 10 VALUES
            if ((isNumericType && stat?.numericStats) || (!isNumericType && stat?.categoricalStats)) {
                // 统计面板最小宽度：标签(80px) + 数值(70px) + padding(30px) = 180px
                // 加上列头本身的宽度，设置最小200px
                return Math.max(200, nameLength * CHAR_WIDTH_COEFFICIENT + 100);
            }
        }

        // 1. 时间戳列：需要更宽空间显示完整时间
        if (typeUpper.includes('TIMESTAMP') || typeUpper.includes('DATE') ||
            col.name.toLowerCase().includes('date') || col.name.toLowerCase().includes('time')) {
            return Math.max(240, nameLength * CHAR_WIDTH_COEFFICIENT + 80);
        }

        // 2. 分类列（unique count < 50）：需要显示TOP 10 values
        const stat = stats.find(s => s.name === col.name);
        if (stat && stat.uniqueCount < 50 && stat.uniqueCount > 1) {
            return Math.max(220, nameLength * CHAR_WIDTH_COEFFICIENT + 100);
        }

        // 3. 默认宽度计算（基于列名长度）
        const baseWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, nameLength * CHAR_WIDTH_COEFFICIENT + COLUMN_WIDTH_BASE_OFFSET));

        const NARROW_COLUMN_THRESHOLD = 180;
        // 只有窄列才分配 bonusWidth
        if (baseWidth < NARROW_COLUMN_THRESHOLD) {
            return baseWidth + bonusWidth;
        }
        return baseWidth;
    }, [bonusWidth, stats, showStats]);

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
        }
    };

    // 方案B：使用 CSS sticky，浏览器原生处理滚动同步
    // 无需 JavaScript 同步逻辑

    return (
        <div className="virtualGridContainer" ref={containerRef}>
            {/* 统一滚动容器（方案B：CSS sticky） */}
            <div className="unified-scroll-wrapper">
                {/* 列头区 - 使用 sticky 固定 */}
                <div className="enhancedGridHeader">
                    <div
                        className="enhancedHeaderCell enhancedHeaderCell-index"
                        style={{ minWidth: `${INDEX_COLUMN_WIDTH}px`, maxWidth: `${INDEX_COLUMN_WIDTH}px`, width: `${INDEX_COLUMN_WIDTH}px` }}
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
                                        {/* Type Icon + Name (对齐 Design 页面) - 图标已移除 */}
                                        <div className="column-type">
                                            <span style={{ textTransform: 'uppercase', opacity: 0.7, fontSize: '11px' }}>
                                                {(stat?.type || col.type).toLowerCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 2. Metadata Row: Unique Count + Missing Rate (整合到一行) */}
                                    <div className="missing-rate-container" title={`${t('grid.missingPercent', { percent: nullRate.toFixed(1) })} (${stat?.nullCount} rows)`}>
                                        {/* 唯一值计数 - 左侧 */}
                                        {stat && stat.uniqueCount > 0 && (
                                            <span className="unique-count-inline">
                                                {t('grid.uniqueValues', { count: stat.uniqueCount })}
                                            </span>
                                        )}
                                        {/* 缺失率 - 右侧，根据比例显示不同颜色 */}
                                        <span className={`missing-rate-text ${nullRate === 0 ? '' :
                                            nullRate >= 50 ? 'high-missing' :
                                                'medium-missing'
                                            }`}>
                                            {t('grid.missingRate')} {nullRate.toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* 3. Mini Charts */}
                                    {stat?.uniqueCount === 1 ? (
                                        <div style={{ marginTop: '4px', height: '52px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <SingleValueIndicator value={stat.categoricalStats?.topValues?.[0]?.value ?? stat.numericStats?.min ?? 'N/A'} type={col.type} />
                                        </div>
                                    ) : stat?.distribution ? (
                                        <div style={{ marginTop: '4px', height: '52px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <MiniHistogram distribution={stat.distribution} type={col.type} columnName={col.name} />
                                            {stat.numericStats && (
                                                <BoxPlotMini
                                                    min={stat.numericStats.min}
                                                    q1={stat.numericStats.q1}
                                                    median={stat.numericStats.median}
                                                    q3={stat.numericStats.q3}
                                                    max={stat.numericStats.max}
                                                />
                                            )}
                                        </div>
                                    ) : stat?.categoricalStats ? (
                                        <div style={{ marginTop: '4px', height: '52px' }}>
                                            <MiniBarChart categoricalStats={stat.categoricalStats} type={col.type} columnName={col.name} />
                                        </div>
                                    ) : null}

                                    {/* 4. Detailed Stats Panel (Expandable) - 移到 Unique Count 之前 */}
                                    {showStats && stat && (
                                        isNumericType && stat.numericStats ? (
                                            <NumericStatsPanel stat={stat.numericStats} />
                                        ) : !isNumericType && stat.categoricalStats ? (
                                            <CategoricalStatsPanel stat={stat.categoricalStats} type={col.type} columnName={col.name} total={stat.total} />
                                        ) : null
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 表体数据行 */}
                <div className="table-rows-container">
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
                                        className={`enhancedGridCell enhancedGridCell-index ${isSelectedRow ? 'highlightRow' : ''} `}
                                        style={{ minWidth: `${INDEX_COLUMN_WIDTH}px`, maxWidth: `${INDEX_COLUMN_WIDTH}px`, width: `${INDEX_COLUMN_WIDTH}px` }}
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
            </div>

            {/* 分页器 - Design Style */}
            <div className="simplePagination">
                {/* 左翻页按钮 */}
                <button
                    className="paginationBtn"
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0 || loading}
                    title={t('pagination.prev')}
                >
                    <ChevronLeft size={16} />
                </button>

                {/* 页码信息 */}
                <div className="paginationInfo">
                    {t('pagination.page')} <strong>{currentPage + 1}</strong> {t('pagination.of')} {totalPages} {t('pagination.totalPages')}
                </div>

                {/* 右翻页按钮 */}
                <button
                    className="paginationBtn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1 || loading}
                    title={t('pagination.next')}
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Portal Dropdown Menu */}
            {
                activeTypeMenu && dropdownPos && createPortal(
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
                )
            }
        </div >
    );
};
