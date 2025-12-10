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
}

interface ColumnStats {
    name: string;
    type: string;
    total: number;
    nullCount: number;
    uniqueCount: number;
    min?: number;
    max?: number;
}

// 常量定义（符合规则4：禁止魔法数字）
const 每页行数 = 20; // 固定值：每页显示行数（修改为20行）
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
    // NULL 值处理
    if (value === null || value === undefined) {
        return '-';
    }

    // 日期类型 - 核心修复：时间戳转为可读格式
    if (type === 'DATE' || type === 'TIMESTAMP') {
        // 如果是数字（时间戳毫秒），转换为Date
        const date = typeof value === 'number' ? new Date(value) : new Date(value);

        // 检查是否为有效日期
        if (isNaN(date.getTime())) {
            return String(value);
        }

        // 格式化为 YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    // 数值类型 - 添加千分位分隔
    if (type === 'BIGINT' || type === 'INTEGER' || type === 'DOUBLE' || type === 'DECIMAL') {
        const num = Number(value);
        if (isNaN(num)) return String(value);

        // 整数使用千分位，浮点数保留2位小数
        if (type === 'DOUBLE' || type === 'DECIMAL') {
            return num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        }
        return num.toLocaleString('zh-CN');
    }

    // 布尔类型
    if (type === 'BOOLEAN') {
        return value ? '是' : '否';
    }

    // 字符串类型 - 截断过长文本
    const str = String(value);
    if (str.length > 最大文本长度) {
        return str.substring(0, 最大文本长度) + '...';
    }

    return str;
};

/**
 * 简化版数据表格（带统计信息）
 */
export const VirtualDataGrid: React.FC<VirtualDataGridProps> = ({ tableName, rowCount, columns, selectedColumns: propsSelectedColumns }) => {
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
                            key={idx}
                            className="enhancedHeaderCell"
                            style={{
                                minWidth: `${getColumnWidth(col)}px`,
                                maxWidth: `${getColumnWidth(col)}px`,
                                textAlign: isNumericType ? 'right' : 'left',
                                '--null-rate': `${nullRate}%`
                            } as React.CSSProperties}
                        >
                            <div className="headerCellTop">
                                <span className="headerCellName" title={col.name}>{col.name}</span>
                                <span className="headerCellType">{col.type}</span>
                            </div>
                            {stat && (
                                <div className="headerCellStats">
                                    <div className="statMiniBar">
                                        <div
                                            className="statMiniBarFill"
                                            style={{ width: `${nullRate}%` }}
                                            title={t('grid.nullRate', { rate: nullRate.toFixed(1) })}
                                        />
                                    </div>
                                    <span className="statMiniText">
                                        {stat.uniqueCount > 0 && t('grid.uniqueValues', { count: stat.uniqueCount })}
                                        {nullRate > 0 && ` · ${t('grid.missingPercent', { percent: nullRate.toFixed(0) })}`}
                                    </span>
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
