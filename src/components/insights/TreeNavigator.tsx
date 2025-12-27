import React from 'react';
import './TreeNavigator.css';
import { useFocusMode } from '@/contexts/FocusModeContext';
import type { InsightNode } from '@/types/insightTree';

/**
 * 树形导航组件
 * 显示洞察树的层级结构，支持快速切换节点
 */

interface TreeNodeItemProps {
    node: InsightNode;
    depth: number;
    isActive: boolean;
    onSelect: (nodeId: string) => void;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
    node,
    depth,
    isActive,
    onSelect
}) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="tree-node-item">
            <div
                className={`tree-node-item__content ${isActive ? 'tree-node-item__content--active' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
                onClick={() => onSelect(node.id)}
            >
                {/* 展开/折叠图标 */}
                {hasChildren && (
                    <button
                        className="tree-node-item__toggle"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        {isExpanded ? '▾' : '▸'}
                    </button>
                )}
                {!hasChildren && <span className="tree-node-item__spacer" />}

                {/* 节点图标 */}
                <span className="tree-node-item__icon">
                    {node.status === 'completed' ? '📊' : '⋯'}
                </span>

                {/* 节点标题 */}
                <span className="tree-node-item__title" title={node.title}>
                    {node.title}
                </span>

                {/* Depth标记 */}
                <span className="tree-node-item__depth">L{node.depth}</span>
            </div>

            {/* 子节点 */}
            {hasChildren && isExpanded && (
                <div className="tree-node-item__children">
                    {node.children!.map((child) => (
                        <TreeNodeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            isActive={false}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const TreeNavigator: React.FC = () => {
    const { allNodes, focusedNode, navigateToNode } = useFocusMode();

    return (
        <div className="tree-navigator">
            <div className="tree-navigator__header">
                <h3 className="tree-navigator__title">洞察导航</h3>
            </div>

            <div className="tree-navigator__tree">
                {allNodes.map((node) => (
                    <TreeNodeItem
                        key={node.id}
                        node={node}
                        depth={0}
                        isActive={node.id === focusedNode?.id}
                        onSelect={navigateToNode}
                    />
                ))}
            </div>
        </div>
    );
};
