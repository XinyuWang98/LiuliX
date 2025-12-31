import React, { useState } from 'react';
import { Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { SuggestionCard } from './SuggestionCard';
import { AILoading } from '@/components/common/AILoading';
import { CleaningSuggestion, SuggestionCategory, ICON_SIZE_LARGE, CATEGORY_META } from '../types/cleaning.types';
import { groupByCategory } from '../utils/suggestionUtils';
import { ProjectFile } from '@/types/project';
import './SuggestionsTab.css';

interface SuggestionsTabProps {
    suggestions: CleaningSuggestion[];
    selectedIds: string[];
    ignoredIds: string[];
    loading: boolean;
    aiProgressMsg: string;
    aiGenerated: boolean;
    error: string | null;
    activeFile?: ProjectFile;
    onToggleSugg: (id: string) => void;
}

/**
 * 建议列表标签页组件
 * 职责：展示数据清洗建议，包含分类标签、建议卡片列表和空状态处理
 */
export function SuggestionsTab({
    suggestions,
    selectedIds,
    ignoredIds,
    loading,
    aiProgressMsg,
    aiGenerated,
    error,
    activeFile,
    onToggleSugg
}: SuggestionsTabProps) {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<string | null>(null);

    // 优先级 1: 加载状态 (AI生成)
    if (loading) {
        return <AILoading visible={true} message={aiProgressMsg} />;
    }

    // 优先级 2: 显示建议列表
    if (suggestions.length > 0) {
        const grouped = groupByCategory(suggestions);
        const currentCategory = activeTab || grouped[0]?.[0];
        const currentItems = grouped.find(([c]) => c === currentCategory)?.[1] || [];

        return (
            <div className="suggestionsTabContent">
                {/* 分类标签导航 */}
                <div className="suggestionTabs">
                    {grouped.map(([category, items]) => {
                        const isAICategory = items.some(s => s.id.startsWith('ai_'));
                        const meta = isAICategory
                            ? { icon: <Sparkles size={14} />, color: 'var(--accent)', nameKey: 'cleaning.aiSuggestions' }
                            : (CATEGORY_META[category as SuggestionCategory] || { icon: '?', color: '#888', nameKey: 'cleaning.unknownAction' });
                        const isActive = category === currentCategory;

                        return (
                            <button
                                key={category}
                                className={`tabItem ${isActive ? 'active' : ''} ${isAICategory ? 'ai-tab' : ''}`}
                                onClick={() => setActiveTab(category)}
                            >
                                <span className="tabIcon">{meta.icon}</span>
                                <span className="tabName">
                                    {isAICategory ? t('cleaning.aiSuggestions') : t(meta.nameKey as any)}
                                </span>
                                <span className="tabCount">({items.length})</span>
                            </button>
                        );
                    })}
                </div>

                {/* 建议卡片列表 */}
                {currentItems.length > 0 && (
                    <div className="cardRow">
                        {currentItems.map(suggestion => (
                            <SuggestionCard
                                key={suggestion.id}
                                suggestion={suggestion}
                                isSelected={selectedIds.includes(suggestion.id)}
                                isIgnored={ignoredIds.includes(suggestion.id)}
                                onToggle={onToggleSugg}
                                fileName={activeFile?.name}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // 优先级 3: 空状态处理
    if (error) {
        return (
            <div className="aiEmpty">
                <span style={{ fontSize: '32px' }}>⚠️</span>
                <div className="emptyText" style={{ color: 'var(--warning)' }}>
                    {t('cleaning.serviceUnavailable')}
                </div>
            </div>
        );
    }

    if (aiGenerated) {
        return (
            <div className="aiEmpty">
                <Sparkles size={ICON_SIZE_LARGE} style={{ color: 'var(--primary)' }} />
                <div className="emptyText">{t('cleaning.dataGood')}</div>
            </div>
        );
    }

    // 初始状态
    return (
        <div className="aiEmpty state-initial">
            <div className="emptyIconWrapper">
                <Sparkles size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="emptyText">
                {t('cleaning.tryAI') || '暂无规则建议，试试让 AI 深度分析？'}
            </div>
        </div>
    );
}
