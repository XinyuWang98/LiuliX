import React from 'react';
import './StatsPanel.css';

interface NumericStats {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    stddev: number;
    skewness: number;
}

interface NumericStatsPanelProps {
    stat: NumericStats;
}

/**
 * 智能数值格式化
 * 针对大数值使用紧凑格式或科学计数法
 */
const formatSmartNumber = (num: number): string => {
    if (num === null || num === undefined || isNaN(num)) return '-';

    const absNum = Math.abs(num);

    // 极大数值使用科学计数法 (e.g., 1.23e+12)
    if (absNum >= 1e12 || (absNum > 0 && absNum < 1e-4)) {
        return num.toExponential(3);
    }

    // 大数值使用单位缩写 (e.g., 1.25B)
    if (absNum >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (absNum >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (absNum >= 1e3) return `${(num / 1e3).toFixed(2)}K`;

    // 整数显示原值
    if (Number.isInteger(num)) return num.toString();

    // 小数保留2位
    return num.toFixed(2);
};

export const NumericStatsPanel: React.FC<NumericStatsPanelProps> = ({ stat }) => {
    return (
        <div className="stats-panel numeric-panel">
            <div className="panel-header">SUMMARY</div>
            <div className="separator"></div>
            <div className="stat-row">
                <span className="stat-label">MIN</span>
                <span className="stat-value" title={String(stat.min)}>{formatSmartNumber(stat.min)}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">Q1</span>
                <span className="stat-value" title={String(stat.q1)}>{formatSmartNumber(stat.q1)}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">MEDIAN</span>
                <span className="stat-value" title={String(stat.median)}>{formatSmartNumber(stat.median)}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">Q3</span>
                <span className="stat-value" title={String(stat.q3)}>{formatSmartNumber(stat.q3)}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">MAX</span>
                <span className="stat-value" title={String(stat.max)}>{formatSmartNumber(stat.max)}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">STD DEV</span>
                <span className="stat-value" title={String(stat.stddev)}>{formatSmartNumber(stat.stddev)}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">SKEWNESS</span>
                <span className="stat-value" title={String(stat.skewness)}>{formatSmartNumber(stat.skewness)}</span>
            </div>
        </div>
    );
};
