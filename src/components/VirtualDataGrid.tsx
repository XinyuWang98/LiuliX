import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DuckDBEngine } from '../db/duckdbEngine';
import { ColumnMetadata } from '../types/duckdb';
import { useI18n } from '../contexts/I18nContext';
import { formatTimestamp } from '../utils/dateUtils';
import './VirtualDataGrid.css';
import { NumericStatsPanel } from './datagrid/NumericStatsPanel';
import { CategoricalStatsPanel } from './datagrid/CategoricalStatsPanel';

interface VirtualDataGridProps {
    tableName: string;
    rowCount: number;
    columns: ColumnMetadata[];
    selectedColumns?: number[]; // 可选：选中的列索引数组
    showStats?: boolean;
}

interface ColumnStats {
    name: string;
    type: string;
    total: number;
    nullCount: number;
    uniqueCount: number;
    numericStats?: {
        min: number;
        q1: number;
        median: number;
        q3: number;
        max: number;
        stddev: number;
        skewness: number;
    };
    categoricalStats?: {
        topValues: Array<{ value: string; count: number }>;
    };
    distribution?: {
        bins: number;
        counts: number[];
        min: number;
        max: number;
    };
    error?: boolean;
}

// 常량定义（符合规则4：禁止魔法数字）
const 每页行数 = 10; // 固定值：每页显示行数（从20行减少到10行，使表头更显眼）
const 最小列宽 = 120; // 最小列宽（px）
const 最大列宽 = 300; // 最大列宽（px）
const 列名字符宽度系数 = 10; // 每个字符占用的像素宽度
const 列宽基础偏移 = 60; // 列宽计算的基础偏移量
const 序号列宽度 = 60; // 序号列固定宽度（px）
const 最大文本长度 = 100; // 单元格文本最大长度

/**
 * 格式化单元格值（类型感知）
 */
const formatCellValue = (value: any, type: string): string => {
    const typeUpper = type.toUpperCase();

    // NULL 值处理
    if (value === null || value === undefined) {
        return '-';
    }

    // 日期类型 - 核心修复：统一使用 dateUtils.formatTimestamp
    if (typeUpper === 'DATE' || typeUpper === 'TIMESTAMP') {
        return formatTimestamp(value, typeUpper === 'TIMESTAMP');
    }

    // 数值类型 - 添加千分位分隔
    if (typeUpper.includes('INT') || typeUpper.includes('DOUBLE') || typeUpper.includes('DECIMAL') || typeUpper.includes('FLOAT') || typeUpper.includes('NUMBER')) {
        const num = Number(value);
        if (isNaN(num)) return String(value);
        if (typeUpper.includes('DOUBLE') || typeUpper.includes('DECIMAL') || typeUpper.includes('FLOAT')) {
            return num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        }
        return num.toLocaleString('zh-CN');
    }

    // 布尔类型
    if (typeUpper === 'BOOLEAN' || typeUpper === 'BOOL') return value ? '是' : '否';

    const str = String(value);
    if (str.length > 最大文本长度) return str.substring(0, 最大文本长度) + '...';
    return str;
};

/**
 * 简化版数据表格（带统计信息）
 */
