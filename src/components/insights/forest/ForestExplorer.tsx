import React, { useMemo } from 'react';
import { InsightNode, DrillDownAction } from '@/types/insightTree';
import { ForestNode } from './ForestNode';
import { ConnectionLines } from './ConnectionLines';
import { useConnectionCoords } from './hooks';

interface ForestExplorerProps {
    nodes: InsightNode[];
    columns: string[];
    onDrillDown: (parentNode: InsightNode, action: DrillDownAction) => void;
    onToggleExpand: (nodeId: string) => void;
    onCustomAnalysis: (promptId: string, params: Record<string, unknown>) => void;
}

/**
 * ForestExplorer - 暗夜森林风格层级探索器
 * 
 * 布局策略：
 * - 绝对定位布局？不，使用 Flex/Grid 更稳健，但连线需要绝对定位。
 * - 这里采用 "Dom Flow" 布局节点，SVG "Overlay" 布局连线。
 * - 为了实现"左侧对齐的主脊柱"，Root Nodes 放在左侧容器。
 */
export const ForestExplorer: React.FC<ForestExplorerProps> = ({
    nodes,
    columns,
    onDrillDown,
    onToggleExpand
}) => {
    // 追踪展开状态以触发连线重算
    const expandedNodeIds = useMemo(() => {
        const ids = new Set<string>();
        const traverse = (list: InsightNode[]) => {
            list.forEach(n => {
                if (n.isExpanded) ids.add(n.id);
                if (n.children) traverse(n.children);
            });
        };
        traverse(nodes);
        return ids;
    }, [nodes]);

    // 计算连线 (依赖 DOM 渲染)
    const connections = useConnectionCoords(nodes, expandedNodeIds);

    // 递归渲染节点树
    const renderTree = (nodeList: InsightNode[]) => {
        return nodeList.map((node) => (
            <div key={node.id} className="relative">
                {/* 当前节点 */}
                <ForestNode
                    node={node}
                    depth={node.depth}
                    onToggle={onToggleExpand}
                    onDrillDown={onDrillDown}
                    availableColumns={columns}
                />

                {/* 子节点容器 (递归) */}
                {node.isExpanded && node.children && node.children.length > 0 && (
                    <div className="flex flex-col">
                        {renderTree(node.children)}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div
            id="forest-container"
            className="relative w-full h-[600px] px-6 py-2 overflow-auto bg-[var(--forest-bg)] rounded-xl border border-[var(--forest-card-border)]"
        >
            {/* Scrollable Content Wrapper */}
            <div className="relative min-w-full w-max min-h-full">
                {/* SVG 连线层 (底层) */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <ConnectionLines connections={connections} />
                </div>

                {/* 左侧主脊柱 (装饰) - 增强可见性 */}
                <div className="absolute left-[20px] top-6 bottom-6 w-[2px] bg-[var(--forest-spine-color)] opacity-60 pointer-events-none" />

                {/* 节点树容器 - Root 节点增加左边距以容纳脊柱连接 */}
                <div className="relative z-10 flex flex-col gap-6 pl-[40px]">
                    {renderTree(nodes)}
                </div>
            </div>
        </div>
    );
};
