import React, { useState } from 'react';
import { Sparkles, Play, CheckCircle2, RefreshCw, History, Check } from 'lucide-react';

import { SuggestionCard } from './components/SuggestionCard';
import { useI18n } from '../../contexts/I18nContext';
import { DataViewer } from '../data/DataViewer';
import {
    DataCleanerProps,
    SuggestionCategory,
    ICON_SIZE_MEDIUM,
    ICON_SIZE_LARGE,
    CATEGORY_META
} from './types/cleaning.types';
import { groupByCategory } from './utils/suggestionUtils';
import { useCleaningHistory } from './hooks/useCleaningHistory';
import { useSuggestionGeneration } from './hooks/useSuggestionGeneration';
import { useCleaningExecution } from './hooks/useCleaningExecution';
import './DataCleaner.css';

export const DataCleaner: React.FC<DataCleanerProps> = ({ project, cleaningTrigger, onProjectUpdate, aiSuggestions }) => {
    const { t } = useI18n();
    const [activeFileId, setActiveFileId] = useState<string | null>(project.files[0]?.id || null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [bottomPanelTab, setBottomPanelTab] = useState<'suggestions' | 'history'>('suggestions');

    const activeFile = project.files.find(f => f.id === activeFileId);

    // 使用建议生成Hook
    const {
        suggestions,
        loading: suggestionLoading,
        removeSuggestions,
        refreshAISuggestions,
        hasAISuggestions,
        aiGenerated,
        error
    } = useSuggestionGeneration(
        activeFile,
        cleaningTrigger || 0,
        aiSuggestions,
        onProjectUpdate,
        project
    );

    // 使用历史记录Hook
    const { history, addHistoryItem, clearHistory } = useCleaningHistory();

    // 使用清洗执行Hook
    const {
        handleApply: executeApply,
        confirmReset,
        cancelReset,
        loading: executionLoading,
        showResetConfirm
    } = useCleaningExecution(
        project,
        activeFile,
        onProjectUpdate,
        addHistoryItem,
        clearHistory
    );

    const loading = suggestionLoading || executionLoading;

    // 切换建议选中状态
    const toggleSugg = (id: string) => setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

    // 全选/取消全选
    const toggleSelectAll = () => {
        if (selectedIds.length === suggestions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(suggestions.map(s => s.id));
        }
    };

    // 应用选中的建议
    const handleApply = async () => {
        const selected = suggestions.filter(s => selectedIds.includes(s.id));
        if (selected.length === 0) return;

        await executeApply(selected);

        // 移除已应用的建议
        removeSuggestions(selectedIds);
        setSelectedIds([]); // 清空选中
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="cleanerContainer">
            {/* 1. 数据表格 (Top - Order revised as requested) */}
            <div className="cleanerGridWrapper">
                <DataViewer
                    key={`${activeFileId}-${refreshKey}`}
                    project={project}
                    activeFileId={activeFileId || undefined}
                    onProjectUpdate={onProjectUpdate}
                    onFileChange={setActiveFileId}
                />
            </div>

            {/* 2. 底部综合面板 (Suggestions + History integrated) */}
            <div className="cleanerBottomModule">
                {/* 模块标签页导航 */}
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

                    {/* 面板全局操作区域 (仅 Suggestions 活跃时可见部分, 或放在内容区) */}
                    <div className="bottomModuleActions">
                        {bottomPanelTab === 'suggestions' && suggestions.length > 0 && (
                            <>
                                <button className="btnPanelAction" onClick={toggleSelectAll} disabled={loading}>
                                    <CheckCircle2 size={14} />
                                    {selectedIds.length === suggestions.length ? t('cleaning.deselectAll') : t('cleaning.selectAll')}
                                </button>
                                <button
                                    className="btnPanelAction btnApply"
                                    onClick={handleApply}
                                    disabled={loading || selectedIds.length === 0}
                                >
                                    {loading ? <RefreshCw className="spin" size={14} /> : <Play size={14} />}
                                    {t('cleaning.applySelected', { count: selectedIds.length })}
                                </button>
                            </>
                        )}
                        {bottomPanelTab === 'history' && history.length > 0 && (
                            <button className="btnPanelAction btnReset" onClick={() => confirmReset()} disabled={loading}>
                                <RefreshCw size={14} />
                                {t('cleaning.resetAll')}
                            </button>
                        )}
                        {bottomPanelTab === 'suggestions' && (
                            <button
                                className={`btnPanelAction ${hasAISuggestions ? 'aiRefreshBtn' : 'aiGenerateBtn'}`}
                                onClick={refreshAISuggestions}
                                disabled={loading}
                                title={hasAISuggestions ? t('cleaning.refreshAI') : t('cleaning.generateAI')}
                            >
                                {loading ? <RefreshCw className="spin" size={14} /> : (hasAISuggestions ? <RefreshCw size={14} /> : <Sparkles size={14} />)}
                                {hasAISuggestions ? t('cleaning.refreshAI') : t('cleaning.generateAI')}
                            </button>
                        )}
                    </div>
                </div>

                {/* 模块内容区 */}
                <div className="bottomModuleContent">
                    {bottomPanelTab === 'suggestions' ? (
                        <div className="suggestionsTabContent">
                            {/* 原 AI Panel 内容 */}
                            <div className="aiActionPanel">
                                {suggestions.length > 0 && (
                                    <div className="aiPanelHeader">
                                        <div className="suggestionTabs">
                                            {groupByCategory(suggestions).map(([category, items]) => {
                                                const isAICategory = items.some(s => s.id.startsWith('ai_'));
                                                const meta = isAICategory
                                                    ? { icon: <Sparkles size={14} />, color: 'var(--accent)', nameKey: 'cleaning.aiSuggestions' }
                                                    : (CATEGORY_META[category as SuggestionCategory] || { icon: '?', color: '#888', nameKey: 'cleaning.unknownAction' });
                                                const isActive = activeTab === category || (!activeTab && category === groupByCategory(suggestions)[0][0]);
                                                return (
                                                    <button
                                                        key={category}
                                                        className={`tabItem ${isActive ? 'active' : ''} ${isAICategory ? 'ai-tab' : ''}`}
                                                        onClick={() => setActiveTab(category)}
                                                    >
                                                        <span className="tabIcon">{meta.icon}</span>
                                                        <span className="tabName">{isAICategory ? t('cleaning.aiSuggestions') : t(meta.nameKey as any)}</span>
                                                        <span className="tabCount">({items.length})</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="tabContent">
                                    {(() => {
                                        if (suggestions.length > 0) {
                                            const grouped = groupByCategory(suggestions);
                                            const currentCategory = activeTab || grouped[0]?.[0];
                                            const currentItems = grouped.find(([c]) => c === currentCategory)?.[1] || [];
                                            if (currentItems.length === 0) return null;
                                            return (
                                                <div className="categoryGroup">
                                                    <div className="cardRow">
                                                        {currentItems.map(s => (
                                                            <SuggestionCard
                                                                key={s.id}
                                                                suggestion={s}
                                                                isSelected={selectedIds.includes(s.id)}
                                                                onToggle={toggleSugg}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (loading) return <div className="aiEmpty"><RefreshCw className="spin" size={ICON_SIZE_LARGE} />{t('cleaning.analyzing')}</div>;
                                        if (history.length > 0) return <div className="aiEmpty"><CheckCircle2 size={ICON_SIZE_LARGE} style={{ color: 'var(--success)' }} />{t('cleaning.allApplied')}</div>;
                                        if (error) return <div className="aiEmpty" style={{ color: 'var(--warning)' }}><span style={{ fontSize: '24px' }}>⚠️</span>{t('cleaning.serviceUnavailable')}</div>;
                                        if (aiGenerated) return <div className="aiEmpty"><Sparkles size={ICON_SIZE_LARGE} style={{ color: 'var(--primary)' }} />{t('cleaning.dataGood')}</div>;
                                        return <div className="aiEmpty"><Sparkles size={ICON_SIZE_LARGE} style={{ color: 'var(--text-tertiary)' }} />{t('cleaning.tryAI')}</div>;
                                    })()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="historyTabContent">
                            <div className="historyPanel">
                                {history.length === 0 ? (
                                    <div className="historyEmpty">{t('cleaning.noHistory')}</div>
                                ) : (
                                    <div className="historyList">
                                        {history.map(h => {
                                            const delta = h.rowCountAfter - h.rowCountBefore;
                                            return (
                                                <div key={h.id} className="historyItem">
                                                    <span className="historyTime">[{new Date(h.timestamp).toLocaleTimeString()}]</span>
                                                    <span className="historyAction">{h.action}</span>
                                                    <span className={`deltaTag ${delta < 0 ? 'negative' : (delta > 0 ? 'positive' : '')}`}>
                                                        {h.rowCountBefore} → {h.rowCountAfter} ({delta > 0 ? '+' : ''}{delta})
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 重置确认对话框 */}
            {showResetConfirm && (
                <div className="confirmOverlay" onClick={cancelReset}>
                    <div className="confirmDialog" onClick={(e) => e.stopPropagation()}>
                        <h3 className="confirmTitle">{t('cleaning.resetAll')}</h3>
                        <p className="confirmMessage">{t('cleaning.resetConfirm')}</p>
                        <div className="confirmActions">
                            <button className="btnGhost" onClick={cancelReset}>{t('common.cancel')}</button>
                            <button className="btnDanger" onClick={() => confirmReset()}>{t('common.confirm')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
