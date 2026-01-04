import { Sparkles } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { SuggestionCard } from './SuggestionCard';
import { AILoading } from '@/components/common/AILoading';
import { SimpleSuggestion, ProjectFile, ICON_SIZE_LARGE } from '../types/cleaning.types';
import './SuggestionsTab.css';

interface SuggestionsTabProps {
    suggestions: SimpleSuggestion[];
    selectedIds: string[];
    ignoredIds: string[];
    loading: boolean;
    aiProgressMsg: string;
    aiGenerated: boolean;
    error: string | null;
    activeFile?: ProjectFile;
    expandedSqlIds?: string[];
    onToggleSugg: (id: string) => void;
    onToggleSql?: (id: string) => void;
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
    expandedSqlIds = [],
    onToggleSugg,
    onToggleSql
}: SuggestionsTabProps) {
    const { t } = useI18n();

    // 优先级 1: 加载状态 (AI生成)
    if (loading) {
        return <AILoading visible={true} message={aiProgressMsg} />;
    }

    // 优先级 2: 显示建议列表
    if (suggestions.length > 0) {
        return (
            <div className="suggestionsTabContent">
                {/* 建议卡片列表（移除分类标签页，直接显示所有PROMPT建议） */}
                <div className="cardRow">
                    {suggestions.map(suggestion => (
                        <SuggestionCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            isSelected={selectedIds.includes(suggestion.id)}
                            isIgnored={ignoredIds.includes(suggestion.id)}
                            isSqlExpanded={expandedSqlIds.includes(suggestion.id)}
                            onToggle={onToggleSugg}
                            onToggleSql={onToggleSql}
                            fileName={activeFile?.name}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // 优先级 3: 空状态处理
    if (error) {
        return (
            <div className="aiEmpty">
                <span className="warning-icon">⚠️</span>
                <div className="emptyText warning-text">
                    {t('cleaning.serviceUnavailable')}
                </div>
            </div>
        );
    }

    if (aiGenerated) {
        return (
            <div className="aiEmpty">
                <Sparkles size={ICON_SIZE_LARGE} className="primary-icon" />
                <div className="emptyText">{t('cleaning.dataGood')}</div>
            </div>
        );
    }

    // 初始状态
    return (
        <div className="aiEmpty state-initial">
            <div className="emptyIconWrapper">
                <Sparkles size={24} className="primary-icon" />
            </div>
            <div className="emptyText">
                {t('cleaning.tryAI')}
            </div>
        </div>
    );
}
