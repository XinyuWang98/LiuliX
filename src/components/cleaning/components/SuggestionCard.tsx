// 建议卡片组件 - 简洁版 (In-Place Expansion Mode)

import React, { useState } from 'react';
import { SimpleSuggestion } from '../types/cleaning.types';
import { useI18n } from '../../../contexts/I18nContext';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { formatSQL } from '../../../utils/sqlFormatter';
import './SuggestionCard.css';

interface SuggestionCardProps {
    suggestion: SimpleSuggestion;
    isSelected: boolean;
    isIgnored?: boolean; // 是否被忽略
    onToggle: (id: string) => void;
}

/**
 * 单个建议卡片（简洁文本型）
 * 格式：【AI/规则建议】操作描述 推荐度XX%
 * 点击高亮选中，支持多选，选中后直接在卡片内展开详情
 */
export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, isSelected, isIgnored, onToggle }) => {
    const { t } = useI18n();
    const [isSqlExpanded, setIsSqlExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    // 判断来源
    const isAI = suggestion.id.startsWith('ai_');

    // 置信度百分比
    const confidencePercent = Math.round(suggestion.confidence * 100);

    const handleCopyObj = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleSql = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSqlExpanded(!isSqlExpanded);
    };

    // 格式化 SQL 展示
    const displaySql = suggestion.sql
        ? formatSQL(suggestion.sql.replace(/__TABLE_NAME__/g, '{table}'))
        : '';

    // 计算推荐度颜色
    const getConfidenceColor = (score: number) => {
        if (score >= 0.8) return 'var(--color-quality-healthy)'; // 强推荐 (Green)
        if (score >= 0.6) return 'var(--color-quality-warning)'; // 中等 (Orange)
        return 'var(--text-tertiary)'; // 低 (Grey) - 保持低调，或者用 Critical
    };

    return (
        <div
            className={`suggestionCard ${isSelected ? 'selected' : ''} ${isIgnored ? 'ignored' : ''}`}
            onClick={() => onToggle(suggestion.id)}
        >
            {/* 1. 头部：来源标签 + 标题 + 置信度 */}
            <div className="cardHeader">
                <div className="headerLeft">
                    <span className={`sourceLabel ${isAI ? 'ai' : 'rule'}`}>
                        {isAI ? 'AI' : 'Rule'}
                    </span>
                    <span className="suggestionTitle" title={suggestion.label}>
                        {suggestion.label}
                    </span>
                </div>
                <span
                    className="confidenceText"
                    style={{ color: getConfidenceColor(suggestion.confidence) }}
                >
                    {t('cleaning.recommendPercent', { percent: confidencePercent })}
                </span>
            </div>

            {/* 2. 中部：详细说明 + SQL代码 */}
            <div className="detailContent">
                <div className="reasonText">{suggestion.reason || suggestion.label}</div>

                {/* SQL Code Body (Above the Toggle) */}
                {suggestion.sql && isSqlExpanded && (
                    <div className="sqlBody">
                        <code className="sqlCode">
                            {displaySql}
                        </code>
                    </div>
                )}
            </div>

            {/* 3. 底部：SQL 操作栏 (Always at bottom) */}
            {suggestion.sql && (
                <div className="sqlFooter" onClick={toggleSql}>
                    <div className="sqlToggle">
                        {isSqlExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span className="sqlLabel">EXECUTE SQL</span>
                    </div>
                    {isSqlExpanded && (
                        <button
                            className="copyBtn"
                            onClick={(e) => handleCopyObj(e, displaySql)}
                            title="Copy SQL"
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
