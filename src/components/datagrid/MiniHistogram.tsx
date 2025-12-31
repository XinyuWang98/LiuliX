import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { formatTimestamp } from '../../utils/dateUtils';
import { ColumnStats } from '../../types/duckdb';

interface MiniHistogramProps {
    distribution: NonNullable<ColumnStats['distribution']>;
    type: string;
    columnName: string;
}

export const MiniHistogram: React.FC<MiniHistogramProps> = ({ distribution, type, columnName }) => {
    const { t } = useI18n();
    const { counts, min, max } = distribution;

    // Safety check
    if (!counts || counts.length === 0) return null;

    const maxCount = Math.max(...counts);
    if (maxCount === 0) return null;

    // 计算分箱宽度
    const hasRange = typeof min === 'number' && typeof max === 'number';
    const binWidth = hasRange ? (max - min) / counts.length : 0;
    const labels = distribution.labels; // 获取离散标签

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
        <div className="mini-chart-inline">
            {counts.map((count, idx) => {
                let tooltipText = `${t('grid.count')}: ${count}`;

                if (labels && labels[idx] !== undefined) {
                    // 离散模式：直接显示具体�?
                    const displayVal = formatTooltipValue(labels[idx]);
                    tooltipText = `${t('grid.value')}: ${displayVal}\n${tooltipText}`;
                } else if (hasRange) {
                    // 连续模式：显示区�?
                    const start = min + idx * binWidth;
                    const end = min + (idx + 1) * binWidth;

                    // 如果认为是时间，尝试格式�?
                    let startStr = String(start);
                    let endStr = String(end);

                    const typeUpper = type.toUpperCase();
                    if (typeUpper.includes('DATE') || typeUpper.includes('TIMESTAMP') || (columnName.toLowerCase().includes('time') || columnName.toLowerCase().includes('date'))) {
                        startStr = formatTimestamp(start, typeUpper.includes('TIMESTAMP'));
                        endStr = formatTimestamp(end, typeUpper.includes('TIMESTAMP'));
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
                        className="bar-inline"
                        style={{
                            height: `${(count / maxCount) * 100}%`,                            background: 'var(--primary)'                        }}
                        title={tooltipText}
                    />
                );
            })}
        </div>
    );
};

