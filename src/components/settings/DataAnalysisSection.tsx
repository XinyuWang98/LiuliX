import React from 'react';
import { useI18n } from '@/contexts/I18nContext';

export type AnalysisStrategy = 'balanced' | 'fast' | 'precise';

export function DataAnalysisSection() {
    const { t } = useI18n();
    const [strategy, setStrategy] = React.useState<AnalysisStrategy>('fast');  // 固定10万行策略

    return (
        <div className="settings-options">
            {/* 固定10万行采样策略（2026-01-14简化） */}
            <label className="settings-option">
                <input
                    type="radio"
                    name="analysis-strategy"
                    value="fast"
                    checked={strategy === 'fast'}
                    onChange={() => setStrategy('fast')}
                />
                <div className="option-content">
                    <div className="option-label">
                        {t('settings.dataAnalysis.fastMode')}
                        <span className="badge default">{t('settings.common.default')}</span>
                    </div>
                    <div className="option-desc">
                        {t('settings.dataAnalysis.fastModeDesc')}
                    </div>
                </div>
            </label>

            {/* Balanced Mode已隐藏：动态评估策略已废弃，改为固定10万行上限 */}
        </div>
    );
}
