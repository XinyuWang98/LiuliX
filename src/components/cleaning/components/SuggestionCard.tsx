// 建议卡片组件 - 简洁版 (In-Place Expansion Mode)

import React from 'react';
import { SimpleSuggestion } from '../types/cleaning.types';
import { useI18n } from '../../../contexts/I18nContext';
import './SuggestionCard.css';

interface SuggestionCardProps {
    suggestion: SimpleSuggestion;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

/**
 * 单个建议卡片（简洁文本型）
 * 格式：【AI/规则建议】操作描述 推荐度XX%
 * 点击高亮选中，支持多选，选中后直接在卡片内展开详情
 */
export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, isSelected, onToggle }) => {
    const { t } = useI18n();

    // 置信度百分比
    const confidencePercent = Math.round(suggestion.confidence * 100);

    // 判断来源
    const isAI = suggestion.id.startsWith('ai_');

    return (
        <div
            className={`suggestionCard ${isSelected ? 'selected' : ''}`}
            onClick={() => onToggle(suggestion.id)}
        >
            {/* 头部摘要区 - 始终显示 */}
            <div className="cardHeader">
                <span className={`sourceLabel ${isAI ? 'ai' : 'rule'}`}>
                    {isAI ? 'AI' : 'Rule'}
                </span>
                <span className="suggestionText" title={suggestion.label}>
                    {suggestion.label}
                </span>
                <span className="confidenceText">
                    {t('cleaning.recommendPercent', { percent: confidencePercent })}
                </span>
            </div>

            {/* 详情展开区 - 始终显示 */}
            <div className={`detailContent`}>
                {suggestion.reason || suggestion.label}
            </div>
        </div>
    );
};
