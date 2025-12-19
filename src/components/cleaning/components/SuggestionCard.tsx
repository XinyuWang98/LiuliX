// 建议卡片组件

import React from 'react';
import { SimpleSuggestion, CATEGORY_META } from '../types/cleaning.types';
import { Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';

interface SuggestionCardProps {
    suggestion: SimpleSuggestion;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

/**
 * 单个建议卡片（横向紧凑型）
 * 包含checkbox、图标、文本、置信度、以及 Dry Run 状态
 */
export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, isSelected, onToggle }) => {
    const meta = CATEGORY_META[suggestion.category];
    const { t } = useI18n();

    return (
        <div
            className={`suggestionCard ${isSelected ? 'selected' : ''}`}
            onClick={() => onToggle(suggestion.id)}
        >
            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(suggestion.id)}
                onClick={(e) => e.stopPropagation()}
            />
            <div className="cardIcon" style={{ color: meta.color }}>
                {meta.icon}
            </div>
            <div className="cardBody">
                <div className="cardText" title={suggestion.label}>
                    {suggestion.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)', marginTop: '4px' }}>
                    <div className="cardConfidence" style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>
                        {Math.round(suggestion.confidence * 100)}%
                    </div>
                    {/* Async Status Display */}
                    {suggestion.dryRunStatus === 'pending' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }} title={t('cleaning.statusVerifying')}>
                            <Loader size={12} className="spin" />
                            <span>{t('cleaning.statusVerifying')}</span>
                        </div>
                    )}
                    {suggestion.dryRunStatus === 'failed' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-xs)', color: 'var(--error)' }} title={t('cleaning.statusFailed')}>
                            <AlertTriangle size={12} />
                            <span>{t('cleaning.statusFailed')}</span>
                        </div>
                    )}
                    {suggestion.expectedImpact && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-xs)', color: 'var(--success)' }} title={suggestion.expectedImpact}>
                            <CheckCircle size={12} />
                            <span>{suggestion.expectedImpact}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
