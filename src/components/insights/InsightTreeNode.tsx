import { useI18n } from '@/contexts/I18nContext';
import { InsightNode as InsightNodeType, DrillDownAction, MAX_DRILL_DEPTH } from '@/types/insightTree';
import { DrillDownArea } from './DrillDownArea';
import { ChevronRight, ChevronDown, Loader, AlertCircle, BarChart2 } from 'lucide-react';
import { useEffect } from 'react';
import { logger } from '@/utils/logger';
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

    // 🔍 验证日志：组件渲染时检查 drillDownActions
    useEffect(() => {
        if (node.depth === 0) { // 只记录根节点
            logger.log('UI', `[InsightTreeNode] 节点渲染`, {
                data: {
                    title: node.title,
                    drillDownActionsCount: node.drillDownActions.length,
                    hasDrill: node.drillDownActions.length > 0
                }
            });
        }
    }, [node.depth, node.title, node.drillDownActions]);

    const hasChildren = node.children.length > 0;
    const canExpand = hasChildren || node.drillDownActions.length > 0 || (!!node.result);

    // 递归对齐：每一层子节点固定 marginLeft: 24px
    // Root 节点由外部容器控制，这里只控制子节点的缩进
    const depthIndent = node.depth > 0 ? 24 : 0;

    return (
        <div
            className={`insight-tree-node insight-tree-node--depth-${node.depth}`}
            style={node.depth > 0 ? { marginLeft: depthIndent } : undefined}
        >
            {/* Row 1: Header (核心索引) */}
            <div
                className="insight-tree-node__header"
                onClick={() => canExpand && onToggleExpand(node.id)}
            >
                {/* 1.1 折叠/展开按钮 */}
                <div className="insight-tree-node__toggle">
                    {canExpand ? (
                        node.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    ) : (
                        <span className="insight-tree-node__toggle-placeholder" />
                    )}
                </div>

                {/* 1.2 节点图标 (状态指示) */}
                <div className="insight-tree-node__icon">
                    {node.isLoading ? (
                        <Loader size={16} className="spinning" />
                    ) : node.error ? (
                        <AlertCircle size={16} className="insight-tree-node__icon--error" />
                    ) : (
                        <BarChart2 size={16} />
                    )}
                </div>

                {/* 1.3 标题 */}
                <div className="insight-tree-node__title" title={node.title}>
                    {node.title}
                </div>

                {/* 1.4 Metadata Tags (Columns) */}
                {node.columnsUsed.length > 0 && (
                    <div className="insight-tree-node__tags">
                        {node.columnsUsed.slice(0, 2).map(col => (
                            <span key={col} className="insight-tag">{col}</span>
                        ))}
                        {node.columnsUsed.length > 2 && (
                            <span className="insight-tag insight-tag--more">+{node.columnsUsed.length - 2}</span>
                        )}
                    </div>
                )}

                {/* 1.5 深度 Badge */}
                {node.depth > 0 && (
                    <div className="insight-tree-node__depth-badge">D{node.depth}</div>
                )}
            </div>

            {/* Content Body (Expanded) */}
            {node.isExpanded && (
                <div className="insight-node-content-body">
                    {/* 加载中状态 (局部) */}
                    {node.isLoading && !node.result && (
                        <div className="insight-node-loading">
                            <Loader size={20} className="spinning" />
                            <span>{t('insight.analyzing')}</span>
                        </div>
                    )}

                    {/* 错误信息 */}
                    {node.error && (
                        <div className="insight-node-error">
                            <AlertCircle size={16} />
                            <span>{node.error}</span>
                        </div>
                    )}

                    {/* 空状态处理：非加载、无错误且无结果 */}
                    {!node.isLoading && !node.error && !node.result && (
                        <div className="insight-node-empty">
                            <span>{t('common.noData')}</span>
                        </div>
                    )}

                    {/* 分析结果内容 */}
                    {node.result && (
                        <>
                            {/* Row 3: Visualization */}
                            {node.result.image && (
                                <div className="insight-node-row-viz">
                                    <img
                                        src={node.result.image}
                                        alt={node.title}
                                        className="insight-chart-thumbnail"
                                    />
                                </div>
                            )}

                            {/* Row 4: Summary */}
                            <div className="insight-node-row-summary">
                                {node.result.summary}
                            </div>

                            {/* Row 5: Code */}
                            {node.result.code && (
                                <details className="insight-node-row-code">
                                    <summary>{t('insight.viewCode')}</summary>
                                    <pre><code>{node.result.code}</code></pre>
                                </details>
                            )}
                        </>
                    )}

                    {/* Row 6: DrillDownArea */}
                    {node.result && (
                        <div className="insight-node-row-drill">
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

                    {/* 子节点容器 */}
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
