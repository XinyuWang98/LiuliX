import { createContext, useContext, useState, ReactNode } from 'react';
import { HypothesisCard, InsightNode, InsightChain } from '@/types/insightChain';
import { useEvidence } from './EvidenceContext';
import { logger } from '@/utils/logger';

interface InsightChainContextType {
    hypotheses: HypothesisCard[];
    insights: InsightNode[];
    activeHypothesisId: string | null;
    setHypotheses: (hypotheses: HypothesisCard[]) => void;
    addInsightNode: (node: InsightNode) => void;
    toggleHypothesis: (hypothesisId: string) => void;
    adoptChain: (hypothesisId: string) => void;
    resetChain: () => void;
}

const InsightChainContext = createContext<InsightChainContextType | null>(null);

export function InsightChainProvider({ children }: { children: ReactNode }) {
    const [hypotheses, setHypotheses] = useState<HypothesisCard[]>([]);
    const [insights, setInsights] = useState<InsightNode[]>([]);
    const [activeHypothesisId, setActiveHypothesisId] = useState<string | null>(null);
    const { addRecord } = useEvidence();

    const addInsightNode = (node: InsightNode) => {
        setInsights(prev => [...prev, node]);
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
            toggleHypothesis,
            adoptChain,
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
