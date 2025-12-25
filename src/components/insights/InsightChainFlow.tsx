import { useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { InsightNode } from './InsightNode';
import { useInsightChain } from '@/contexts/InsightChainContext';
import { logger } from '../../utils/logger';
import { Loader } from 'lucide-react';
import { useInsightLoaderV2 } from '@/hooks/useInsightLoaderV2';
import { useInsightRefresh } from '@/hooks/useInsightRefresh';
import { InsightCardGrid } from './InsightCardGrid';
import { LocalModelProgress } from './LocalModelProgress';
import './InsightChainFlow.css';

interface InsightChainFlowProps {
    columns: string[];
    rowCount: number;
    sampleData?: any[];
    tableName?: string;
    fileName?: string;
    insightCache?: {
        isStale?: boolean;
        status?: string;
    };
    hideTitle?: boolean;
}

export function InsightChainFlow({ columns, rowCount, tableName, fileName, insightCache, hideTitle = false }: InsightChainFlowProps) {
    const { t } = useI18n();
    const {
        hypotheses,
        insights,
        activeHypothesisId,
        setHypotheses,
        toggleHypothesis,
        adoptChain,
    } = useInsightChain();

    // 使用 V2 Hook（包含完整质量门控）
    const {
        isLoading,
        isLoadingLocalModel,
        executionProgress,
        loadingStage, // 🆕 获取详细进度状态
        loadInsights,
        cancelLoading
    } = useInsightLoaderV2();

    // 加载洞察函数（V2 + 质量门控）
    const handleLoadInsights = async () => {
        logger.log('AI洞察', '使用V2增强模式（含双重质量门控）');
        const result = await loadInsights(columns, rowCount, tableName, fileName);
        setHypotheses(result);
    };

    // 使用智能刷新 Hook
    useInsightRefresh({
        hypothesesLength: hypotheses.length,
        tableName,
        insightCache,
        onRefresh: handleLoadInsights,
    });

    // Cleanup: 取消未完成的AI请求
    useEffect(() => {
        return () => {
            cancelLoading();
        };
    }, [cancelLoading]);

    // 初始化缓冲状态，防止"暂无数据"闪烁
    const [isInitializing, setIsInitializing] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const showInitializing = isInitializing && hypotheses.length === 0;
    const showEmpty = !isLoading && !isInitializing && hypotheses.length === 0;

    return (
        <div className="insight-chain-flow">
            {!hideTitle && (
                <h3 className="insight-chain-title">
                    {t('insightChain.title')}
                </h3>
            )}

            {/* 本地模型加载进度 */}
            {isLoadingLocalModel && <LocalModelProgress isLoading={isLoadingLocalModel} />}

            {/* 加载状态 + 执行进度 (覆盖 Initializing 阶段) */}
            {(isLoading || showInitializing) && !isLoadingLocalModel && (
                <div className="insight-loading-container">
                    <Loader size={32} className="spinning" />
                    <p>
                        {loadingStage
                            ? t(loadingStage, executionProgress || {})
                            : t(isLoading ? 'insightChain.loadingHypothesis' : 'analysis.initializing')
                        }
                    </p>
                    {executionProgress && (
                        <p className="insight-execution-progress">
                            {t('insightChain.analyzing')} {executionProgress.current}/{executionProgress.total}
                        </p>
                    )}
                </div>
            )}

            {/* AI假设生成失败/空状态提示 */}
            {showEmpty && (
                <div className="insight-empty-state">
                    <div className="insight-icon-wrapper">
                        <span className="insight-icon">✨</span>
                    </div>

                    <div className="insight-empty-text">
                        <h4 className="insight-ready-hint">
                            {t('analysis.readyHint')}
                        </h4>
                        <p className="insight-waiting-text">
                            {t('analysis.waitingForData')}
                        </p>
                    </div>

                    <button
                        className="btnPrimary insight-retry-btn"
                        onClick={() => window.location.reload()}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        {t('aiRetry.retryButton')}
                    </button>
                </div>
            )}

            {/* 假设卡片网格 */}
            {!isLoading && hypotheses.length > 0 && (
                <InsightCardGrid
                    hypotheses={hypotheses}
                    activeHypothesisId={activeHypothesisId}
                    onToggleHypothesis={toggleHypothesis}
                    onAdoptChain={adoptChain}
                />
            )}

            {/* 激活假设的洞察节点列表 */}
            {activeHypothesisId && (
                <div className="insight-results-container">
                    <h4 className="insight-results-title">
                        {t('insightChain.results')}
                    </h4>

                    {/* 洞察节点 */}
                    {insights
                        .filter(i => i.hypothesisId === activeHypothesisId)
                        .map(node => (
                            <InsightNode
                                key={node.id}
                                node={node}
                                onAdopt={() => adoptChain(activeHypothesisId)}
                                onIgnore={() => {
                                    // TODO: 实现忽略逻辑
                                }}
                            />
                        ))}
                </div>
            )}
        </div>
    );
}
