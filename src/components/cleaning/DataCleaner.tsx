import React, { useState, useEffect } from 'react';

import { BottomPanel } from './components/BottomPanel';
import { useI18n } from '../../contexts/I18nContext';
import { DataViewerV2 as DataViewer } from '../data/DataViewerV2'; // 替换为 V2 组件但保留别名以减少改动
import {
    DataCleanerProps,
} from './types/cleaning.types';
import { useCleaningHistory } from './hooks/useCleaningHistory';
import { useSuggestionGeneration } from './hooks/useSuggestionGeneration';
import { useCleaningExecution } from './hooks/useCleaningExecution';
import { logger } from '../../utils/logger';
import './DataCleaner.css';

export const DataCleaner: React.FC<DataCleanerProps> = ({ project, cleaningTrigger, onProjectUpdate, aiSuggestions }) => {
    const { t } = useI18n();
    const [activeFileId, setActiveFileId] = useState<string | null>(project.files[0]?.id || null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [ignoredIds, setIgnoredIds] = useState<string[]>([]); // 忽略的建议ID列表
    const [refreshKey, setRefreshKey] = useState(0);
    const [expandedSqlIds, setExpandedSqlIds] = useState<string[]>([]); // 展开SQL的建议ID列表

    const activeFile = project.files.find(f => f.id === activeFileId);

    // 🔍 调试：追踪DataCleaner渲染和activeFile状态
    useEffect(() => {
        logger.log('数据清洗', 'DataCleaner渲染', {
            data: {
                activeFileId,
                hasActiveFile: !!activeFile,
                tableName: activeFile?.data?.tableName,
                rowCount: activeFile?.data?.rowCount,
                filesCount: project.files.length
            }
        });
    }, [activeFileId, activeFile, project.files.length]);

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

    // 切换单个SQL展开状态
    const toggleSql = (id: string) => {
        setExpandedSqlIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // 切换全局SQL展开状态
    const toggleAllSql = () => {
        // 过滤掉没有SQL的建议
        const suggestionsWithSql = suggestions.filter(s => s.sql);
        const allIds = suggestionsWithSql.map(s => s.id);

        // 如果当前展开数量等于总可展开数量，则全部收起；否则全部展开
        const isAllExpanded = expandedSqlIds.length === allIds.length && allIds.length > 0;

        if (isAllExpanded) {
            setExpandedSqlIds([]);
        } else {
            setExpandedSqlIds(allIds);
        }
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
            <BottomPanel
                suggestions={suggestions}
                history={history}
                selectedIds={selectedIds}
                ignoredIds={ignoredIds}
                loading={loading}
                suggestionLoading={suggestionLoading}
                aiProgressMsg={aiProgressMsg}
                hasAISuggestions={hasAISuggestions}
                aiGenerated={aiGenerated}
                error={error}
                activeFile={activeFile}
                expandedSqlIds={expandedSqlIds}
                onToggleSugg={toggleSugg}
                onToggleSelectAll={toggleSelectAll}
                onApply={handleApply}
                onIgnore={handleIgnore}
                onRefreshAI={refreshAISuggestions}
                onReset={confirmReset}
                onToggleAllSql={toggleAllSql}
                onToggleSql={toggleSql}
            />

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
