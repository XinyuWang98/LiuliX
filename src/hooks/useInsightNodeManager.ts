/**
 * InsightNode管理Hook
 * 负责:
 * - InsightNode状态管理
 * - 展开/折叠控制(含手风琴逻辑)
 * - 焦点追踪
 * - adopted/ignored状态管理
 * - 代码块聚合
 */
import { useState, useMemo, useEffect } from 'react';
import { InsightNode } from '@/types/insightTree';
import { logger } from '@/utils/logger';

export function useInsightNodeManager() {
    // InsightNode状态
    const [insightNodes, setInsightNodes] = useState<InsightNode[]>([]);

    // 焦点跟踪
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

    // 展开状态管理
    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

    // 递归展平所有节点(包括嵌套的children)
    const flattenNodes = (nodes: InsightNode[]): InsightNode[] => {
        return nodes.reduce<InsightNode[]>((acc, node) => {
            acc.push(node);
            if (node.children && node.children.length > 0) {
                acc.push(...flattenNodes(node.children));
            }
            return acc;
        }, []);
    };

    // 收集所有已解析节点的代码
    const resolvedCodes = useMemo(() => {
        const allNodes = flattenNodes(insightNodes);

        return allNodes
            .filter(node =>
                !node.isLoading &&
                !node.error &&
                node.result?.code
            )
            .map(node => ({
                id: node.id,
                title: node.title,
                code: node.result!.code,
                rawCode: node.result!.rawCode,
                depth: node.depth,
                isAdopted: node.isAdopted,
                isIgnored: node.isIgnored
            }));
    }, [insightNodes]);

    // 日志:监控resolvedCodes更新
    useEffect(() => {
        if (resolvedCodes.length > 0) {
            logger.log('UI', 'Live Notebook代码块更新', {
                data: {
                    total: resolvedCodes.length,
                    ids: resolvedCodes.map(c => c.id),
                    titles: resolvedCodes.map(c => c.title)
                }
            });
        }
    }, [resolvedCodes]);

    // 展开/折叠处理 - 手风琴交互
    const handleToggleExpand = (nodeId: string) => {
        let targetNode: InsightNode | null = null;
        let targetDepth = 0;

        // 查找目标节点并获取其深度
        const findNode = (nodes: InsightNode[], depth: number): boolean => {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    targetNode = node;
                    targetDepth = depth;
                    return true;
                }
                if (node.children.length > 0 && findNode(node.children, depth + 1)) {
                    return true;
                }
            }
            return false;
        };

        findNode(insightNodes, 0);

        if (!targetNode) return;

        const currentNode: InsightNode = targetNode;
        const willExpand = !currentNode.isExpanded;

        // 手风琴逻辑:如果是顶层节点,收起其他顶层节点
        if (willExpand && targetDepth === 0) {
            insightNodes.forEach(node => {
                if (node.id !== nodeId && node.isExpanded) {
                    node.isExpanded = false;
                    setExpandedNodeIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(node.id);
                        return newSet;
                    });
                }
            });
        }

        // 切换目标节点状态
        currentNode.isExpanded = !currentNode.isExpanded;

        // 同步更新展开状态到Notebook
        setExpandedNodeIds(prev => {
            const newSet = new Set(prev);
            if (currentNode.isExpanded) {
                newSet.add(nodeId);
            } else {
                newSet.delete(nodeId);
            }

            logger.log('UI', '展开状态已更新', {
                data: {
                    nodeId,
                    isExpanded: currentNode.isExpanded,
                    expandedCount: newSet.size,
                    expandedIds: Array.from(newSet)
                }
            });

            return newSet;
        });

        setInsightNodes([...insightNodes]);
    };

    // 处理节点状态变化(adopted/ignored)
    const handleStatusChange = (nodeId: string, isAdopted: boolean, isIgnored: boolean) => {
        const updateNodeStatus = (nodes: InsightNode[]): boolean => {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    node.isAdopted = isAdopted;
                    node.isIgnored = isIgnored;
                    return true;
                }
                if (node.children.length > 0 && updateNodeStatus(node.children)) {
                    return true;
                }
            }
            return false;
        };

        updateNodeStatus(insightNodes);
        setInsightNodes([...insightNodes]);
    };

    // 设置焦点并同步展开状态(手风琴效果)
    const setFocusWithExpand = (nodeId: string) => {
        setFocusedNodeId(nodeId);
        setExpandedNodeIds(new Set([nodeId]));

        logger.log('UI', 'Live Notebook焦点同步', {
            data: {
                focusedId: nodeId,
                expandedIds: [nodeId]
            }
        });
    };

    return {
        insightNodes,
        setInsightNodes,
        focusedNodeId,
        setFocusedNodeId,
        expandedNodeIds,
        setExpandedNodeIds,
        resolvedCodes,
        handleToggleExpand,
        handleStatusChange,
        setFocusWithExpand
    };
}
