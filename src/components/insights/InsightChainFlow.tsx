import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { HypothesisCard } from './HypothesisCard';
import { InsightNode } from './InsightNode';
import { DeepDiveInput } from './DeepDiveInput';
import { useInsightChain } from '@/contexts/InsightChainContext';
import { generateInsight } from '@/services/aiService';
import { HypothesisCard as HypothesisCardType, InsightNode as InsightNodeType } from '@/types/insightChain';
import { Loader } from 'lucide-react';
import { sampleDataForAI } from '@/utils/sampleData';
import { generateHypotheses } from '@/services/aiService';

interface InsightChainFlowProps {
    columns: string[];
    rowCount: number;
    sampleData?: any[];
    tableName?: string; // 🚀 新增：用于采样查询
    insightCache?: { // 🚀 新增：用于智能刷新判断
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

    const [isLoadingHypotheses, setIsLoadingHypotheses] = useState(false);
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);

    // 🟢 P0修复：防Strict Mode双重调用
    const loadedOnceRef = useRef(false);
    const prevDepsRef = useRef({ hypotheses: 0, isStale: undefined as boolean | undefined });

    // 初始化 + 智能刷新：生成假设（首次加载 OR 数据清洗后isStale=true）
    useEffect(() => {
        console.log('🔍 InsightChainFlow mounted/updated, hypotheses.length:', hypotheses.length);

        // 🚀 判断是否需要刷新
        const 需要刷新 =
            hypotheses.length === 0 ||  // 场景1：无缓存假设
            (insightCache?.isStale === true);  // 场景2：数据已清洗，标记为过时

        // 🚀 防重复：检查status不为pending（避免并发调用）
        const 可以执行 = insightCache?.status !== 'pending';

        if (需要刷新 && 可以执行) {
            // 🟢 检测依赖是否真正变化
            const depsChanged =
                prevDepsRef.current.hypotheses !== hypotheses.length ||
                prevDepsRef.current.isStale !== insightCache?.isStale;

            // 🟢 仅在Strict Mode双重调用时阻止（依赖未变）
            if (!depsChanged && loadedOnceRef.current) {
                console.log('[InsightChainFlow] ⏭️ Strict Mode重复调用已拦截');
                return;
            }

            console.log('[洞察链] 🔄 触发刷新:', {
                原因: hypotheses.length === 0 ? '无缓存' : 'isStale=true',
                isStale: insightCache?.isStale,
                status: insightCache?.status,
                depsChanged
            });

            loadedOnceRef.current = true;
            prevDepsRef.current = {
                hypotheses: hypotheses.length,
                isStale: insightCache?.isStale
            };

            loadHypotheses();
        } else if (需要刷新 && !可以执行) {
            console.log('[洞察链] ⏸️ 刷新被阻止（防重复）:', { status: insightCache?.status });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        hypotheses.length,
        insightCache?.isStale,
        insightCache?.status
    ]);

    const loadHypotheses = async () => {
        setIsLoadingHypotheses(true);

        try {
            // 🚀 步骤1：准备采样数据
            let 采样数据: any[] = [];
            if (tableName) {
                try {
                    const { sampledData, metadata } = await sampleDataForAI(tableName, 1000);
                    console.log('[洞察链] 🎯 使用采样数据:', metadata);
                    采样数据 = sampledData;
                } catch (采样错误) {
                    console.warn('[洞察链] ⚠️ 采样失败:', 采样错误);
                }
            } else {
                console.log('[洞察链] 📊 tableName未提供，跳过采样');
            }

            // 🚀 步骤2：调用AI生成假设（代理已就绪）
            console.log('[洞察链] 🤖 调用AI生成假设...');
            const 生成结果 = await generateHypotheses({
                columns: columns || [],
                rowCount: rowCount || 0,
                sampleData: 采样数据
            });

            // 🚀 步骤3：转换为卡片格式
            const 假设卡片: HypothesisCardType[] = 生成结果.map((h, idx) => ({
                id: `hyp-ai-${Date.now()}-${idx}`,
                title: h.assumption,
                description: h.verification,
                verificationMethod: h.verification,
                isExpanded: false,
            }));

            setHypotheses(假设卡片);
            console.log('[洞察链] ✅ AI假设生成成功:', 假设卡片.length, '条');

        } catch (AI错误) {
            // 🚀 步骤4：AI失败降级到Mock数据（保证UI不崩溃）
            console.error('[洞察链] 🚫 AI生成失败，使用Mock兜底:', AI错误);

            const mockHypotheses: HypothesisCardType[] = [
                {
                    id: 'hyp-mock-0',
                    title: '数值字段存在异常值 (Mock)',
                    description: '数据中可能存在超出正常范围的异常值，影响统计分析准确性',
                    verificationMethod: '使用箱线图检测异常值分布',
                    isExpanded: false,
                },
                {
                    id: 'hyp-mock-1',
                    title: '关键字段缺失率偏高 (Mock)',
                    description: '部分重要字段的缺失比例超过阈值，需要补全或删除',
                    verificationMethod: '计算各字段缺失率并可视化',
                    isExpanded: false,
                },
                {
                    id: 'hyp-mock-2',
                    title: '数据存在时间趋势 (Mock)',
                    description: '时间序列数据可能存在明显的上升或下降趋势',
                    verificationMethod: '绘制时间序列折线图观察趋势',
                    isExpanded: false,
                },
            ];

            setHypotheses(mockHypotheses);
        } finally {
            setIsLoadingHypotheses(false);
        }
    };

    // 自动生成首个洞察节点（点击假设卡后）
    useEffect(() => {
        if (activeHypothesisId) {
            const existingInsights = insights.filter(i => i.hypothesisId === activeHypothesisId);
            if (existingInsights.length === 0) {
                console.log('🎯 自动生成Mock洞察节点 for hypothesis:', activeHypothesisId);
                // 自动生成一个 Mock 洞察节点
                const mockNode: InsightNodeType = {
                    id: `insight-${Date.now()}`,
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
    }, [activeHypothesisId]); // 监听 activeHypothesisId


    const handleDeepDive = async (hypothesisId: string, instruction: string) => {
        setIsLoadingInsight(true);
        try {
            const hypothesis = hypotheses.find(h => h.id === hypothesisId);
            if (!hypothesis) return;

            const result = await generateInsight(
                hypothesis.title,
                columns,
                instruction,
                'python'
            );

            if (result) {
                const node: InsightNodeType = {
                    id: `insight-${Date.now()}`,
                    hypothesisId,
                    chartType: result.chartType || 'table',
                    chartData: result.chartData,
                    tableData: result.tableData,
                    conclusion: result.conclusion || '暂无结论',
                    code: result.code || '# 暂无代码',
                    codeLanguage: result.codeLanguage || 'python',
                    timestamp: Date.now(),
                    isAdopted: false,
                };
                addInsightNode(node);
            }
        } catch (error) {
            console.error('生成洞察失败', error);
            // Fallback: Mock 洞察
            const mockNode: InsightNodeType = {
                id: `insight-${Date.now()}`,
                hypothesisId,
                chartType: 'table',
                tableData: [
                    { 字段: 'age', 平均值: 32.5 },
                    { 字段: 'salary', 平均值: 75000 },
                ],
                conclusion: '数据分析结果显示：年龄与薪资呈正相关',
                code: '# Mock 代码\nimport pandas as pd\ndf.describe()',
                codeLanguage: 'python',
                timestamp: Date.now(),
                isAdopted: false,
            };
            addInsightNode(mockNode);
        } finally {
            setIsLoadingInsight(false);
        }
    };

    return (
        <div style={{ padding: 'var(--gap-m)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--gap-m)' }}>
                {t('insightChain.title')}
            </h3>

            {/* 加载状态 */}
            {isLoadingHypotheses && (
                <div style={{ textAlign: 'center', padding: 'var(--gap-xl)', color: 'var(--text-secondary)' }}>
                    <Loader size={32} className="spinning" />
                    <p>{t('insightChain.loadingHypothesis')}</p>
                </div>
            )}

            {/* 🚀 AI假设生成失败提示 */}
            {!isLoadingHypotheses && hypotheses.length === 0 && (
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

            {/* 假设卡片（横排3列） */}
            {!isLoadingHypotheses && hypotheses.length > 0 && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 'var(--gap-m)',
                        marginBottom: 'var(--gap-l)',
                    }}
                >
                    {hypotheses.map(hyp => (
                        <HypothesisCard
                            key={hyp.id}
                            hypothesis={hyp}
                            isActive={activeHypothesisId === hyp.id}
                            onClick={() => toggleHypothesis(hyp.id)}
                        />
                    ))}
                </div>
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

                    {/* 深挖输入框 */}
                    <DeepDiveInput
                        hypothesisId={activeHypothesisId}
                        onSubmit={(instruction) => handleDeepDive(activeHypothesisId, instruction)}
                    />

                    {isLoadingInsight && (
                        <div style={{ textAlign: 'center', padding: 'var(--gap-m)', color: 'var(--text-secondary)' }}>
                            <Loader size={24} className="spinning" />
                            <p>{t('insightChain.loading')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
