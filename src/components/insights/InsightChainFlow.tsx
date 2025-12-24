import { useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { InsightNode } from './InsightNode';
import { useInsightChain } from '@/contexts/InsightChainContext';
import { logger } from '../../utils/logger';
import { InsightNode as InsightNodeType } from '@/types/insightChain';
import { Loader } from 'lucide-react';
import { useInsightLoaderV2 } from '@/hooks/useInsightLoaderV2';
import { useInsightRefresh } from '@/hooks/useInsightRefresh';
import { InsightCardGrid } from './InsightCardGrid';
import { LocalModelProgress } from './LocalModelProgress';

interface InsightChainFlowProps {
    columns: string[];
    rowCount: number;
    sampleData?: any[];
    tableName?: string;
    insightCache?: {
        isStale?: boolean;
        status?: string;
    };
}

export function InsightChainFlow({ columns, rowCount, sampleData: _sampleData, tableName, insightCache }: InsightChainFlowProps) {
    const { t } = useI18n();
    const {
        hypotheses,
        insights,
        activeHypothesisId,
        setHypotheses,
        addInsightNode,
        toggleHypothesis,
        adoptChain,
    } = useInsightChain();

    // 使用 V2 Hook（包含完整质量门控）
    const { isLoading, isLoadingLocalModel, executionProgress, loadInsights, cancelLoading } = useInsightLoaderV2();

    // 加载洞察函数（V2 + 质量门控）
    const handleLoadInsights = async () => {
        logger.log('AI洞察', '使用V2增强模式（含双重质量门控）');
        const result = await loadInsights(columns, rowCount, tableName);
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

    // 自动生成首个洞察节点（点击假设卡后）
    useEffect(() => {
        if (activeHypothesisId) {
            const existingInsights = insights.filter(i => i.hypothesisId === activeHypothesisId);
            if (existingInsights.length === 0) {
                logger.log('AI洞察', '自动生成Mock洞察节点', { data: { hypothesisId: activeHypothesisId } });
                // 自动生成一个 Mock 洞察节点
                const mockNode: InsightNodeType = {
                    id: `insight - ${Date.now()} `,
                    hypothesisId: activeHypothesisId,
                    chartType: 'table',
                    tableData: [
                        { 字段名: 'age', 缺失率: '12%', 异常值: 3 },
                        { 字段名: 'salary', 缺失率: '5%', 异常值: 8 },
                        { 字段名: 'department', 缺失率: '0%', 异常值: 0 },
                    ],
                    conclusion: '经过初步分析，发现 age 字段缺失率较高(12%)，建议补全；salary 字段存在 8 个异常值，需进一步检查。',
                    code: '# 数据质量分析示例\nimport pandas as pd\n\n# 计算缺失率\nmissing_rate = df.isnull().sum() / len(df) * 100\nprint(missing_rate)\n\n# 检测异常值（使用IQR方法）\nQ1 = df.quantile(0.25)\nQ3 = df.quantile(0.75)\nIQR = Q3 - Q1\noutliers = ((df < (Q1 - 1.5 * IQR)) | (df > (Q3 + 1.5 * IQR))).sum()\nprint(outliers)',
                    codeLanguage: 'python',
                    timestamp: Date.now(),
                    isAdopted: false,
                };
                addInsightNode(mockNode);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeHypothesisId]);

    return (
        <div style={{ padding: 'var(--gap-m)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--gap-m)' }}>
                {t('insightChain.title')}
            </h3>

            {/* 本地模型加载进度 */}
            {isLoadingLocalModel && <LocalModelProgress isLoading={isLoadingLocalModel} />}

            {/* 加载状态 + 执行进度 */}
            {isLoading && !isLoadingLocalModel && (
                <div style={{ textAlign: 'center', padding: 'var(--gap-xl)', color: 'var(--text-secondary)' }}>
                    <Loader size={32} className="spinning" />
                    <p>{t('insightChain.loadingHypothesis')}</p>
                    {executionProgress && (
                        <p style={{ marginTop: 'var(--gap-s)', fontSize: 'var(--fs-s)', color: 'var(--primary)' }}>
                            正在执行洞察分析... {executionProgress.current}/{executionProgress.total}
                        </p>
                    )}
                </div>
            )}

            {/* AI假设生成失败提示 */}
            {!isLoading && hypotheses.length === 0 && (
                <div style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--warning)',
                    borderRadius: 'var(--radius-m)',
                    padding: 'var(--padding-card)',
                    marginBottom: 'var(--gap-m)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--gap-m)',
                    color: 'var(--text-primary)',
                }}>
                    <span style={{ color: 'var(--warning)', fontSize: '20px' }}>⚠️</span>
                    <span style={{ flex: 1 }}>
                        {t('insightChain.noHypotheses')}
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
                <div style={{ marginTop: 'var(--gap-l)' }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--gap-m)' }}>
                        {t('insightChain.noInsights').replace('暂无', '')}
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
