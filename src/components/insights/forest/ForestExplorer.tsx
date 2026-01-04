import React from 'react';
import { InsightNode, DrillDownAction } from '@/types/insightTree';
import { ForestNode } from './ForestNode';

interface ForestExplorerProps {
    nodes: InsightNode[];
    columns: string[];
    onDrillDown: (parentNode: InsightNode, action: DrillDownAction) => void;
    onToggleExpand: (nodeId: string) => void;
    onCustomAnalysis: (promptId: string, params: Record<string, unknown>) => void;
    onFocus: (nodeId: string) => void;
    onAdopt?: () => void; // 🆕
}

/**
 * ForestExplorer - 洞察探索容器
 * 使用InsightCardV2嵌套卡片布局，子节点自动渲染在父卡片内部
 */
export const ForestExplorer: React.FC<ForestExplorerProps> = ({
    nodes,
    columns,
    onDrillDown,
    onToggleExpand,
    onFocus,
    onAdopt // 🆕
}) => {
    return (
        <div className="insight-results-container">
            {nodes.map((node) => (
                <ForestNode
                    key={node.id}
                    node={node}
                    depth={node.depth}
                    onToggle={onToggleExpand}
                    onDrillDown={onDrillDown}
                    availableColumns={columns}
                    onFocus={onFocus}
                    onAdopt={onAdopt} // 🆕
                />
            ))}
        </div>
    );
};
