import React from 'react';
import './BoxPlotMini.css';

interface BoxPlotMiniProps {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
}

/**
 * 极简箱线图组件
 * 用于列头快速可视化五数概括
 */
export const BoxPlotMini: React.FC<BoxPlotMiniProps> = ({ min, q1, median, q3, max }) => {
    // 计算相对位置（百分比）
    const range = max - min;
    if (range === 0) {
        // 所有值相同，显示单点
        return (
            <div className="boxplot-mini">
                <div className="constant-indicator" style={{ left: '50%' }} />
            </div>
        );
    }

    const q1Pos = ((q1 - min) / range) * 100;
    const q3Pos = ((q3 - min) / range) * 100;
    const iqrWidth = q3Pos - q1Pos;

    return (
        <div className="boxplot-mini">
            {/* 左须（Min → Q1） */}
            <div
                className="whisker whisker-left"
                style={{
                    left: '0%',
                    width: `${q1Pos}%`
                }}
            />

            {/* 箱体（Q1 → Q3） */}
            <div
                className="box"
                style={{
                    left: `${q1Pos}%`,
                    width: `${iqrWidth}%`
                }}
            >
                {/* 中位线 */}
                <div
                    className="median-line"
                    style={{
                        left: `${((median - q1) / (q3 - q1)) * 100}%`
                    }}
                />
            </div>

            {/* 右须（Q3 → Max） */}
            <div
                className="whisker whisker-right"
                style={{
                    left: `${q3Pos}%`,
                    width: `${100 - q3Pos}%`
                }}
            />
        </div>
    );
};
