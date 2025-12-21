/**
 * 洞察卡片网格组件
 * 负责：假设卡片列表渲染、执行结果展示、采纳按钮
 */
import { HypothesisCard } from './HypothesisCard';
import { HypothesisCard as HypothesisCardType } from '@/types/insightChain';
import { logger } from '@/utils/logger';

interface InsightCardGridProps {
    hypotheses: HypothesisCardType[];
    activeHypothesisId: string | null;
    onToggleHypothesis: (id: string) => void;
    onAdoptChain: (id: string) => void;
}

export function InsightCardGrid({
    hypotheses,
    activeHypothesisId,
    onToggleHypothesis,
    onAdoptChain,
}: InsightCardGridProps) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--gap-m)',
                marginBottom: 'var(--gap-l)',
            }}
        >
            {hypotheses.map(hyp => (
                <div key={hyp.id} style={{
                    background: 'var(--bg-panel)',
                    borderRadius: 'var(--radius-m)',
                    border: `1px solid ${hyp.executionStatus === 'success' ? 'var(--success)' : 'var(--border)'}`,
                    overflow: 'hidden'
                }}>
                    {/* 卡片头部 */}
                    <HypothesisCard
                        hypothesis={hyp}
                        isActive={activeHypothesisId === hyp.id}
                        onClick={() => onToggleHypothesis(hyp.id)}
                    />

                    {/* 执行结果展示（点击展开后） */}
                    {hyp.isExpanded && hyp.executionResult && (
                        <div style={{ padding: 'var(--padding-card)', borderTop: '1px solid var(--border)' }}>
                            {/* 图表 */}
                            <img
                                src={hyp.executionResult.image}
                                alt="洞察分析图表"
                                style={{ width: '100%', borderRadius: 'var(--radius-s)', marginBottom: 'var(--gap-m)' }}
                            />

                            {/* 统计摘要 */}
                            <p style={{
                                color: 'var(--text-secondary)',
                                fontSize: 'var(--fs-s)',
                                marginBottom: 'var(--gap-m)',
                                lineHeight: 1.6
                            }}>
                                {hyp.executionResult.summary}
                            </p>

                            {/* 代码 */}
                            <details style={{ marginBottom: 'var(--gap-m)' }}>
                                <summary style={{
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    fontSize: 'var(--fs-s)'
                                }}>
                                    查看Python代码
                                </summary>
                                <pre style={{
                                    background: 'var(--bg-hover)',
                                    padding: 'var(--gap-s)',
                                    borderRadius: 'var(--radius-s)',
                                    fontSize: 'var(--fs-s)',
                                    overflow: 'auto',
                                    marginTop: 'var(--gap-s)'
                                }}>
                                    <code>{hyp.executionResult.code}</code>
                                </pre>
                            </details>

                            {/* 采纳按钮 */}
                            <button
                                className="btnPrimary"
                                onClick={() => {
                                    logger.log('UI', '用户采纳洞察', { data: hyp.title });
                                    onAdoptChain(hyp.id);
                                }}
                                style={{
                                    width: '100%',
                                    background: 'var(--success)',
                                    padding: 'var(--gap-s)',
                                    fontSize: 'var(--fs-s)'
                                }}
                            >
                                ✓ 采纳此洞察
                            </button>
                        </div>
                    )}

                    {/* 执行错误提示 */}
                    {hyp.executionStatus === 'error' && hyp.isExpanded && (
                        <div style={{
                            padding: 'var(--padding-card)',
                            borderTop: '1px solid var(--border)',
                            color: 'var(--warning)'
                        }}>
                            ⚠️ 此洞察执行失败，请稍后重试
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
