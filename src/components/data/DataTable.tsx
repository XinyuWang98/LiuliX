import { useI18n } from '@contexts/I18nContext';
import { ColumnStats } from '@/types/data';

interface DataTableProps {
    columns: ColumnStats[] | undefined;
    data: any[][] | undefined;
    rowCount?: number;
}

// 内联列统计组件（Kaggle风格）
function InlineColumnStats({ stats }: { stats: ColumnStats }) {
    // 渲染迷你柱状图
    const renderMiniChart = () => {
        if (stats.data_type === 'numeric' && stats.numeric_stats?.histogram) {
            const max = Math.max(...stats.numeric_stats.histogram);
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '1px',
                    height: '24px',
                    marginTop: '4px'
                }}>
                    {stats.numeric_stats.histogram.map((value, index) => (
                        <div
                            key={index}
                            style={{
                                flex: 1,
                                backgroundColor: 'var(--primary)',
                                opacity: 0.8,
                                height: `${Math.max((value / max) * 100, 3)}%`,
                                borderRadius: '1px',
                            }}
                        />
                    ))}
                </div>
            );
        } else if (stats.data_type === 'categorical' && stats.categorical_stats) {
            // 分类数据显示百分比条
            const topItem = stats.categorical_stats.top_values[0];
            if (topItem) {
                return (
                    <div style={{ marginTop: '4px' }}>
                        <div style={{
                            height: '4px',
                            background: 'var(--border)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${topItem.percentage * 100}%`,
                                height: '100%',
                                background: 'var(--primary)',
                                opacity: 0.8
                            }} />
                        </div>
                    </div>
                );
            }
        }
        return null;
    };

    const dataTypeIcons: Record<string, string> = {
        numeric: '123',
        categorical: 'Abc',
        datetime: '📅',
        text: 'Txt',
        boolean: '✓'
    };

    return (
        <div style={{
            padding: '8px 0',
            borderBottom: '1px solid var(--border)',
            marginBottom: '8px'
        }}>
            {/* 数据类型标签 */}
            <div style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                {dataTypeIcons[stats.data_type] || '📄'} {stats.data_type}
            </div>

            {/* Unique 和 Missing */}
            <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '11px',
                color: 'var(--text-secondary)'
            }}>
                <span>Unique: <strong style={{ color: 'var(--text-primary)' }}>{stats.unique_count}</strong></span>
                <span style={{ color: stats.missing_ratio > 0.1 ? 'var(--warning)' : 'inherit' }}>
                    Missing: <strong>{(stats.missing_ratio * 100).toFixed(1)}%</strong>
                </span>
            </div>

            {/* 迷你图表 */}
            {renderMiniChart()}
        </div>
    );
}

export function DataTable({ columns, data, rowCount }: DataTableProps) {
    const { t } = useI18n();

    if (!columns || !data) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px',
                color: 'var(--text-secondary)',
                fontSize: 'var(--fs-l)'
            }}>
                {t('common.noData')}
            </div>
        );
    }

    // 格式化单元格值
    const formatCellValue = (value: any, colIndex: number): string => {
        if (value === null || value === undefined) {
            return '—';
        }

        const col = columns[colIndex];
        if (col?.data_type === 'numeric') {
            if (typeof value === 'number') {
                return value.toFixed(2).replace(/\.?0+$/, '');
            }
        }

        return String(value);
    };

    return (
        <div className="data-table-container" style={{
            flex: 1,
            overflow: 'auto',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-m)',
        }}>
            <table className="data-table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--fs-sm)'
            }}>
                <thead style={{
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-main)',
                    zIndex: 1,
                }}>
                    <tr>
                        {/* 行号列 */}
                        <th style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 'var(--fw-bold)',
                            color: 'var(--text-secondary)',
                            borderRight: '1px solid var(--border)',
                            borderBottom: '2px solid var(--border)',
                            background: 'var(--bg-main)',
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            verticalAlign: 'bottom',
                            minWidth: '50px'
                        }}>
                            #
                        </th>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                style={{
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    verticalAlign: 'top',
                                    minWidth: '140px',
                                    maxWidth: '200px',
                                    borderRight: '1px solid var(--border)',
                                    borderBottom: '2px solid var(--border)',
                                    background: 'var(--bg-main)',
                                }}
                            >
                                {/* 集成的列统计信息 */}
                                <InlineColumnStats stats={col} />

                                {/* 列名 */}
                                <div style={{
                                    fontWeight: 'var(--fw-bold)',
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    paddingTop: '4px'
                                }} title={col.column_name}>
                                    {col.column_name}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            style={{
                                borderBottom: '1px solid var(--border)',
                                transition: 'background 0.15s ease'
                            }}
                            className="data-table-row"
                        >
                            {/* 行号 */}
                            <td style={{
                                padding: '10px 16px',
                                color: 'var(--text-secondary)',
                                fontWeight: 'var(--fw-medium)',
                                borderRight: '1px solid var(--border)',
                                background: 'var(--bg-panel)',
                                position: 'sticky',
                                left: 0,
                                zIndex: 1
                            }}>
                                {rowIndex + 1}
                            </td>
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    style={{
                                        padding: '10px 12px',
                                        color: cell === null || cell === undefined ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '200px',
                                        borderRight: '1px solid var(--border)',
                                    }}
                                    title={formatCellValue(cell, cellIndex)}
                                >
                                    {formatCellValue(cell, cellIndex)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 表格底部信息 */}
            {rowCount && rowCount > data.length && (
                <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--fs-sm)',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-main)'
                }}>
                    显示前 {data.length} 行，共 {rowCount.toLocaleString()} 行
                </div>
            )}

            <style>{`
                .data-table-row:hover {
                    background: rgba(255, 255, 255, 0.03);
                }
                
                .data-table thead th:hover {
                    background: rgba(255, 255, 255, 0.02);
                }
                
                /* 自定义滚动条 */
                .data-table-container::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }
                
                .data-table-container::-webkit-scrollbar-track {
                    background: var(--bg-main);
                }
                
                .data-table-container::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 5px;
                }
                
                .data-table-container::-webkit-scrollbar-thumb:hover {
                    background: var(--text-secondary);
                }
            `}</style>
        </div>
    );
}
