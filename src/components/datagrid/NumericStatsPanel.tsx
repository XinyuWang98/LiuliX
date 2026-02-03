import React from 'react';
import './StatsPanel.css';

interface NumericStats {
    min: number;
    q1: number;
    median: number;
    mean: number;      // 🆕 v2.3 平均值
    q3: number;
    max: number;
    stddev: number;
    skewness: number;
    kurtosis: number;
    cv?: number;       // 🆕 v2.3 变异系数
}

interface NumericStatsPanelProps {
    stat: NumericStats;
}

/**
 * 智能数值格式化
 * 用户友好的数值显示（避免科学计数法）
 */
const formatSmartNumber = (num: number): string => {
    if (num === null || num === undefined || isNaN(num)) return '-';

    const absNum = Math.abs(num);

    // 极小数值（接近0）直接显示为 ≈0
    if (absNum > 0 && absNum < 1e-6) {
        return '≈0';
    }

    // 非常小的数值保留6位小数
    if (absNum > 0 && absNum < 0.01) {
        return num.toFixed(6);
    }

    // 大数值使用单位缩写 (e.g., 1.25B, 1.25M, 1.25K)
    if (absNum >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (absNum >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (absNum >= 1e3) return `${(num / 1e3).toFixed(2)}K`;

    // 整数显示原值
    if (Number.isInteger(num)) return num.toLocaleString();

    // 小数保留2位
    return num.toFixed(2);
};

export const NumericStatsPanel: React.FC<NumericStatsPanelProps> = ({ stat }) => {
    return (
        <div className="stats-panel numeric-panel">
            <div className="panel-header">SUMMARY</div>
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
                <span className="stat-label">MEAN</span>
                <span className="stat-value" title={String(stat.mean)}>{formatSmartNumber(stat.mean)}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">STD DEV</span>
                <span className="stat-value" title={String(stat.stddev)}>{formatSmartNumber(stat.stddev)}</span>
            </div>
            {stat.cv !== undefined && (
                <div className="stat-row">
                    <span className="stat-label">CV</span>
                    <span className="stat-value" title={String(stat.cv)}>{formatSmartNumber(stat.cv)}</span>
                </div>
            )}
            <div className="stat-row">
                <span className="stat-label">SKEWNESS</span>
                <span className="stat-value" title={String(stat.skewness)}>{formatSmartNumber(stat.skewness)}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">KURTOSIS</span>
                <span className="stat-value" title={String(stat.kurtosis)}>{formatSmartNumber(stat.kurtosis)}</span>
            </div>
        </div>
    );
};
