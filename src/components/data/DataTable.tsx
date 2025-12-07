import { useI18n } from '@contexts/I18nContext';
import { ColumnStats } from '@/types/data';

interface DataTableProps {
    columns: ColumnStats[] | undefined;
    data: any[][] | undefined;
    rowCount?: number;
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
                // 格式化数字：保留2位小数，去除不必要的零
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
            marginTop: 'var(--gap-m)'
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
                    borderBottom: '2px solid var(--border)'
                }}>
                    <tr>
                        {/* 行号列 */}
                        <th style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 'var(--fw-bold)',
                            color: 'var(--text-secondary)',
                            borderRight: '1px solid var(--border)',
                            background: 'var(--bg-main)',
                            position: 'sticky',
                            left: 0,
                            zIndex: 2
                        }}>
                            #
                        </th>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontWeight: 'var(--fw-bold)',
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease'
                                }}
                                title={col.column_name}
                            >
                                {col.column_name}
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
                                        padding: '10px 16px',
                                        color: cell === null || cell === undefined ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '200px'
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

            {/* 添加表格底部信息 */}
            {rowCount && rowCount > data.length && (
                <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--fs-sm)',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-main)'
                }}>
                    显示前 {data.length} 行，共 {rowCount} 行
                </div>
            )}

            <style>{`
                .data-table-row:hover {
                    background: rgba(255, 255, 255, 0.03);
                }
                
                .data-table thead th:hover {
                    background: rgba(255, 255, 255, 0.05);
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
