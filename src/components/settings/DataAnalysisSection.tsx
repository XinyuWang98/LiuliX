/**
 * 数据分析策略设置组件（MVP简化版：仅平衡模式）
 */

import React from 'react';
import { useI18n } from '@/contexts/I18nContext';

export type AnalysisStrategy = 'balanced' | 'fast' | 'precise';

export function DataAnalysisSection() {
    const { t } = useI18n();
    const [strategy, setStrategy] = React.useState<AnalysisStrategy>('balanced');

    return (
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
                        {t('settings.dataAnalysis.fastMode')}
                        <span className="badge coming-soon">{t('settings.dataAnalysis.fastModeBadge')}</span>
                    </div>
                    <div className="option-desc">
                        {t('settings.dataAnalysis.fastModeDesc')}
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
                        {t('settings.dataAnalysis.balancedMode')}
                        <span className="badge default">{t('settings.dataAnalysis.balancedModeBadge')}</span>
                    </div>
                    <div className="option-desc">
                        {t('settings.dataAnalysis.balancedModeDesc')}
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
                        {t('settings.dataAnalysis.preciseMode')}
                        <span className="badge coming-soon">{t('settings.dataAnalysis.preciseModeBadge')}</span>
                    </div>
                    <div className="option-desc">
                        {t('settings.dataAnalysis.preciseModeDesc')}
                    </div>
                </div>
            </label>
        </div>
    );
}
