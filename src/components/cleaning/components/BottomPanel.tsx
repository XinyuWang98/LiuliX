import { useState } from 'react';
import { Sparkles, History, CheckCircle2, Play, RefreshCw, X, Code2, ChevronDown, ChevronRight } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

import { LiuliButton } from '@/components/common/liulix/LiuliButton';
import { SuggestionsTab } from './SuggestionsTab';
import { HistoryTab } from './HistoryTab';
import { SimpleSuggestion, HistoryItem, ProjectFile } from '../types/cleaning.types';
import './BottomPanel.css';

interface BottomPanelProps {
    suggestions: SimpleSuggestion[];
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
    expandedSqlIds?: string[];
    onToggleSugg: (id: string) => void;
    onToggleSelectAll: () => void;
    onToggleAllSql?: () => void;
    onToggleSql?: (id: string) => void;
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
    expandedSqlIds = [],
    onToggleSugg,
    onToggleSelectAll,
    onToggleAllSql,
    onToggleSql,
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
                <LiuliButton
                    variant={bottomPanelTab === 'suggestions' ? 'secondary' : 'ghost'}
                    size="md"
                    className={`bottomModuleTab ${bottomPanelTab === 'suggestions' ? 'active' : ''}`}
                    onClick={() => setBottomPanelTab('suggestions')}
                    leftIcon={<Sparkles size={16} />}
                >
                    {t('cleaning.cleaningSuggestions')}
                    {suggestions.length > 0 && <span className="tabBadge">{suggestions.length}</span>}
                </LiuliButton>
                <LiuliButton
                    variant={bottomPanelTab === 'history' ? 'secondary' : 'ghost'}
                    size="md"
                    className={`bottomModuleTab ${bottomPanelTab === 'history' ? 'active' : ''}`}
                    onClick={() => setBottomPanelTab('history')}
                    leftIcon={<History size={16} />}
                >
                    {t('cleaning.history')}
                    {history.length > 0 && <span className="tabBadge">{history.length}</span>}
                </LiuliButton>

                {/* 全局操作按钮区域 */}
                <div className="bottomModuleActions">
                    {bottomPanelTab === 'suggestions' && suggestions.length > 0 && (
                        <>
                            {/* 全局SQL展开/收起按钮 */}
                            {onToggleAllSql && suggestions.some(s => s.sql) && (
                                <LiuliButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={onToggleAllSql}
                                    disabled={loading}
                                    title={expandedSqlIds.length > 0 && expandedSqlIds.length === suggestions.filter(s => s.sql).length ? t('cleaning.collapseSql') : t('cleaning.expandSql')}
                                    leftIcon={<Code2 size={14} />}
                                >
                                    {expandedSqlIds.length > 0 && expandedSqlIds.length === suggestions.filter(s => s.sql).length ? (
                                        <>
                                            <span>{t('cleaning.collapseSql')}</span>
                                            <ChevronDown size={14} />
                                        </>
                                    ) : (
                                        <>
                                            <span>{t('cleaning.expandSql')}</span>
                                            <ChevronRight size={14} />
                                        </>
                                    )}
                                </LiuliButton>
                            )}

                            <LiuliButton
                                variant="secondary"
                                size="sm"
                                onClick={onToggleSelectAll}
                                disabled={loading}
                                leftIcon={<CheckCircle2 size={14} />}
                            >
                                {selectedIds.length === suggestions.filter(s => !ignoredIds.includes(s.id)).length
                                    ? t('cleaning.deselectAll')
                                    : t('cleaning.selectAll')}
                            </LiuliButton>
                            <LiuliButton
                                variant="primary"
                                size="sm"
                                className="btnApply"
                                onClick={onApply}
                                disabled={loading || selectedIds.length === 0}
                                isLoading={loading}
                                leftIcon={!loading && <Play size={14} />}
                            >
                                {t('cleaning.applySelected', { count: selectedIds.length })}
                            </LiuliButton>
                            <LiuliButton
                                variant="danger"
                                size="sm"
                                onClick={onIgnore}
                                disabled={loading || selectedIds.length === 0}
                                leftIcon={<X size={14} />}
                            >
                                {t('cleaning.ignore')}
                            </LiuliButton>
                        </>
                    )}
                    {bottomPanelTab === 'history' && history.length > 0 && (
                        <LiuliButton
                            variant="secondary"
                            size="sm"
                            className="btnReset"
                            onClick={onReset}
                            disabled={loading}
                            leftIcon={<RefreshCw size={14} />}
                        >
                            {t('cleaning.resetAll')}
                        </LiuliButton>
                    )}
                    {bottomPanelTab === 'suggestions' && (
                        <LiuliButton
                            variant="primary"
                            size="sm"
                            className={hasAISuggestions ? 'aiRefreshBtn' : 'aiGenerateBtn'}
                            onClick={onRefreshAI}
                            disabled={loading}
                            title={hasAISuggestions ? t('cleaning.refreshAI') : t('cleaning.generateAI')}
                            isLoading={loading}
                            leftIcon={!loading && (hasAISuggestions ? <RefreshCw size={14} /> : <Sparkles size={14} />)}
                        >
                            {hasAISuggestions ? t('cleaning.refreshAI') : t('cleaning.generateAI')}
                        </LiuliButton>
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
                        expandedSqlIds={expandedSqlIds}
                        onToggleSugg={onToggleSugg}
                        onToggleSql={onToggleSql}
                    />
                ) : (
                    <HistoryTab history={history} />
                )}
            </div>
        </div>
    );
}

