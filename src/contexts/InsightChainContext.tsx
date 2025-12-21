import { createContext, useContext, useState, ReactNode } from 'react';
import { HypothesisCard, InsightNode, InsightChain } from '@/types/insightChain';
import { useEvidence } from './EvidenceContext';

// 洞察链上下文接口
interface InsightChainContextType {
    // 当前假设卡列表
    hypotheses: HypothesisCard[];
    // 当前洞察节点列表
    insights: InsightNode[];
    // 当前激活的假设卡 ID
    activeHypothesisId: string | null;

    // 设置假设卡列表
    setHypotheses: (hypotheses: HypothesisCard[]) => void;
    // 添加洞察节点
    addInsightNode: (node: InsightNode) => void;
    // 切换假设卡展开状态
    toggleHypothesis: (hypothesisId: string) => void;
    // 采纳整条洞察链（存入证据池）
    adoptChain: (hypothesisId: string) => void;
    // 重置洞察链
    resetChain: () => void;
}

// 创建上下文
const InsightChainContext = createContext<InsightChainContextType | null>(null);

// Provider 组件
export function InsightChainProvider({ children }: { children: ReactNode }) {
    const [hypotheses, setHypotheses] = useState<HypothesisCard[]>([]);
    const [insights, setInsights] = useState<InsightNode[]>([]);
    const [activeHypothesisId, setActiveHypothesisId] = useState<string | null>(null);

    // 证据池功能已启用
    const { addRecord } = useEvidence();

    // 添加洞察节点
    const addInsightNode = (node: InsightNode) => {
        setInsights(prev => [...prev, node]);
    };

    // 切换假设卡展开状态
    const toggleHypothesis = (hypothesisId: string) => {
        setHypotheses(prev =>
            prev.map(h =>
                h.id === hypothesisId ? { ...h, isExpanded: !h.isExpanded } : h
            )
        );
        setActiveHypothesisId(hypothesisId);
    };

    // 采纳整条洞察链
    const adoptChain = (hypothesisId: string) => {
        const hypothesis = hypotheses.find(h => h.id === hypothesisId);
        if (!hypothesis) {
            console.warn('未找到假设卡', hypothesisId);
            return;
        }

        // 获取该假设下的所有洞察节点
        const chainInsights = insights.filter(
            i => i.hypothesisId === hypothesisId && !i.isAdopted
        );

        if (chainInsights.length === 0) {
            console.warn('该假设下无洞察节点');
            return;
        }

        // 构建洞察链对象
        const insightChain: InsightChain = {
            hypothesis,
            insights: chainInsights,
            isAdopted: true,
            timestamp: Date.now(),
        };

        // 存入证据池
        addRecord({
            type: 'insightChain',
            title: `洞察链：${hypothesis.title}`,
            description: `假设："${hypothesis.title}"，包含 ${chainInsights.length} 个洞察节点`,
            tags: ['洞察链', '分析假设'],
            metadata: {
                insightChain,
            },
        });

        // 标记洞察节点为已采纳
        setInsights(prev =>
            prev.map(i =>
                i.hypothesisId === hypothesisId ? { ...i, isAdopted: true } : i
            )
        );

        console.log('[证据池] 洞察链已采纳并保存', insightChain);
    };

    // 重置洞察链
    const resetChain = () => {
        setHypotheses([]);
        setInsights([]);
        setActiveHypothesisId(null);
    };

    const value: InsightChainContextType = {
        hypotheses,
        insights,
        activeHypothesisId,
        setHypotheses,
        addInsightNode,
        toggleHypothesis,
        adoptChain,
        resetChain,
    };

    return (
        <InsightChainContext.Provider value={value}>
            {children}
        </InsightChainContext.Provider>
    );
}

// 使用洞察链的 Hook
export function useInsightChain() {
    const context = useContext(InsightChainContext);
    if (!context) {
        throw new Error('useInsightChain 必须在 InsightChainProvider 内部使用');
    }
    return context;
}
