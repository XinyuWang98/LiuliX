import React, { createContext, useContext, useState, useCallback } from 'react';
import type { InsightNode } from '@/types/insightTree';

/**
 * 聚焦模式上下文
 * 管理全屏洞察详情的状态
 */

interface FocusModeContextValue {
    // 当前聚焦的节点
    focusedNode: InsightNode | null;

    // 所有洞察节点（用于导航树）
    allNodes: InsightNode[];

    // 操作方法
    enterFocusMode: (node: InsightNode, allNodes: InsightNode[]) => void;
    exitFocusMode: () => void;
    navigateToNode: (nodeId: string) => void;
}

const FocusModeContext = createContext<FocusModeContextValue | null>(null);

export const useFocusMode = () => {
    const context = useContext(FocusModeContext);
    if (!context) {
        throw new Error('useFocusMode必须在FocusModeProvider内部使用');
    }
    return context;
};

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [focusedNode, setFocusedNode] = useState<InsightNode | null>(null);
    const [allNodes, setAllNodes] = useState<InsightNode[]>([]);

    const enterFocusMode = useCallback((node: InsightNode, nodes: InsightNode[]) => {
        setFocusedNode(node);
        setAllNodes(nodes);
    }, []);

    const exitFocusMode = useCallback(() => {
        setFocusedNode(null);
        setAllNodes([]);
    }, []);

    const navigateToNode = useCallback((nodeId: string) => {
        // 递归查找节点
        const findNode = (nodes: InsightNode[]): InsightNode | null => {
            for (const node of nodes) {
                if (node.id === nodeId) return node;
                if (node.children) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
            return null;
        };

        const targetNode = findNode(allNodes);
        if (targetNode) {
            setFocusedNode(targetNode);
        }
    }, [allNodes]);

    return (
        <FocusModeContext.Provider
            value={{
                focusedNode,
                allNodes,
                enterFocusMode,
                exitFocusMode,
                navigateToNode,
            }}
        >
            {children}
        </FocusModeContext.Provider>
    );
};
