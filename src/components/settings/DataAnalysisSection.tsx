/**
 * 数据分析策略设置组件（MVP简化版：仅平衡模式）
 */

import React from 'react';

export type AnalysisStrategy = 'balanced' | 'fast' | 'precise';

export function DataAnalysisSection() {
    const [strategy, setStrategy] = React.useState<AnalysisStrategy>('balanced');

    return (
        <div className="settings-section">
            <h3 className="settings-section-title">📊 数据分析策略</h3>
            <p className="settings-section-desc">
                选择AI采样行数（影响分析速度和准确性）
            </p>

            <div className="settings-options">
                <label className="settings-option disabled">
                    <input
                        type="radio"
                        name="analysis-strategy"
                        value="fast"
                        disabled
                    />
                    <div className="option-content">
                        <div className="option-label">
                            快速模式
                            <span className="badge coming-soon">敬请期待</span>
                        </div>
                        <div className="option-desc">
                            AI采样：500行 | 推理时间：~2秒
                        </div>
                    </div>
                </label>

                <label className="settings-option">
                    <input
                        type="radio"
                        name="analysis-strategy"
                        value="balanced"
                        checked={strategy === 'balanced'}
                        onChange={() => setStrategy('balanced')}
                    />
                    <div className="option-content">
                        <div className="option-label">
                            平衡模式（当前MVP）
                            <span className="badge default">默认</span>
                        </div>
                        <div className="option-desc">
                            AI采样：1000行 | 推理时间：~5秒
                        </div>
                    </div>
                </label>

                <label className="settings-option disabled">
                    <input
                        type="radio"
                        name="analysis-strategy"
                        value="precise"
                        disabled
                    />
                    <div className="option-content">
                        <div className="option-label">
                            精确模式
                            <span className="badge coming-soon">敬请期待</span>
                        </div>
                        <div className="option-desc">
                            AI采样：5000行（动态计算） | 推理时间：~10秒
                        </div>
                    </div>
                </label>
            </div>
        </div>
    );
}
