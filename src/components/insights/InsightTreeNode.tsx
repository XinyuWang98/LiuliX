/**
 * InsightTreeNode 组件
 * 递归渲染洞察树节点 (支持森林式下钻)
 */

import { useI18n } from '@/contexts/I18nContext';
import { InsightNode as InsightNodeType, DrillDownAction, MAX_DRILL_DEPTH } from '@/types/insightTree';
import { DrillDownArea } from './DrillDownArea';
import { ChevronRight, ChevronDown, Loader, AlertCircle, BarChart2, GitBranch } from 'lucide-react';
import './InsightTreeNode.css';

export interface InsightTreeNodeProps {
    /** 节点数据 */
    node: InsightNodeType;
    /** 可用的列名 */
    availableColumns: string[];
    /** 执行下钻动作 */
    onDrillDown: (node: InsightNodeType, action: DrillDownAction) => void;
    /** 执行自选分析 */
    onCustomAnalysis: (promptId: string, params: Record<string, unknown>) => void;
    /** 切换展开/折叠 */
    onToggleExpand: (nodeId: string) => void;
    /** 是否正在执行 */
    isExecuting?: boolean;
}

export function InsightTreeNode({
    node,
    availableColumns,
    onDrillDown,
    onCustomAnalysis,
    onToggleExpand,
    isExecuting = false
}: InsightTreeNodeProps) {
    const { t } = useI18n();

    const hasChildren = node.children.length > 0;
    const canExpand = hasChildren || node.drillDownActions.length > 0;
    const depthIndent = node.depth * 24; // 每层缩进 24px

    return (
        <div
            className={`insight-tree-node insight-tree-node--depth-${node.depth}`}
            style={{ marginLeft: depthIndent }}
        >
            {/* 节点头部 */}
            <div className="insight-tree-node__header">
                {/* 展开/折叠按钮 */}
                {canExpand && (
                    <button
                        className="insight-tree-node__toggle"
                        onClick={() => onToggleExpand(node.id)}
                    >
                        {node.isExpanded ? (
                            <ChevronDown size={16} />
                        ) : (
                            <ChevronRight size={16} />
                        )}
                    </button>
                )}

                {/* 深度指示器 */}
                {node.depth > 0 && (
                    <div className="insight-tree-node__depth-indicator">
                        <GitBranch size={14} />
                    </div>
                )}

                {/* 节点图标 */}
                <div className="insight-tree-node__icon">
                    {node.isLoading ? (
                        <Loader size={16} className="spinning" />
                    ) : node.error ? (
                        <AlertCircle size={16} className="insight-tree-node__icon--error" />
                    ) : (
                        <BarChart2 size={16} />
                    )}
                </div>

                {/* 节点标题 */}
                <div className="insight-tree-node__title">
                    {node.title}
                </div>

                {/* 使用的列 */}
                {node.columnsUsed.length > 0 && (
                    <div className="insight-tree-node__columns">
                        {node.columnsUsed.slice(0, 3).map(col => (
                            <span key={col} className="insight-tree-node__column-tag">{col}</span>
                        ))}
                        {node.columnsUsed.length > 3 && (
                            <span className="insight-tree-node__column-more">+{node.columnsUsed.length - 3}</span>
                        )}
                    </div>
                )}
            </div>

            {/* 节点内容 (展开时显示) */}
            {node.isExpanded && (
                <div className="insight-tree-node__content">
                    {/* 加载中 */}
                    {node.isLoading && (
                        <div className="insight-tree-node__loading">
                            <Loader size={20} className="spinning" />
                            <span>{t('insight.analyzing')}</span>
                        </div>
                    )}

                    {/* 错误信息 */}
                    {node.error && (
                        <div className="insight-tree-node__error">
                            <AlertCircle size={16} />
                            <span>{node.error}</span>
                        </div>
                    )}

                    {/* 执行结果 */}
                    {node.result && (
                        <div className="insight-tree-node__result">
                            {/* 图表 */}
                            {node.result.image && (
                                <div className="insight-tree-node__chart">
                                    <img
                                        src={`data:image/png;base64,${node.result.image}`}
                                        alt={node.title}
                                    />
                                </div>
                            )}

                            {/* 摘要 */}
                            <div className="insight-tree-node__summary">
                                {node.result.summary}
                            </div>

                            {/* 代码 (可折叠) */}
                            {node.result.code && (
                                <details className="insight-tree-node__code-details">
                                    <summary>{t('insight.viewCode')}</summary>
                                    <pre className="insight-tree-node__code">
                                        <code>{node.result.code}</code>
                                    </pre>
                                </details>
                            )}
                        </div>
                    )}

                    {/* 下钻区域 */}
                    {node.result && (
                        <DrillDownArea
                            recommendations={node.drillDownActions}
                            availableColumns={availableColumns}
                            depth={node.depth}
                            maxDepth={MAX_DRILL_DEPTH}
                            onExecuteAction={(action) => onDrillDown(node, action)}
                            onExecuteCustom={onCustomAnalysis}
                            isExecuting={isExecuting}
                        />
                    )}

                    {/* 子节点 (递归渲染) */}
                    {node.children.length > 0 && (
                        <div className="insight-tree-node__children">
                            {node.children.map(child => (
                                <InsightTreeNode
                                    key={child.id}
                                    node={child}
                                    availableColumns={availableColumns}
                                    onDrillDown={onDrillDown}
                                    onCustomAnalysis={onCustomAnalysis}
                                    onToggleExpand={onToggleExpand}
                                    isExecuting={isExecuting}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
