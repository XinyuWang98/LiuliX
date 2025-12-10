import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DuckDBEngine } from '../db/duckdbEngine';
import { ColumnMetadata } from '../types/duckdb';
import { useI18n } from '../contexts/I18nContext';
import './VirtualDataGrid.css';

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

    // 日期类型 - 核心修复：时间戳转为可读格式
    if (typeUpper === 'DATE' || typeUpper === 'TIMESTAMP') {
        let dateVal = value;
        // 如果是纯数字字符串，强制转为数字处理（假定为毫秒时间戳）
        if (typeof value === 'string' && /^\d+$/.test(value)) {
            const num = Number(value);
            // 简单防卫：如果是微秒级（非常大），可能需要/1000，但这里先假设是毫秒
            dateVal = num;
        }

        const date = new Date(dateVal);
        if (isNaN(date.getTime())) return String(value);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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



    // 数值格式化工具函数
    const formatNumber = useCallback((num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        if (Number.isInteger(num)) return num.toString();
        return num.toFixed(2);
    }, []);



    const engine = DuckDBEngine.getInstance();
    const totalPages = Math.ceil(rowCount / 每页行数);

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

    // 计算自适应列宽
    const getColumnWidth = (col: ColumnMetadata) => {
        const nameLength = col.name.length;
        const estimatedWidth = Math.max(最小列宽, Math.min(最大列宽, nameLength * 列名字符宽度系数 + 列宽基础偏移));
        return estimatedWidth;
    };

    // 同步表头和数据体的水平滚动
    const syncScroll = () => {
        if (headerRef.current && tableBodyRef.current) {
            headerRef.current.scrollLeft = tableBodyRef.current.scrollLeft;
        }
    };


    // 根据选中的列过滤显示的列
    const visibleColumns = columns.filter((_, idx) => selectedColumns.includes(idx));

    // ========== 内部组件：数值统计面板 ==========
    const NumericStatsPanel: React.FC<{ stat: NonNullable<ColumnStats['numericStats']> }> = ({ stat }) => (
        <div className="numericStatsPanel">
            <div className="statRow">
                <span>MIN</span>
                <span>{formatNumber(stat.min)}</span>
            </div>
            <div className="statRow">
                <span>Q1</span>
                <span>{formatNumber(stat.q1)}</span>
            </div>
            <div className="statRow">
                <span>MEDIAN</span>
                <span>{formatNumber(stat.median)}</span>
            </div>
            <div className="statRow">
                <span>Q3</span>
                <span>{formatNumber(stat.q3)}</span>
            </div>
            <div className="statRow">
                <span>MAX</span>
                <span>{formatNumber(stat.max)}</span>
            </div>
            <div className="statRow">
                <span>STD DEV</span>
                <span>{formatNumber(stat.stddev)}</span>
            </div>
            <div className="statRow">
                <span>SKEWNESS</span>
                <span>{formatNumber(stat.skewness)}</span>
            </div>
        </div>
    );

    // ========== 内部组件：分类统计面板 ==========
    const CategoricalStatsPanel: React.FC<{ stat: NonNullable<ColumnStats['categoricalStats']>, type: string }> = ({ stat, type }) => (
        <div className="categoricalStatsPanel">
            <div className="statHeader">TOP 5 VALUES</div>
            {stat.topValues.map((item, idx) => (
                <div key={idx} className="statRow">
                    <span className="valueText" title={String(item.value)}>
                        {/* 使用全局格式化函数处理值 */}
                        {formatCellValue(item.value, type)}
                    </span>
                    <span className="valueCount">{item.count}</span>
                </div>
            ))}
        </div>
    );

    // ========== 内部组件：微型直方图 ==========
    const MiniHistogram: React.FC<{ distribution: NonNullable<ColumnStats['distribution']> & { labels?: (string | number)[] } }> = ({ distribution }) => {
        const { counts, min, max } = distribution;
        const maxCount = Math.max(...counts);
        if (maxCount === 0) return null;

        // 计算分箱宽度
        const hasRange = typeof min === 'number' && typeof max === 'number';
        const binWidth = hasRange ? (max - min) / counts.length : 0;
        const labels = distribution.labels; // 获取离散标签

        return (
            <div className="headerMiniHistogram">
                {counts.map((count, idx) => {
                    let tooltipText = `${t('grid.count')}: ${count}`;

                    if (labels && labels[idx] !== undefined) {
                        // 离散模式：直接显示具体值
                        tooltipText = `${t('grid.value')}: ${labels[idx]}\n${tooltipText}`;
                    } else if (hasRange) {
                        // 连续模式：显示区间
                        const start = min + idx * binWidth;
                        const end = min + (idx + 1) * binWidth;
                        // 简单的格式化
                        const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
                        tooltipText = `${t('grid.value')}: ${fmt(start)} - ${fmt(end)}\n${tooltipText}`;
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
    const MiniBarChart: React.FC<{ categoricalStats: NonNullable<ColumnStats['categoricalStats']> }> = ({ categoricalStats }) => {
        if (!categoricalStats.topValues || categoricalStats.topValues.length === 0) return null;
        const maxCount = Math.max(...categoricalStats.topValues.map(v => v.count));

        return (
            <div className="headerMiniBarChart">
                {categoricalStats.topValues.map((item, idx) => (
                    <div key={idx} className="miniBarItem" title={`${t('grid.value')}: ${item.value}\n${t('grid.count')}: ${item.count}`}>
                        <div
                            className="miniBar"
                            style={{
                                height: `${(item.count / maxCount) * 100}%`,
                                width: '100%' // 确保宽度充满
                            }}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="virtualGridContainer">
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

                            {/* 微型可视化：数值列显示直方图，字符串列显示条形图 */}
                            {stat?.distribution ? (
                                <MiniHistogram distribution={stat.distribution} />
                            ) : stat?.categoricalStats ? (
                                <MiniBarChart categoricalStats={stat.categoricalStats} />
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
                                        <CategoricalStatsPanel stat={stat.categoricalStats} type={col.type} />
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
