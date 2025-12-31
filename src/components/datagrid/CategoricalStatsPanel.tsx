import React from 'react';
import { formatTimestamp } from '@/utils/dateUtils';
// formatCellValue 逻辑目前在 VirtualDataGrid 中定义较复杂，这里简化引用或重复部分逻辑以解耦
// 为保持一致性，我们暂时简化实现，后续可提取公共 formatter
import './StatsPanel.css';

interface CategoricalStatItem {
    value: string;
    count: number;
}

interface CategoricalStats {
    topValues: CategoricalStatItem[];
}

interface CategoricalStatsPanelProps {
    stat: CategoricalStats;
    type: string;
    columnName: string;
}

// 简单的辅助格式化函数
const formatDisplayValue = (value: any, type: string, columnName: string): string => {
    if (value === null || value === undefined) return '-';

    const typeUpper = type.toUpperCase();

    // 时间戳处理
    if (typeUpper === 'DATE' || typeUpper === 'TIMESTAMP') {
        return formatTimestamp(value, typeUpper === 'TIMESTAMP');
    }

    // 启发式：数值型且名字像时间
    if ((typeof value === 'number' || !isNaN(Number(value))) &&
        (columnName.toLowerCase().includes('time') || columnName.toLowerCase().includes('date'))) {
        return formatTimestamp(value);
    }

    // 字符串截断
    const str = String(value);
    if (str.length > 50) return str.substring(0, 50) + '...';

    return str;
};

export const CategoricalStatsPanel: React.FC<CategoricalStatsPanelProps> = ({ stat, type, columnName }) => {
    return (
        <div className="stats-panel categorical-panel">
            <div className="panel-header">TOP 5 VALUES</div>
            <div className="separator"></div>
            <div className="panel-body">
                {stat.topValues.map((item, idx) => (
                    <div key={idx} className="stat-row">
                        <span className="stat-label text-ellipsis" title={String(item.value)}>
                            {formatDisplayValue(item.value, type, columnName)}
                        </span>
                        <span className="stat-value">{item.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
