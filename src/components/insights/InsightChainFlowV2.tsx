/**
 * InsightChainFlowV2 组件
 * 基于 Prompt Library 的洞察分析流程
 * 
 * 设计文档: docs/04-技术专题/64-技术专题-Prompt库MVP功能设计总纲.md
 * 时序图: docs/01-架构设计/11-架构设计-洞察建议Prompt库时序图.md
 */

import { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/utils/logger';
import { Loader, Sparkles, RefreshCw } from 'lucide-react';
import { usePromptExecution } from '@/hooks/usePromptExecution';
import { InsightTreeNode } from './InsightTreeNode';
import { ActionChip } from './ActionChip';
import { LocalModelProgress } from './LocalModelProgress';
import './InsightChainFlow.css';

// ========== Props 定义 ==========

interface InsightChainFlowV2Props {
    /** 列名列表 */
    columns: string[];
    /** 行数 */
    rowCount: number;
    /** 数据集摘要 (JSON 字符串) */
    dfSummary?: string;
    /** 表名 */
    tableName?: string;
    /** 文件名 */
    fileName?: string;
    /** 是否隐藏标题 */
    hideTitle?: boolean;
    /** 调用 AI 的函数 */
    callAI: (prompt: string) => Promise<string>;
    /** 执行 Python 代码的函数 */
    executePython?: (code: string) => Promise<{ image?: string; output?: string }>;
    /** 是否正在加载本地模型 */
    isLoadingLocalModel?: boolean;
}

// ========== 组件实现 ==========

export function InsightChainFlowV2({
    columns,
    rowCount,
    dfSummary,
    tableName,
    fileName,
    hideTitle = false,
    callAI,
    executePython,
    isLoadingLocalModel = false
}: InsightChainFlowV2Props) {
    const { t } = useI18n();

    // 使用 Prompt 执行 Hook
    const {
        insightChain,
        isLoadingRecommendations,
        isExecuting,
        loadRecommendations,
        executeRecommendation,
        executeDrillDown,
        executeCustomAnalysis,
        reset
    } = usePromptExecution({ callAI, executePython });

    // 初始化状态
    const [isInitialized, setIsInitialized] = useState(false);

    // 生成数据集摘要
    const generateSummary = useCallback(() => {
        if (dfSummary) return dfSummary;

        // 简化版摘要
        return JSON.stringify({
            columns: columns,
            row_count: rowCount,
            table_name: tableName || 'unknown',
            file_name: fileName || 'unknown'
        }, null, 2);
    }, [dfSummary, columns, rowCount, tableName, fileName]);

    // 初始化时加载推荐
    useEffect(() => {
        if (!isInitialized && columns.length > 0 && !isLoadingLocalModel) {
            setIsInitialized(true);
            const summary = generateSummary();
            logger.log('AI服务', '初始化 Prompt 库洞察流程');
            loadRecommendations(summary, columns);
        }
    }, [isInitialized, columns, isLoadingLocalModel, generateSummary, loadRecommendations]);

    // 表名变化时重新加载
    useEffect(() => {
        if (isInitialized && tableName) {
            reset();
            setIsInitialized(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableName]);

    // 刷新推荐
    const handleRefresh = useCallback(() => {
        reset();
        const summary = generateSummary();
        loadRecommendations(summary, columns);
    }, [reset, generateSummary, loadRecommendations, columns]);

    // 切换节点展开状态
    const handleToggleExpand = useCallback((nodeId: string) => {
        // TODO: 实现展开/折叠逻辑 (当前直接更新 insightChain)
        logger.log('UI', `切换节点展开: ${nodeId}`);
    }, []);

    // ========== 渲染逻辑 ==========

    const showLoading = isLoadingRecommendations || isLoadingLocalModel;
    const showEmpty = !showLoading && insightChain.recommendations.length === 0 && insightChain.rootCards.length === 0;
    const showRecommendations = !showLoading && insightChain.recommendations.length > 0;
    const showResults = insightChain.rootCards.length > 0;

    return (
        <div className="insight-chain-flow insight-chain-flow--v2">
            {/* 标题 */}
            {!hideTitle && (
                <div className="insight-chain-header">
                    <h3 className="insight-chain-title">
                        <Sparkles size={18} />
                        {t('insightChain.title')}
                    </h3>
                    {showResults && (
                        <button
                            className="insight-refresh-btn"
                            onClick={handleRefresh}
                            disabled={isLoadingRecommendations}
                            title={t('aiRetry.retryButton')}
                        >
                            <RefreshCw size={14} className={isLoadingRecommendations ? 'spinning' : ''} />
                        </button>
                    )}
                </div>
            )}

            {/* 本地模型加载进度 */}
            {isLoadingLocalModel && <LocalModelProgress isLoading={isLoadingLocalModel} />}

            {/* 加载状态 */}
            {isLoadingRecommendations && !isLoadingLocalModel && (
                <div className="insight-loading-container">
                    <Loader size={32} className="spinning" />
                    <p>{t('insightChain.loadingHypothesis')}</p>
                </div>
            )}

            {/* 空状态 */}
            {showEmpty && (
                <div className="insight-empty-state">
                    <div className="insight-icon-wrapper">
                        <span className="insight-icon">✨</span>
                    </div>
                    <div className="insight-empty-text">
                        <h4 className="insight-ready-hint">{t('analysis.readyHint')}</h4>
                        <p className="insight-waiting-text">{t('analysis.waitingForData')}</p>
                    </div>
                    <button className="btnPrimary insight-retry-btn" onClick={handleRefresh}>
                        <RefreshCw size={14} />
                        {t('aiRetry.retryButton')}
                    </button>
                </div>
            )}

            {/* L1 推荐区 (初始推荐) */}
            {showRecommendations && insightChain.rootCards.length === 0 && (
                <div className="insight-recommendations">
                    <p className="insight-recommendations-label">
                        {t('insight.recommendedActions')}
                    </p>
                    <div className="insight-recommendations-chips">
                        {insightChain.recommendations.map((rec, index) => (
                            <ActionChip
                                key={`${rec.promptId}-${index}`}
                                label={rec.reason}
                                onClick={() => executeRecommendation(rec)}
                                isRecommended={true}
                                disabled={isExecuting}
                                isLoading={isExecuting}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 结果树 (已执行的洞察节点) */}
            {showResults && (
                <div className="insight-results-container">
                    <h4 className="insight-results-title">{t('insightChain.results')}</h4>

                    {insightChain.rootCards.map(node => (
                        <InsightTreeNode
                            key={node.id}
                            node={node}
                            availableColumns={columns}
                            onDrillDown={executeDrillDown}
                            onCustomAnalysis={executeCustomAnalysis}
                            onToggleExpand={handleToggleExpand}
                            isExecuting={isExecuting}
                        />
                    ))}

                    {/* 继续推荐区 (已有结果后显示新推荐) */}
                    {insightChain.recommendations.length > 0 && (
                        <div className="insight-recommendations insight-recommendations--continue">
                            <p className="insight-recommendations-label">
                                {t('insight.recommendedActions')}
                            </p>
                            <div className="insight-recommendations-chips">
                                {insightChain.recommendations.slice(0, 3).map((rec, index) => (
                                    <ActionChip
                                        key={`continue-${rec.promptId}-${index}`}
                                        label={rec.reason}
                                        onClick={() => executeRecommendation(rec)}
                                        isRecommended={true}
                                        disabled={isExecuting}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