export const VirtualDataGrid: React.FC<VirtualDataGridProps> = ({ tableName, rowCount, columns, selectedColumns: propsSelectedColumns, showStats = false }) => {
    const { t } = useI18n();
    const [currentPage, setCurrentPage] = useState(0);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<ColumnStats[]>([]);
    const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colName: string } | null>(null);


    // // 列筛选状态
    // const [selectedColumns, setSelectedColumns] = useState<number[]>(() => {
    //     // 默认选中前10列
    //     return Array.from({ length: Math.min(默认显示列数, columns.length) }, (_, i) => i);
    // });
    // const [showColumnSelector, setShowColumnSelector] = useState(false);
    const selectedColumns = propsSelectedColumns || Array.from({ length: columns.length }, (_, i) => i);

    // 表头和表体ref用于同步滚动
    const headerRef = useRef<HTMLDivElement>(null);
    const tableBodyRef = useRef<HTMLDivElement>(null);







    const engine = DuckDBEngine.getInstance();
    // 🛠️ 防止 BigInt 混合运算：DuckDB 返回的 rowCount 可能是 BigInt
    const rowCountNum = typeof rowCount === 'bigint' ? Number(rowCount) : rowCount;
    const totalPages = Math.ceil(rowCountNum / 每页行数);

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

    // 加载分页数据
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

    // 根据选中的列过滤显示的列 (Move up to fix reference error)
    const visibleColumns = columns.filter((_, idx) => selectedColumns.includes(idx));

    // 自适应列宽逻辑
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [bonusWidth, setBonusWidth] = useState(0);

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

    // 计算基础列宽总和并分配剩余空间
    useEffect(() => {
        if (containerWidth === 0 || visibleColumns.length === 0) return;

        // 计算所有可见列的基础宽度总和
        let totalBaseWidth = 序号列宽度; // 加上序号列
        const baseWidths = visibleColumns.map(col => {
            const nameLength = col.name.length;
            // 基础宽度计算逻辑复用
            return Math.max(最小列宽, Math.min(最大列宽, nameLength * 列名字符宽度系数 + 列宽基础偏移));
        });

        totalBaseWidth += baseWidths.reduce((a, b) => a + b, 0);

        // 如果总基础宽度小于容器宽度，计算需要分配的额外宽度
        // 预留少量 padding (e.g. 20px) 避免滚动条闪烁
        const availableSpace = containerWidth - 20;

        if (totalBaseWidth < availableSpace) {
            const extra = availableSpace - totalBaseWidth;
            // 平均分配给每个数据列 (不分给序号列)
            setBonusWidth(Math.floor(extra / visibleColumns.length));
        } else {
            setBonusWidth(0);
        }
    }, [containerWidth, visibleColumns]); // 依赖项：容器宽度或可见列变化

    // 计算自适应列宽 (基础 + Bonus)
    const getColumnWidth = useCallback((col: ColumnMetadata) => {
        const nameLength = col.name.length;
        const baseWidth = Math.max(最小列宽, Math.min(最大列宽, nameLength * 列名字符宽度系数 + 列宽基础偏移));
        return baseWidth + bonusWidth;
    }, [bonusWidth]);

    // 同步表头和数据体的水平滚动
    const syncScroll = () => {
        if (headerRef.current && tableBodyRef.current) {
            headerRef.current.scrollLeft = tableBodyRef.current.scrollLeft;
        }
    };




    // 引入外部组件 (Removed internal definitions)

    // ========== 内部组件：微型直方图 (保持内部，因为依赖 t 和复杂的 tooltip 逻辑较难拆分，且行数占比不大) ==========
    const MiniHistogram: React.FC<{ distribution: NonNullable<ColumnStats['distribution']> & { labels?: (string | number)[] }, type: string, columnName: string }> = ({ distribution, type, columnName }) => {
        const { counts, min, max } = distribution;
        // ... (保持原逻辑不变)
        const maxCount = Math.max(...counts);
        if (maxCount === 0) return null;

        // 计算分箱宽度
        const hasRange = typeof min === 'number' && typeof max === 'number';
        const binWidth = hasRange ? (max - min) / counts.length : 0;
        const labels = distribution.labels; // 获取离散标签

        const formatTooltipValue = (val: any) => {
            const typeUpper = type.toUpperCase();
            if (typeUpper === 'DATE' || typeUpper === 'TIMESTAMP') {
                return formatTimestamp(val, typeUpper === 'TIMESTAMP');
            } else if ((typeof val === 'number' || !isNaN(Number(val))) && (columnName.toLowerCase().includes('time') || columnName.toLowerCase().includes('date'))) {
                return formatTimestamp(val);
            }
            return String(val);
        };

        return (
            <div className="headerMiniHistogram">
                {counts.map((count, idx) => {
                    let tooltipText = `${t('grid.count')}: ${count}`;

                    if (labels && labels[idx] !== undefined) {
                        // 离散模式：直接显示具体值
                        const displayVal = formatTooltipValue(labels[idx]);
                        tooltipText = `${t('grid.value')}: ${displayVal}\n${tooltipText}`;
                    } else if (hasRange) {
                        // 连续模式：显示区间
                        const start = min + idx * binWidth;
                        const end = min + (idx + 1) * binWidth;

                        // 如果认为是时间，尝试格式化
                        let startStr = String(start);
                        let endStr = String(end);

                        const typeUpper = type.toUpperCase();
                        if (typeUpper === 'DATE' || typeUpper === 'TIMESTAMP' || (columnName.toLowerCase().includes('time') || columnName.toLowerCase().includes('date'))) {
                            startStr = formatTimestamp(start, typeUpper === 'TIMESTAMP');
                            endStr = formatTimestamp(end, typeUpper === 'TIMESTAMP');
                        } else {
                            const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
                            startStr = fmt(start);
                            endStr = fmt(end);
                        }
                        tooltipText = `${t('grid.value')}: ${startStr} - ${endStr}\n${tooltipText}`;
                    }

                    return (
                        <div
                            key={idx}
                            className="histogramBar"
                            style={{
                                height: `${(count / maxCount) * 100}%`
                            }}
                            title={tooltipText}
                        />
                    );
                })}
            </div>
        );
    };

    // ========== 内部组件：分类字段微型条形图 ==========
    const MiniBarChart: React.FC<{ categoricalStats: NonNullable<ColumnStats['categoricalStats']>, type: string, columnName: string }> = ({ categoricalStats, type, columnName }) => {
        if (!categoricalStats.topValues || categoricalStats.topValues.length === 0) return null;
        const maxCount = Math.max(...categoricalStats.topValues.map(v => v.count));

        const formatTooltipValue = (val: any) => {
            const typeUpper = type.toUpperCase();
            if (typeUpper === 'DATE' || typeUpper === 'TIMESTAMP') {
                return formatTimestamp(val, typeUpper === 'TIMESTAMP');
            } else if ((typeof val === 'number' || !isNaN(Number(val))) && (columnName.toLowerCase().includes('time') || columnName.toLowerCase().includes('date'))) {
                return formatTimestamp(val);
            }
            return String(val);
        };

        return (
            <div className="headerMiniBarChart">
                {categoricalStats.topValues.map((item, idx) => {
                    const displayValue = formatTooltipValue(item.value);
                    return (
                        <div key={idx} className="miniBarItem" title={`${t('grid.value')}: ${displayValue}\n${t('grid.count')}: ${item.count}`}>
                            <div
                                className="miniBar"
                                style={{
                                    height: `${(item.count / maxCount) * 100}%`,
                                    width: '100%' // 确保宽度充满
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    // ========== 内部组件：单一值指示器（唯一值=1的兜底展示） ==========
    const SingleValueIndicator: React.FC<{ value: any, type: string }> = ({ value, type }) => {
        // 格式化显示值
        let displayValue = formatCellValue(value, type);

        return (
            <div className="headerMiniHistogram single-value-indicator">
                <div className="single-value-badge" title={`常量列：所有值均为 ${displayValue}`}>
                    <span className="single-value-label">唯一值：</span>
                    <span className="single-value-text">{displayValue}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="virtualGridContainer" ref={containerRef}>
            {/* 增强表头（带统计） */}
            <div className="enhancedGridHeader" ref={headerRef} style={{ overflowX: 'hidden' }}>
                {/* 序号列表头 */}
                <div
                    className="enhancedHeaderCell enhancedHeaderCell序号列"
                    style={{
                        minWidth: `${序号列宽度}px`,
                        maxWidth: `${序号列宽度}px`,
                    }}
                >
                    <div className="headerCellTop">
                        <span className="headerCellName">#</span>
                    </div>
                </div>

                {/* 原有数据列 */}
                {visibleColumns.map((col, idx) => {
                    const stat = stats.find(s => s.name === col.name);
                    const nullRate = stat ? (stat.nullCount / stat.total) * 100 : 0;

                    // 判断列类型是否为数值类型
                    const typeUpper = col.type.toUpperCase();
                    const isNumericType = typeUpper.includes('INT') ||
                        typeUpper.includes('DOUBLE') ||
                        typeUpper.includes('FLOAT') ||
                        typeUpper.includes('DECIMAL') ||
                        typeUpper.includes('NUMERIC') ||
                        typeUpper.includes('NUMBER');

                    return (
                        <div
                            key={idx}
                            className="enhancedHeaderCell"
                            style={{
                                minWidth: `${getColumnWidth(col)}px`,
                                maxWidth: `${getColumnWidth(col)}px`,
                                textAlign: isNumericType ? 'right' : 'left',
                                '--null-rate': `${nullRate}%`,
                                position: 'relative',
                            } as React.CSSProperties}
                        >
                            <div className="headerCellTop">
                                <span className="headerCellName" title={col.name}>{col.name}</span>
                                <span className="headerCellType">{col.type}</span>
                            </div>

                            {/* 缺失值比例条 */}
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

                            {/* 微型可视化：优先级判断 */}
                            {stat?.uniqueCount === 1 ? (
                                // 唯一值=1：显示兜底指示器
                                <SingleValueIndicator
                                    value={stat.categoricalStats?.topValues?.[0]?.value ?? stat.numericStats?.min ?? 'N/A'}
                                    type={col.type}
                                />
                            ) : stat?.distribution ? (
                                // 数值列：显示直方图
                                <MiniHistogram distribution={stat.distribution} type={col.type} columnName={col.name} />
                            ) : stat?.categoricalStats ? (
                                // 分类列：显示条形图
                                <MiniBarChart categoricalStats={stat.categoricalStats} type={col.type} columnName={col.name} />
                            ) : null}

                            {/* 基础统计信息（始终可见） */}
                            {stat && (
                                <div className="headerCellStats">
                                    <span className="statMiniText">
                                        {stat.uniqueCount > 0 && t('grid.uniqueValues', { count: stat.uniqueCount })}
                                    </span>
                                </div>
                            )}

                            {/* 详细统计面板（根据全局开关显示） */}
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
                                {/* 序号单元格 - 根据当前页自动计算 */}
                                <div
                                    className={`enhancedGridCell enhancedGridCell序号 ${isSelectedRow ? 'highlightRow' : ''
                                        }`}
                                    style={{
                                        minWidth: `${序号列宽度}px`,
                                        maxWidth: `${序号列宽度}px`,
                                    }}
                                    onClick={() => setSelectedCell({ rowIdx, colName: '' })}
                                >
                                    {currentPage * 每页行数 + rowIdx + 1}
                                </div>

                                {/* 数据单元格 */}
                                {visibleColumns.map((col, colIdx) => {
                                    const isSelectedCol = selectedCell?.colName === col.name;
                                    const isSelectedCell = isSelectedRow && isSelectedCol;

                                    // 判断列类型是否为数值类型 - 使用includes支持类型变体
                                    const typeUpper = col.type.toUpperCase();
                                    const isNumericType = typeUpper.includes('INT') ||
                                        typeUpper.includes('DOUBLE') ||
                                        typeUpper.includes('FLOAT') ||
                                        typeUpper.includes('DECIMAL') ||
                                        typeUpper.includes('NUMERIC') ||
                                        typeUpper.includes('NUMBER');

                                    return (
                                        <div
                                            key={colIdx}
                                            className={`enhancedGridCell ${isSelectedRow ? 'highlightRow' : ''
                                                } ${isSelectedCol ? 'highlightCol' : ''
                                                } ${isSelectedCell ? 'highlightCell' : ''
                                                }`}
                                            onClick={() => setSelectedCell({ rowIdx, colName: col.name })}
                                            style={{
                                                minWidth: `${getColumnWidth(col)}px`,
                                                maxWidth: `${getColumnWidth(col)}px`,
                                                justifyContent: isNumericType ? 'flex-end' : 'flex-start',
                                            }}
                                            title={String(row[col.name] ?? '')}
                                        >
                                            {formatCellValue(row[col.name], col.type)}
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
        </div>
    );
};
