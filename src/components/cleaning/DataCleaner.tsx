import React, { useState } from 'react';
import { Sparkles, Play, CheckCircle2, RefreshCw, History, ChevronDown, ChevronUp } from 'lucide-react';

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
    const [expandedCategories, setExpandedCategories] = useState<Set<SuggestionCategory>>(new Set());

    const activeFile = project.files.find(f => f.id === activeFileId);

    // 使用建议生成Hook
    const { suggestions, loading: suggestionLoading, removeSuggestions } = useSuggestionGeneration(
        activeFile,
        cleaningTrigger || 0,
        aiSuggestions
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
    };

    // 展开/收起类别
    const toggleExpand = (category: SuggestionCategory) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    return (
        <div className="cleanerContainer">
            {/* AI建议面板 */}
            <div className="aiActionPanel">
                <div className="aiPanelHeader">
                    <div className="aiTitle"><Sparkles size={ICON_SIZE_LARGE} />{t('cleaning.aiSuggestions')}</div>
                    <div className="aiHeaderActions">
                        {suggestions.length > 0 && (
                            <button className="btnGhost" onClick={toggleSelectAll}>
                                <CheckCircle2 size={ICON_SIZE_MEDIUM} />
                                {selectedIds.length === suggestions.length ? t('cleaning.deselectAll') : t('cleaning.selectAll')}
                            </button>
                        )}
                        <button className="btnPrimary" onClick={handleApply} disabled={loading || selectedIds.length === 0}>
                            {loading ? <RefreshCw className="spin" size={ICON_SIZE_MEDIUM} /> : <Play size={ICON_SIZE_MEDIUM} />}
                            {t('cleaning.applySelected', { count: selectedIds.length })}
                        </button>
                    </div>
                </div>

                {/* 🚀 AI建议生成失败提示 */}
                {suggestionLoading === false && suggestions.length === 0 && (
                    <div style={{
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--warning)',
                        borderRadius: 'var(--radius-m)',
                        padding: 'var(--padding-card)',
                        margin: 'var(--gap-m)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--gap-m)',
                        color: 'var(--text-primary)',
                    }}>
                        <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center' }}>
                            ⚠️
                        </span>
                        <span style={{ flex: 1 }}>
                            {t('aiRetry.noSuggestionsHint')}
                        </span>
                        <button
                            className="btnPrimary"
                            onClick={() => window.location.reload()}
                            style={{
                                background: 'var(--color-retry-button)',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <RefreshCw size={14} />
                            {t('aiRetry.retryButton')}
                        </button>
                    </div>
                )}

                {suggestions.length === 0 && suggestionLoading === false ? (
                    <div className="aiEmpty"><CheckCircle2 size={ICON_SIZE_LARGE} />{t('cleaning.noSuggestions')}</div>
                ) : suggestions.length > 0 ? (
                    <div className="suggestionsByCategory">
                        {groupByCategory(suggestions).map(([category, items]) => {
                            const meta = CATEGORY_META[category as SuggestionCategory];
                            const isExpanded = expandedCategories.has(category as SuggestionCategory);
                            const CARDS_PER_ROW = 5;
                            const needsExpand = items.length > CARDS_PER_ROW;
                            const displayedItems = isExpanded ? items : items.slice(0, CARDS_PER_ROW);
                            const remainingCount = items.length - CARDS_PER_ROW;

                            return (
                                <div key={category} className="categoryRow">
                                    <div className="categoryHeader">
                                        <span className="categoryIcon">{meta.icon}</span>
                                        <span className="categoryName">{t(meta.nameKey as any)}</span>
                                        <span className="categoryCount">({items.length})</span>
                                    </div>
                                    <div className="cardRow">
                                        {displayedItems.map(s => {
                                            const isSelected = selectedIds.includes(s.id);
                                            return (
                                                <SuggestionCard
                                                    key={s.id}
                                                    suggestion={s}
                                                    isSelected={isSelected}
                                                    onToggle={toggleSugg}
                                                />
                                            );
                                        })}
                                        {needsExpand && (
                                            <button className="btnShowMore" onClick={() => toggleExpand(category as SuggestionCategory)}>
                                                {isExpanded ? (
                                                    <>
                                                        <ChevronUp size={ICON_SIZE_MEDIUM} />
                                                        {t('cleaning.showLess')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown size={ICON_SIZE_MEDIUM} />
                                                        {t('cleaning.showMore')}
                                                        <div className="moreCount">{t('cleaning.moreCount', { count: remainingCount })}</div>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </div>

            {/* 数据表格 */}
            <div className="cleanerGridWrapper">
                <DataViewer
                    key={activeFileId}
                    project={project}
                    activeFileId={activeFileId || undefined}
                    onProjectUpdate={onProjectUpdate}
                    onFileChange={setActiveFileId}
                />
            </div>

            {/* 历史记录 */}
            <div className="historyPanel">
                <div className="historyHeader">
                    <div className="historyTitle"><History size={ICON_SIZE_MEDIUM} />{t('cleaning.history')}</div>
                    {history.length > 0 && (
                        <button className="btnReset" onClick={() => confirmReset()} disabled={loading} title={t('cleaning.resetAll')}>
                            <RefreshCw size={ICON_SIZE_MEDIUM} />
                            {t('cleaning.resetAll')}
                        </button>
                    )}
                </div>
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

            {/* 重置确认对话框 */}
            {showResetConfirm && (
                <div className="confirmOverlay" onClick={cancelReset}>
                    <div className="confirmDialog" onClick={(e) => e.stopPropagation()}>
                        <h3 className="confirmTitle">
                            {t('cleaning.resetAll')}
                        </h3>
                        <p className="confirmMessage">
                            {t('cleaning.resetConfirm')}
                        </p>
                        <div className="confirmActions">
                            <button className="btnGhost" onClick={cancelReset}>
                                {t('common.cancel')}
                            </button>
                            <button className="btnDanger" onClick={() => confirmReset()}>
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
