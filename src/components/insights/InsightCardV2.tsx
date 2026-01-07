/**
 * InsightCardV2 - V2页洞察卡片组件
 * 复用design页的优化Header布局和LiuliX样式
 * 适配v2页的InsightNode数据类型
 */

import React, { useState } from 'react';
import { BarChart2, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useEvidence } from '@/contexts/EvidenceContext';
import { InsightNode, DrillDownAction, MAX_DRILL_DEPTH } from '@/types/insightTree';
import { DrillDownArea } from './DrillDownArea';
import { ChartImage } from './ChartImage';
import './InsightCardV2.css';

interface InsightCardV2Props {
    node: InsightNode;
    availableColumns: string[];
    onToggle: (nodeId: string) => void;
    onFocus?: (nodeId: string) => void;
    onDrillDown: (node: InsightNode, action: DrillDownAction) => void;
    onCustomAnalysis: (promptId: string, params: Record<string, unknown>) => void;
    isExecuting?: boolean;
    onAdopt?: () => void; // 🆕 采纳回调
}

export const InsightCardV2: React.FC<InsightCardV2Props> = ({
    node,
    availableColumns,
    onToggle,
    onFocus,
    onDrillDown,
    onCustomAnalysis,
    isExecuting = false,
    onAdopt // 🆕
}) => {
    const { t } = useI18n();
    const { addRecord } = useEvidence();

    // 采纳/忽略状态
    const [isAdopted, setIsAdopted] = useState(false);
    const [isIgnored, setIsIgnored] = useState(false);

    // 采纳洞察到证据池
    const handleAdopt = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!node.result) return;

        addRecord({
            type: 'insightChain',
            title: node.title,
            description: node.result.summary || '',
            chartBase64: node.result.image,
            metadata: {
                nodeId: node.id,
                depth: node.depth,
                code: node.result.code,
                columnsUsed: node.columnsUsed,
            },
        });
        setIsAdopted(true);
        setIsIgnored(false);
        onAdopt?.(); // 🆕 触发回调
    };

    // 忽略洞察
    const handleIgnore = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsIgnored(true);
        setIsAdopted(false);
    };

    // 状态判断
    const isPending = !node.result || node.isLoading; // 有result且非loading才算完成
    const isExpanded = node.isExpanded;
    const isLoading = node.isLoading;
    const hasChildren = node.children.length > 0;

    // 构建面包屑路径（从parentContext或其他字段推导）
    const breadcrumbPath = node.parentContext ? [node.parentContext] : [];

    return (
        <div className={`insight-card-v2 ${isPending ? 'is-pending' : ''} ${hasChildren ? 'has-children' : ''}`}>
            {/* Header */}
            <div
                className="insight-card-header"
                onClick={() => {
                    onToggle(node.id);
                    // 🆕 方案A修复：无论状态如何，都设置焦点以同步Live Notebook展开状态
                    onFocus?.(node.id);
                }}
            >
                {/* 左侧：层级徽章 */}
                <div className={`card-icon depth-${node.depth}`}>
                    L{node.depth}
                </div>

                {/* 中间：信息区域 */}
                <div className="card-info">
                    {/* 行1：标题 */}
                    <div className="card-title">{node.title}</div>

                    {/* 行2：数据上下文（文件名 + 所有列名）*/}
                    {(node.fileName || node.columnsUsed.length > 0) && (
                        <div className="card-context">
                            {node.fileName && (
                                <span className="context-badge context-file">{node.fileName}</span>
                            )}
                            {node.columnsUsed.map((column, index) => (
                                <span key={index} className="context-badge context-column">{column}</span>
                            ))}
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
                        <div className="vote-actions">
                            <button
                                className={`icon-btn ${isAdopted ? 'icon-btn-active' : ''}`}
                                onClick={handleAdopt}
                                disabled={isAdopted || isIgnored}
                                title={isAdopted ? t('insightChain.adopted') : t('insightChain.adopt')}
                            >
                                <ThumbsUp size={14} />
                            </button>
                            <button
                                className={`icon-btn ${isIgnored ? 'icon-btn-active' : ''}`}
                                onClick={handleIgnore}
                                disabled={isAdopted || isIgnored}
                                title={isIgnored ? t('insightChain.ignored') : t('insightChain.ignore')}
                            >
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

            {/* Body（展开时显示）*/}
            {isExpanded && (
                <div
                    className="card-body-expanded"
                    onClick={(e) => {
                        // 点击body区域时，设置焦点并展开右侧代码
                        // 但不改变卡片自身的展开状态
                        if (!isPending && node.result) {
                            onFocus?.(node.id);
                        }
                        // 阻止事件冒泡到header，避免触发展开/折叠
                        e.stopPropagation();
                    }}
                >
                    {/* 图表区域 */}
                    {node.result?.image && (
                        <ChartImage
                            src={node.result.image}
                            alt={node.title}
                            variant="card"
                            clickable={true}
                            downloadable={true}
                        />
                    )}

                    {/* 结论区域 */}
                    {node.result?.summary && (
                        <div className="card-conclusion">
                            <div className="conclusion-label">{t('insightChain.conclusion')}</div>
                            <div className="conclusion-text">{node.result.summary}</div>
                        </div>
                    )}



                    {/* 下钻建议区域 */}
                    {(() => {
                        // 只显示未执行的下钻建议
                        const pendingActions = (node.drillDownActions || []).filter(action => {
                            // 检查该建议是否已被执行（即是否存在对应的子节点）
                            const isExecuted = node.children.some(child =>
                                child.promptId === action.promptId
                            );
                            return !isExecuted; // 只保留未执行的
                        });

                        return pendingActions.length > 0 ? (
                            <div className="drill-down-section">
                                <DrillDownArea
                                    recommendations={pendingActions}
                                    availableColumns={availableColumns}
                                    depth={node.depth}
                                    maxDepth={MAX_DRILL_DEPTH}
                                    onExecuteAction={(action) => onDrillDown(node, action)}
                                    onExecuteCustom={onCustomAnalysis}
                                    isExecuting={isExecuting}
                                />
                            </div>
                        ) : null;
                    })()}

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
                                    onAdopt={onAdopt} // 🆕
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
                    <span>{t('insightChain.analyzing')}</span>
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
