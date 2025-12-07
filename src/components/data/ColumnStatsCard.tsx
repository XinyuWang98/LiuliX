import { ColumnStats } from '@/types/data';
import { useI18n } from '@contexts/I18nContext';

interface ColumnStatsCardProps {
    stats: ColumnStats;
}

export function ColumnStatsCard({ stats }: ColumnStatsCardProps) {
    const { t } = useI18n();

    // 渲染数据类型图标
    const renderTypeIcon = () => {
        const icons = {
            numeric: '🔢',
            categorical: '📊',
            datetime: '📅',
            text: '📝',
            boolean: '✓'
        };
        return icons[stats.data_type] || '📄';
    };

    // 渲染迷你柱状图（使用 div 实现）
    const renderMiniChart = () => {
        if (stats.data_type === 'numeric' && stats.numeric_stats?.histogram) {
            const max = Math.max(...stats.numeric_stats.histogram);
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '1px',
                    height: '32px',
                    marginTop: '8px'
                }}>
                    {stats.numeric_stats.histogram.map((value, index) => (
                        <div
                            key={index}
                            style={{
                                flex: 1,
                                backgroundColor: 'var(--primary)',
                                opacity: 0.7,
                                height: `${Math.max((value / max) * 100, 2)}%`,
                                borderRadius: '2px',
                                transition: 'height 0.2s ease',
                            }}
                        />
                    ))}
                </div>
            );
        } else if (stats.data_type === 'categorical' && stats.categorical_stats) {
            return (
                <div style={{ marginTop: '8px', fontSize: '11px' }}>
                    {stats.categorical_stats.top_values.slice(0, 3).map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '2px 0',
                            color: 'var(--text-secondary)'
                        }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.value}
                            </span>
                            <span>{(item.percentage * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="column-stats-card" style={{
            minWidth: '180px',
            maxWidth: '220px',
            padding: 'var(--gap-m)',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-m)',
            flexShrink: 0,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer',
        }}>
            {/* 列名和类型 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
            }}>
                <span style={{ fontSize: '18px' }}>{renderTypeIcon()}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontWeight: 'var(--fw-bold)',
                        fontSize: 'var(--fs-m)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {stats.column_name}
                    </div>
                    <div style={{
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--text-secondary)',
                        textTransform: 'capitalize'
                    }}>
                        {stats.data_type}
                    </div>
                </div>
            </div>

            {/* 统计信息 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: 'var(--fs-xs)',
                marginBottom: '8px'
            }}>
                <div>
                    <div style={{ color: 'var(--text-secondary)' }}>Unique</div>
                    <div style={{ fontWeight: 'var(--fw-bold)' }}>{stats.unique_count}</div>
                </div>
                <div>
                    <div style={{ color: 'var(--text-secondary)' }}>Missing</div>
                    <div style={{ fontWeight: 'var(--fw-bold)', color: stats.missing_ratio > 0.1 ? 'var(--warning)' : 'inherit' }}>
                        {(stats.missing_ratio * 100).toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* 数值统计 */}
            {stats.data_type === 'numeric' && stats.numeric_stats && (
                <div style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                }}>
                    <div>Min: {stats.numeric_stats.min.toFixed(2)}</div>
                    <div>Max: {stats.numeric_stats.max.toFixed(2)}</div>
                    <div>Mean: {stats.numeric_stats.mean.toFixed(2)}</div>
                </div>
            )}

            {/* 迷你图表 */}
            {renderMiniChart()}
        </div>
    );
}
