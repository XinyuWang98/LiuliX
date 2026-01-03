/**
 * InsightCardV2 - V2页洞察卡片组件
 * 复用design页的优化Header布局和LiuliX样式
 * 适配v2页的InsightNode数据类型
 */

import React from 'react';
import { BarChart2, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { InsightNode, DrillDownAction, MAX_DRILL_DEPTH } from '@/types/insightTree';
import { DrillDownArea } from './DrillDownArea';
import './InsightCardV2.css';

interface InsightCardV2Props {
    node: InsightNode;
    availableColumns: string[];
    onToggle: (nodeId: string) => void;
    onFocus?: (nodeId: string) => void;
    onDrillDown: (node: InsightNode, action: DrillDownAction) => void;
    onCustomAnalysis: (promptId: string, params: Record<string, unknown>) => void;
    isExecuting?: boolean;
}

export const InsightCardV2: React.FC<InsightCardV2Props> = ({
    node,
    availableColumns,
    onToggle,
    onFocus,
    onDrillDown,
    onCustomAnalysis,
    isExecuting = false
}) => {
    // 状态判断
    const isPending = !node.result || node.isLoading; // 有result且非loading才算完成
    const isExpanded = node.isExpanded;
    const isLoading = node.isLoading;
    const hasChildren = node.children.length > 0;

    // 构建面包屑路径（从parentContext或其他字段推导）
    const breadcrumbPath = node.parentContext ? [node.parentContext] : [];

    // 获取列名（取第一个列作为主列）
    const mainColumn = node.columnsUsed[0] || '';

    return (
        <div className={`insight-card-v2 ${isPending ? 'is-pending' : ''} ${hasChildren ? 'has-children' : ''}`}>
            {/* Header */}
            <div
                className="insight-card-header"
                onClick={() => {
                    onToggle(node.id);
                    if (!isPending) {
                        onFocus?.(node.id);
                    }
                }}
            >
                {/* 左侧：卡片图标 */}
                <div className="card-icon">
                    <BarChart2 size={18} />
                </div>

                {/* 中间：信息区域 */}
                <div className="card-info">
                    {/* 行1：标题 */}
                    <div className="card-title">{node.title}</div>

                    {/* 行2：数据上下文（文件名 + 列名）*/}
                    {(node.fileName || mainColumn) && (
                        <div className="card-context">
                            {node.fileName && (
                                <span className="context-badge context-file">{node.fileName}</span>
                            )}
                            {mainColumn && (
                                <span className="context-badge context-column">{mainColumn}</span>
                            )}
                        </div>
                    )}

                    {/* 行3：面包屑路径 */}
                    {breadcrumbPath.length > 0 && (
                        <div className="card-breadcrumb">
                            {breadcrumbPath.map((item, index) => (
                                <React.Fragment key={index}>
                                    <span className="breadcrumb-item">{item}</span>
                                    {index < breadcrumbPath.length - 1 && (
                                        <span className="breadcrumb-separator">›</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>

                {/* 右侧：操作按钮区域 */}
                <div className="card-actions">
                    {/* 投票按钮 - 仅在completed状态显示 */}
                    {!isPending && (
                        <div className="vote-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="icon-btn" title="采纳">
                                <ThumbsUp size={14} />
                            </button>
                            <button className="icon-btn" title="忽略">
                                <ThumbsDown size={14} />
                            </button>
                        </div>
                    )}

                    {/* 展开/折叠图标 */}
                    <div className="toggle-icon">
                        {isPending ? null : (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                    </div>
                </div>
            </div>

            {/* Body - 仅在completed且展开时显示 */}
            {!isPending && isExpanded && (
                <div className="insight-card-body">
                    {/* 图表区域 */}
                    {node.result?.image && (
                        <div className="chart-preview-area">
                            <img
                                src={`data:image/png;base64,${node.result.image}`}
                                alt={node.title}
                                className="chart-image"
                            />
                        </div>
                    )}

                    {/* AI结论 */}
                    {node.result?.summary && (
                        <div className="conclusion-box">
                            <strong>AI 结论：</strong>
                            {node.result.summary}
                        </div>
                    )}

                    {/* 下钻推荐区域 */}
                    {node.result && node.drillDownActions && node.drillDownActions.length > 0 && (
                        <div className="drill-down-section">
                            <DrillDownArea
                                recommendations={node.drillDownActions}
                                availableColumns={availableColumns}
                                depth={node.depth}
                                maxDepth={MAX_DRILL_DEPTH}
                                onExecuteAction={(action) => onDrillDown(node, action)}
                                onExecuteCustom={onCustomAnalysis}
                                isExecuting={isExecuting}
                            />
                        </div>
                    )}

                    {/* 嵌套子卡片区域 */}
                    {hasChildren && (
                        <div className="nested-children">
                            {node.children.map(child => (
                                <InsightCardV2
                                    key={child.id}
                                    node={child}
                                    availableColumns={availableColumns}
                                    onToggle={onToggle}
                                    onFocus={onFocus}
                                    onDrillDown={onDrillDown}
                                    onCustomAnalysis={onCustomAnalysis}
                                    isExecuting={isExecuting}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Loading状态 */}
            {isLoading && (
                <div className="card-loading-overlay">
                    <div className="spinner-mini" />
                    <span>AI 分析中...</span>
                </div>
            )}

            {/* Error状态 */}
            {node.error && (
                <div className="card-error">
                    <span>❌ {node.error}</span>
                </div>
            )}
        </div>
    );
};
