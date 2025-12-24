import React, { useState } from 'react';
import { Sparkles, Play, CheckCircle2, RefreshCw, History, X } from 'lucide-react';

import { SuggestionCard } from './components/SuggestionCard';
import { useI18n } from '../../contexts/I18nContext';
import { DataViewer } from '../data/DataViewer';
import { AILoading } from '../common/AILoading';
import {
    DataCleanerProps,
    SuggestionCategory,
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
    const [ignoredIds, setIgnoredIds] = useState<string[]>([]); // 忽略的建议ID列表
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [bottomPanelTab, setBottomPanelTab] = useState<'suggestions' | 'history'>('suggestions');

    const activeFile = project.files.find(f => f.id === activeFileId);

    // 使用建议生成Hook
    const {
        suggestions,
        loading: suggestionLoading,
        aiProgressMsg,
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
        confirmReset: originalConfirmReset,
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

    // 重置时同时清空忽略状态
    const confirmReset = () => {
        setIgnoredIds([]); // 清空忽略列表
        setSelectedIds([]); // 清空选中列表
        originalConfirmReset();
    };

    const loading = suggestionLoading || executionLoading;

    // 切换建议选中状态
    const toggleSugg = (id: string) => {
        // 如果建议已被忽略，不允许被选中
        if (ignoredIds.includes(id)) return;

        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // 全选/取消全选
    const toggleSelectAll = () => {
        // 过滤掉已忽略的建议
        const validSuggestions = suggestions.filter(s => !ignoredIds.includes(s.id));

        if (selectedIds.length === validSuggestions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(validSuggestions.map(s => s.id));
        }
    };

    // 忽略选中的建议
    const handleIgnore = () => {
        // 将选中的建议添加到忽略列表
        setIgnoredIds(prev => [...new Set([...prev, ...selectedIds])]);
        // 清空选中状态
        setSelectedIds([]);
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
                                <button
                                    className="btnPanelAction btnIgnore"
                                    onClick={handleIgnore}
                                    disabled={loading || selectedIds.length === 0}
                                >
                                    <X size={14} />
                                    {t('cleaning.ignore')}
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
                                        console.log('DataCleaner Render:', { suggestionLoading, executionLoading, count: suggestions.length });
                                        // 优先级 1: 加载状态 (AI生成) - 覆盖在列表之上
                                        if (suggestionLoading) return (
                                            <AILoading visible={true} message={aiProgressMsg} />
                                        );

                                        // 优先级 1.1: 执行状态 (应用/重置)
                                        if (executionLoading) return (
                                            <div className="aiEmpty">
                                                <RefreshCw className="spin" size={ICON_SIZE_LARGE} style={{ color: 'var(--primary)' }} />
                                                <div className="emptyText">{t('cleaning.processing')}</div>
                                            </div>
                                        );

                                        // 优先级 2: 显示列表
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
                                                                isIgnored={ignoredIds.includes(s.id)}
                                                                onToggle={toggleSugg}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // 优先级 3: 其他空状态
                                        if (history.length > 0) return (
                                            <div className="aiEmpty">
                                                <CheckCircle2 size={ICON_SIZE_LARGE} style={{ color: 'var(--success)' }} />
                                                <div className="emptyText">{t('cleaning.allApplied')}</div>
                                            </div>
                                        );
                                        if (error) return (
                                            <div className="aiEmpty">
                                                <span style={{ fontSize: '32px' }}>⚠️</span>
                                                <div className="emptyText" style={{ color: 'var(--warning)' }}>{t('cleaning.serviceUnavailable')}</div>
                                            </div>
                                        );
                                        if (aiGenerated) return (
                                            <div className="aiEmpty">
                                                <Sparkles size={ICON_SIZE_LARGE} style={{ color: 'var(--primary)' }} />
                                                <div className="emptyText">{t('cleaning.dataGood')}</div>
                                            </div>
                                        );
                                        return (
                                            <div className="aiEmpty state-initial">
                                                <div className="emptyIconWrapper">
                                                    <Sparkles size={24} style={{ color: 'var(--primary)' }} />
                                                </div>
                                                <div className="emptyText">{t('cleaning.tryAI') || '暂无规则建议，试试让 AI 深度分析？'}</div>
                                            </div>
                                        );
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
