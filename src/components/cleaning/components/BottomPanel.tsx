import React, { useState } from 'react';
import { Sparkles, History, CheckCircle2, Play, RefreshCw, X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { SuggestionsTab } from './SuggestionsTab';
import { HistoryTab } from './HistoryTab';
import { CleaningSuggestion } from '../types/cleaning.types';
import { HistoryItem } from '../types/cleaning.types';
import { ProjectFile } from '@/types/project';
import './BottomPanel.css';

interface BottomPanelProps {
    suggestions: CleaningSuggestion[];
    history: HistoryItem[];
    selectedIds: string[];
    ignoredIds: string[];
    loading: boolean;
    suggestionLoading: boolean;
    aiProgressMsg: string;
    hasAISuggestions: boolean;
    aiGenerated: boolean;
    error: string | null;
    activeFile?: ProjectFile;
    onToggleSugg: (id: string) => void;
    onToggleSelectAll: () => void;
    onApply: () => void;
    onIgnore: () => void;
    onRefreshAI: () => void;
    onReset: () => void;
}

/**
 * 底部综合面板组件
 * 职责：管理 Suggestions/History 标签切换，整合操作按钮和子标签页内容
 */
export function BottomPanel({
    suggestions,
    history,
    selectedIds,
    ignoredIds,
    loading,
    suggestionLoading,
    aiProgressMsg,
    hasAISuggestions,
    aiGenerated,
    error,
    activeFile,
    onToggleSugg,
    onToggleSelectAll,
    onApply,
    onIgnore,
    onRefreshAI,
    onReset
}: BottomPanelProps) {
    const { t } = useI18n();
    const [bottomPanelTab, setBottomPanelTab] = useState<'suggestions' | 'history'>('suggestions');

    return (
        <div className="cleanerBottomModule">
            {/* 标签页导航 */}
            <div className="bottomModuleHeader">
                <button
                    className={`bottomModuleTab ${bottomPanelTab === 'suggestions' ? 'active' : ''}`}
                    onClick={() => setBottomPanelTab('suggestions')}
                >
                    <Sparkles size={16} />
                    {t('cleaning.cleaningSuggestions')}
                    {suggestions.length > 0 && <span className="tabBadge">{suggestions.length}</span>}
                </button>
                <button
                    className={`bottomModuleTab ${bottomPanelTab === 'history' ? 'active' : ''}`}
                    onClick={() => setBottomPanelTab('history')}
                >
                    <History size={16} />
                    {t('cleaning.history')}
                    {history.length > 0 && <span className="tabBadge">{history.length}</span>}
                </button>

                {/* 全局操作按钮区域 */}
                <div className="bottomModuleActions">
                    {bottomPanelTab === 'suggestions' && suggestions.length > 0 && (
                        <>
                            <button className="btnPanelAction" onClick={onToggleSelectAll} disabled={loading}>
                                <CheckCircle2 size={14} />
                                {selectedIds.length === suggestions.filter(s => !ignoredIds.includes(s.id)).length
                                    ? t('cleaning.deselectAll')
                                    : t('cleaning.selectAll')}
                            </button>
                            <button
                                className="btnPanelAction btnApply"
                                onClick={onApply}
                                disabled={loading || selectedIds.length === 0}
                            >
                                {loading ? <RefreshCw className="spin" size={14} /> : <Play size={14} />}
                                {t('cleaning.applySelected', { count: selectedIds.length })}
                            </button>
                            <button
                                className="btnPanelAction btnIgnore"
                                onClick={onIgnore}
                                disabled={loading || selectedIds.length === 0}
                            >
                                <X size={14} />
                                {t('cleaning.ignore')}
                            </button>
                        </>
                    )}
                    {bottomPanelTab === 'history' && history.length > 0 && (
                        <button className="btnPanelAction btnReset" onClick={onReset} disabled={loading}>
                            <RefreshCw size={14} />
                            {t('cleaning.resetAll')}
                        </button>
                    )}
                    {bottomPanelTab === 'suggestions' && (
                        <button
                            className={`btnPanelAction ${hasAISuggestions ? 'aiRefreshBtn' : 'aiGenerateBtn'}`}
                            onClick={onRefreshAI}
                            disabled={loading}
                            title={hasAISuggestions ? t('cleaning.refreshAI') : t('cleaning.generateAI')}
                        >
                            {loading ? <RefreshCw className="spin" size={14} /> : (hasAISuggestions ? <RefreshCw size={14} /> : <Sparkles size={14} />)}
                            {hasAISuggestions ? t('cleaning.refreshAI') : t('cleaning.generateAI')}
                        </button>
                    )}
                </div>
            </div>

            {/* 标签页内容区 */}
            <div className="bottomModuleContent">
                {bottomPanelTab === 'suggestions' ? (
                    <SuggestionsTab
                        suggestions={suggestions}
                        selectedIds={selectedIds}
                        ignoredIds={ignoredIds}
                        loading={suggestionLoading}
                        aiProgressMsg={aiProgressMsg}
                        aiGenerated={aiGenerated}
                        error={error}
                        activeFile={activeFile}
                        onToggleSugg={onToggleSugg}
                    />
                ) : (
                    <HistoryTab history={history} />
                )}
            </div>
        </div>
    );
}
