import React from 'react';
import { ForestNodeProps } from './types';
import { InsightCardV2 } from '../InsightCardV2';

/**
 * ForestNode - 单个洞察卡片 (使用InsightCardV2组件)
 * 作为ForestExplorer中的节点，复用design页的优化样式
 */
export const ForestNode: React.FC<ForestNodeProps> = ({
    node,
    depth: _depth,
    onToggle,
    onDrillDown,
    availableColumns,
    onFocus
}) => {
    // 自定义分析处理（ForestNode不需要此功能，传空函数）
    const handleCustomAnalysis = () => {
        // ForestNode场景下不使用自定义分析
    };

    return (
        <InsightCardV2
            node={node}
            availableColumns={availableColumns || []}
            onToggle={onToggle}
            onDrillDown={onDrillDown}
            onCustomAnalysis={handleCustomAnalysis}
            isExecuting={false}
            onFocus={onFocus}
        />
    );
};
