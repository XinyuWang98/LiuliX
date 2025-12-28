import { useState, useLayoutEffect, useCallback } from 'react';
import { InsightNode } from '@/types/insightTree';
import { ConnectionPoint } from './types';

/**
 * 管理节点连接坐标的 Hook
 */
export function useConnectionCoords(nodes: InsightNode[], expandedNodeIds: Set<string>) {
    const [connections, setConnections] = useState<{ start: ConnectionPoint; end: ConnectionPoint }[]>([]);

    const calculateConnections = useCallback(() => {
        const newConnections: { start: ConnectionPoint; end: ConnectionPoint }[] = [];

        // 辅助函数：获取节点 DOM 元素
        const getNodeElement = (id: string) => document.getElementById(`node-${id}`);

        // 递归遍历节点寻找连接关系
        const traverse = (nodeList: InsightNode[]) => {
            nodeList.forEach(node => {
                const parentEl = getNodeElement(node.id);

                if (parentEl && node.isExpanded && node.children && node.children.length > 0) {
                    // 父节点右侧中点
                    const parentRect = parentEl.getBoundingClientRect();
                    const containerRect = document.getElementById('forest-container')?.getBoundingClientRect();

                    if (!containerRect) return;

                    // 相对坐标
                    const startX = parentRect.right - containerRect.left;
                    const startY = parentRect.top + parentRect.height / 2 - containerRect.top;

                    node.children.forEach(child => {
                        const childEl = getNodeElement(child.id);
                        if (childEl) {
                            const childRect = childEl.getBoundingClientRect();

                            // 子节点左侧中点
                            const endX = childRect.left - containerRect.left;
                            const endY = childRect.top + childRect.height / 2 - containerRect.top;

                            newConnections.push({
                                start: { id: node.id, x: startX, y: startY, type: 'source', depth: node.depth },
                                end: { id: child.id, x: endX, y: endY, type: 'target', depth: child.depth, parentId: node.id }
                            });
                        }
                    });

                    // 继续递归子节点
                    traverse(node.children);
                }
            });
        };

        traverse(nodes);
        setConnections(newConnections);
    }, [nodes, expandedNodeIds]);

    // 监听窗口变化和节点展开状态
    useLayoutEffect(() => {
        // 延迟计算以等待 DOM 渲染完成 (尤其是动画之后)
        const timer = setTimeout(calculateConnections, 300); // 300ms 匹配 CSS 动画时长

        window.addEventListener('resize', calculateConnections);

        // 创建 MutationObserver 监听高度变化
        const observer = new MutationObserver(calculateConnections);
        const container = document.getElementById('forest-container');
        if (container) {
            observer.observe(container, { subtree: true, attributes: true, childList: true });
        }

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateConnections);
            observer.disconnect();
        };
    }, [calculateConnections, nodes, expandedNodeIds]);

    return connections;
}
