import { createContext, useContext, useState, ReactNode } from 'react';
import { HypothesisCard, InsightNode, InsightChain } from '@/types/insightChain';
import { useEvidence } from './EvidenceContext';
import { useAnalysisContext } from './AnalysisContext'; // 🆕 EDA 闭环
import { extractAdoptedInsight } from '@/utils/insightExtractor'; // 🆕 EDA 闭环
import { isFeatureEnabled } from '@/config/featureFlags'; // 🆕 EDA 闭环
import { logger } from '@/utils/logger';

interface InsightChainContextType {
    hypotheses: HypothesisCard[];
    insights: InsightNode[];
    activeHypothesisId: string | null;
    setHypotheses: (hypotheses: HypothesisCard[]) => void;
    addInsightNode: (node: InsightNode) => void;
    updateInsightNode: (id: string, updates: Partial<InsightNode>) => void; // 🆕 支持更新节点
    toggleHypothesis: (hypothesisId: string) => void;
    adoptChain: (hypothesisId: string) => void;
    adoptInsight: (node: InsightNode) => Promise<void>; // 🆕 EDA 闭环
    resetChain: () => void;
}

const InsightChainContext = createContext<InsightChainContextType | null>(null);

export function InsightChainProvider({ children }: { children: ReactNode }) {
    const [hypotheses, setHypotheses] = useState<HypothesisCard[]>([]);
    const [insights, setInsights] = useState<InsightNode[]>([]);
    const [activeHypothesisId, setActiveHypothesisId] = useState<string | null>(null);
    const { addRecord } = useEvidence();
    const { addAdoptedInsight } = useAnalysisContext(); // 🆕 EDA 闭环

    const addInsightNode = (node: InsightNode) => {
        setInsights(prev => [...prev, node]);
    };

    // 🆕 支持更新节点
    const updateInsightNode = (id: string, updates: Partial<InsightNode>) => {
        setInsights(prev =>
            prev.map(node => node.id === id ? { ...node, ...updates } : node)
        );
    };

    const toggleHypothesis = (hypothesisId: string) => {
        setHypotheses(prev =>
            prev.map(h =>
                h.id === hypothesisId ? { ...h, isExpanded: !h.isExpanded } : h
            )
        );
        setActiveHypothesisId(hypothesisId);
    };

    const adoptChain = (hypothesisId: string) => {
        const hypothesis = hypotheses.find(h => h.id === hypothesisId);
        if (!hypothesis) return;

        const chainInsights = insights.filter(
            i => i.hypothesisId === hypothesisId && !i.isAdopted
        );

        if (chainInsights.length === 0) return;

        const insightChain: InsightChain = {
            hypothesis,
            insights: chainInsights,
            isAdopted: true,
            timestamp: Date.now(),
        };

        addRecord({
            type: 'insightChain',
            title: `洞察链：${hypothesis.title}`,
            description: `假设："${hypothesis.title}"，包含 ${chainInsights.length} 个洞察节点`,
            tags: ['洞察链', '分析假设'],
            metadata: { insightChain },
        });

        setInsights(prev =>
            prev.map(i =>
                i.hypothesisId === hypothesisId ? { ...i, isAdopted: true } : i
            )
        );

        logger.log('UI', '洞察链已采纳', { data: insightChain });
    };

    /**
     * 🆕 EDA 闭环：采纳单个洞察节点
     * P0 防护：重复采纳检查
     */
    const adoptInsight = async (node: InsightNode) => {
        // P0 防护：重复采纳检查
        if (node.isAdopted) {
            logger.log('UI', '洞察已采纳，跳过重复操作', { data: { nodeId: node.id } });
            return;
        }

        // 标记为已采纳（立即响应 UI）
        setInsights(prev =>
            prev.map(i => i.id === node.id ? { ...i, isAdopted: true } : i)
        );

        // 🆕 闭环功能（Feature Flag 控制）
        if (isFeatureEnabled('ENABLE_EDA_CONTEXT_LOOP')) {
            try {
                // 提取结构化信息
                const extracted = extractAdoptedInsight(node);

                // 添加到 AnalysisContext
                addAdoptedInsight(extracted);

                logger.log('数据分析', '[EDA闭环] 洞察已采纳', {
                    data: {
                        nodeId: node.id,
                        depth: extracted.depth,
                        type: extracted.type
                    }
                });

                // TODO: Phase 1.5 - 静默触发后续推荐
                // await triggerFollowUp(node, extracted);

            } catch (error) {
                logger.error('数据分析', '[EDA闭环] 采纳失败', { data: error });
            }
        }

        // 原有 Evidence 存储逻辑（保持兼容）
        addRecord({
            type: 'insight',
            title: node.conclusion || `洞察 ${node.id.slice(-8)}`,
            description: node.conclusion,
            tags: ['洞察', '已采纳'],
            metadata: { node },
        });
    };

    const resetChain = () => {
        setHypotheses([]);
        setInsights([]);
        setActiveHypothesisId(null);
    };

    return (
        <InsightChainContext.Provider value={{
            hypotheses,
            insights,
            activeHypothesisId,
            setHypotheses,
            addInsightNode,
            updateInsightNode, // 🆕
            toggleHypothesis,
            adoptChain,
            adoptInsight, // 🆕 EDA 闭环
            resetChain,
        }}>
            {children}
        </InsightChainContext.Provider>
    );
}

export function useInsightChain() {
    const context = useContext(InsightChainContext);
    if (!context) {
        throw new Error('useInsightChain 必须在 InsightChainProvider 内部使用');
    }
    return context;
}
