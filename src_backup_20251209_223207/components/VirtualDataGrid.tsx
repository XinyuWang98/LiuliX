import React, { useState, useEffect, useCallback } from 'react';
import { DuckDBEngine } from '../db/duckdbEngine';
import { ColumnMetadata } from '../types/duckdb';
import './VirtualDataGrid.css';

interface VirtualDataGridProps {
    tableName: string;
    rowCount: number;
    columns: ColumnMetadata[];
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

const 每页行数 = 50; // 固定值：每页显示行数
const 最小列宽 = 120; // 最小列宽
const 最大列宽 = 300; // 最大列宽

/**
 * 简化版数据表格（带统计信息）
 */
export const VirtualDataGrid: React.FC<VirtualDataGridProps> = ({ tableName, rowCount, columns }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<ColumnStats[]>([]);

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
                console.error('加载统计失败:', err);
            }
        };
        loadStats();
        return () => { active = false; };
    }, [tableName, engine]);

    // 加载分页数据
    const loadPage = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const offset = page * 每页行数;
            const rows = await engine.queryChunk(tableName, offset, 每页行数);
            setData(rows);
        } catch (err) {
            console.error('加载数据失败:', err);
        } finally {
            setLoading(false);
        }
    }, [tableName, engine]);

    useEffect(() => {
        loadPage(currentPage);
    }, [currentPage, loadPage]);

    // 计算自适应列宽
    const getColumnWidth = (col: ColumnMetadata) => {
        const nameLength = col.name.length;
        const estimatedWidth = Math.max(最小列宽, Math.min(最大列宽, nameLength * 10 + 60));
        return `${estimatedWidth}px`;
    };

    return (
        <div className="virtualGridContainer">
            {/* 增强表头（带统计） */}
            <div className="enhancedGridHeader">
                {columns.map((col, idx) => {
                    const stat = stats.find(s => s.name === col.name);
                    const nullRate = stat ? (stat.nullCount / stat.total) * 100 : 0;

                    return (
                        <div
                            key={idx}
                            className="enhancedHeaderCell"
                            style={{ minWidth: getColumnWidth(col), maxWidth: getColumnWidth(col) }}
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
                                            title={`缺失率: ${nullRate.toFixed(1)}%`}
                                        />
                                    </div>
                                    <span className="statMiniText">
                                        {stat.uniqueCount > 0 && `${stat.uniqueCount} 唯一值`}
                                        {nullRate > 0 && ` · ${nullRate.toFixed(0)}% 缺失`}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 表体 */}
            <div className="simpleTableBody">
                {loading ? (
                    <div className="loadingPlaceholder">
                        <div className="loadingSpinner" />
                        <span>加载中...</span>
                    </div>
                ) : (
                    data.map((row, rowIdx) => (
                        <div key={rowIdx} className="simpleTableRow">
                            {columns.map((col, colIdx) => (
                                <div
                                    key={colIdx}
                                    className="enhancedGridCell"
                                    style={{ minWidth: getColumnWidth(col), maxWidth: getColumnWidth(col) }}
                                    title={String(row[col.name] ?? '')}
                                >
                                    {String(row[col.name] ?? '-')}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* 分页器 */}
            <div className="simplePagination">
                <button
                    className="paginationBtn"
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0 || loading}
                >
                    ← 上一页
                </button>
                <span className="paginationInfo">
                    第 <strong>{currentPage + 1}</strong> / {totalPages} 页 · 共 <strong>{rowCount.toLocaleString()}</strong> 行
                </span>
                <button
                    className="paginationBtn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1 || loading}
                >
                    下一页 →
                </button>
            </div>
        </div>
    );
};
