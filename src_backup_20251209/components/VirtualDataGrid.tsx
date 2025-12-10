import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import * as ReactWindow from 'react-window';
// @ts-ignore
const FixedSizeGrid = ReactWindow.FixedSizeGrid || (ReactWindow as any).default?.FixedSizeGrid || (ReactWindow as any).default;
import AutoSizer from 'react-virtualized-auto-sizer';
import { DuckDBEngine } from '../db/duckdbEngine';
import { ColumnMetadata } from '../types/duckdb';
import './VirtualDataGrid.css';

interface GridChildComponentProps {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data?: any;
    isScrolling?: boolean;
}

interface VirtualDataGridProps {
    tableName: string;
    rowCount: number;
    columns: ColumnMetadata[];
}

const FALLBACK_SIZE = 40;

/**
 * 务实的虚拟滚动表格
 * 完全零硬编码，所有尺寸依赖 CSS 变量
 */
export const VirtualDataGrid: React.FC<VirtualDataGridProps> = ({ tableName, rowCount, columns }) => {
    const [dataCache, setDataCache] = useState<Map<number, any>>(new Map()); // rowIndex -> rowData
    const engine = DuckDBEngine.getInstance();
    const requestedChunks = useRef<Set<number>>(new Set());

    // 尺寸配置状态，初始使用保底值
    const [gridConfig, setGridConfig] = useState({
        rowHeight: FALLBACK_SIZE,
        columnWidth: FALLBACK_SIZE,
        overscanCount: FALLBACK_SIZE,
        chunkSize: FALLBACK_SIZE
    });

    // 从 CSS 变量读取配置
    useLayoutEffect(() => {
        const style = getComputedStyle(document.documentElement);

        const getInt = (varName: string) => {
            const val = style.getPropertyValue(varName).trim();
            // 移除 px 后解析，如果无效则返回保底值
            const num = parseInt(val.replace('px', ''), 10);
            return isNaN(num) ? FALLBACK_SIZE : num;
        };

        setGridConfig({
            rowHeight: getInt('--grid-row-height'),
            columnWidth: getInt('--grid-col-width'),
            overscanCount: getInt('--grid-overscan'),
            chunkSize: getInt('--grid-chunk-size')
        });
    }, []);

    // 数据加载函数
    const loadChunk = useCallback(async (chunkIndex: number) => {
        if (requestedChunks.current.has(chunkIndex)) return;
        requestedChunks.current.add(chunkIndex);

        const offset = chunkIndex * gridConfig.chunkSize;

        try {
            const rows = await engine.queryChunk(tableName, offset, gridConfig.chunkSize);

            setDataCache(prev => {
                const newCache = new Map(prev);
                rows.forEach((row, idx) => {
                    newCache.set(offset + idx, row);
                });
                return newCache;
            });
        } catch (err) {
            console.error('Failed to load chunk', err);
            requestedChunks.current.delete(chunkIndex); // 允许重试
        }
    }, [tableName, engine, gridConfig.chunkSize]);

    // 渲染单元格
    const Cell = ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
        // 触发数据加载
        const chunkIndex = Math.floor(rowIndex / gridConfig.chunkSize);
        if (!requestedChunks.current.has(chunkIndex)) {
            // 异步加载，不阻塞渲染
            loadChunk(chunkIndex);
        }

        const rowData = dataCache.get(rowIndex);
        const colDef = columns[columnIndex];
        const cellContent = rowData ? String(rowData[colDef.name] ?? '') : '...';

        return (
            <div
                className="virtualGridCell"
                style={style}
            >
                {cellContent}
            </div>
        );
    };

    return (
        <div
            className="virtualGridContainer"
            style={{
                // @ts-ignore: Custom CSS property
                '--local-row-height': `${gridConfig.rowHeight}px`
            }}
        >
            {/* Header */}
            <div className="virtualGridHeader">
                {columns.map((col, idx) => (
                    <div
                        key={col.name + idx}
                        className="virtualGridHeaderCell"
                        style={{ width: gridConfig.columnWidth }}
                    >
                        {col.name}
                        <span className="virtualGridHeaderType">
                            ({col.type})
                        </span>
                    </div>
                ))}
            </div>

            {/* Body */}
            <div className="virtualGridBody">
                <AutoSizer>
                    {({ height, width }) => (
                        <FixedSizeGrid
                            columnCount={columns.length}
                            columnWidth={gridConfig.columnWidth}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={gridConfig.rowHeight}
                            width={width}
                            overscanRowCount={gridConfig.overscanCount}
                            className="virtualGrid"
                        >
                            {Cell}
                        </FixedSizeGrid>
                    )}
                </AutoSizer>
            </div>
        </div>
    );
};
