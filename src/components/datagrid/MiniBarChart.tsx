import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { formatTimestamp } from '../../utils/dateUtils';
import { ColumnStats } from '../../types/duckdb';

interface MiniBarChartProps {
    categoricalStats: NonNullable<ColumnStats['categoricalStats']>;
    type: string;
    columnName: string;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({ categoricalStats, type, columnName }) => {
    const { t } = useI18n();

    if (!categoricalStats.topValues || categoricalStats.topValues.length === 0) return null;
    const maxCount = Math.max(...categoricalStats.topValues.map(v => v.count));

    const formatTooltipValue = (val: any) => {
        const typeUpper = type.toUpperCase();
        if (typeUpper.includes('DATE') || typeUpper.includes('TIMESTAMP')) {
            return formatTimestamp(val, typeUpper.includes('TIMESTAMP'));
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
