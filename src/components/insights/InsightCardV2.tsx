/**
 * InsightCardV2 - V2页洞察卡片组件
 * 复用design页的优化Header布局和LiuliX样式
 * 适配v2页的InsightNode数据类型
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useEvidence } from '@/contexts/EvidenceContext';
import { useAnalysisContext, AdoptedInsight } from '@/contexts/AnalysisContext'; // 🆕 Context 闭环
import { InsightNode, DrillDownAction, MAX_DRILL_DEPTH } from '@/types/insightTree';
import { DrillDownArea } from './DrillDownArea';
import { ChartImage } from './ChartImage';
import { logger } from '@/utils/logger';  // ✅ 添加logger导入
import './InsightCardV2.css';

interface InsightCardV2Props {
    node: InsightNode;
    availableColumns: string[];
    onToggle: (nodeId: string) => void;
    onFocus?: (nodeId: string) => void;
    onDrillDown: (node: InsightNode, action: DrillDownAction) => void;
    onCustomAnalysis: (promptId: string, params: Record<string, unknown>) => void;
    isExecuting?: boolean;
    onAdopt?: (nodeId: string) => void; // ✅ 接受nodeId参数以支持EDA闭环
    onStatusChange?: (nodeId: string, isAdopted: boolean, isIgnored: boolean) => void; // 🆕 状态变化回调
}

export const InsightCardV2: React.FC<InsightCardV2Props> = ({
    node,
    availableColumns,
    onToggle,
    onFocus,
    onDrillDown,
    onCustomAnalysis,
    isExecuting = false,
    onAdopt, // 🆕
    onStatusChange // 🆕
}) => {
    const { t } = useI18n();
    const { addRecord } = useEvidence();
    const { addAdoptedInsight } = useAnalysisContext(); // 🆕 Context 闭环

    // 采纳/忽略状态
    const [isAdopted, setIsAdopted] = useState(false);
    const [isIgnored, setIsIgnored] = useState(false);

    // 采纳洞察到证据池 + AnalysisContext (🆕 Context 闭环)
    const handleAdopt = (e: React.MouseEvent) => {
        e.stopPropagation();
        logger.log('UI', 'InsightCardV2 handleAdopt触发', { data: { nodeId: node.id, hasResult: !!node.result } });
        if (!node.result) {
            console.warn('[InsightCardV2] handleAdopt 跳过: node.result 不存在');
            return;
        }

        // 1. 添加到证据池（现有逻辑）
        addRecord({
            type: 'insightChain',
            title: node.title,
            description: node.result.summary || '',
            chartBase64: node.result.image,
            metadata: {
                nodeId: node.id,
                depth: node.depth,
                code: node.result.code,
                rawCode: node.result.rawCode, // ✅ 保存纯净代码用于报告展示
                columnsUsed: node.columnsUsed,
            },
        });

        // 2. 🆕 添加到 AnalysisContext（EDA 闭环）
        const insight: AdoptedInsight = {
            id: node.id,
            depth: node.depth,
            parentId: undefined,  // InsightNode 暂无 parentId，使用 undefined
            type: inferInsightType(node.title),
            description: node.title,
            structuredData: {
                column: node.columnsUsed[0],
                issues: [],
                values: {}
            },
            timestamp: Date.now()
        };
        addAdoptedInsight(insight);

        // 3. 更新 UI 状态
        setIsAdopted(true);
        setIsIgnored(false);
        onStatusChange?.(node.id, true, false);
        onAdopt?.(node.id); // ✅ 传递nodeId以支持EDA闭环
    };

    // 忽略洞察
    const handleIgnore = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsIgnored(true);
        setIsAdopted(false);
        // ✅ 通知父组件更新状态
        onStatusChange?.(node.id, false, true);
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
                    {/* 行1：标题 + 采样Badge */}
                    <div className="card-title-row">
                        <div className="card-title">{node.title}</div>
                        {/* 🆕 采样Badge */}
                        {node.isSampled && (
                            <span className="sampling-badge" title={t('insight.sampling.tooltip', { count: node.sampleSize || t('insight.sampling.unknown') })}>
                                {t('insight.sampling.badge')}
                            </span>
                        )}
                    </div>

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
                    {(() => {
                        // 🔍 调试日志：检查图片数据
                        if (node.result) {
                            const hasImage = !!node.result.image;
                            const imagePrefix = hasImage && node.result.image ? node.result.image.substring(0, 50) : 'null';
                            logger.log('UI', 'InsightCardV2 图片渲染检查', {
                                data: {
                                    nodeId: node.id,
                                    depth: node.depth,
                                    title: node.title,
                                    hasResult: true,
                                    hasImage,
                                    imagePrefix,
                                    isExpanded: node.isExpanded
                                }
                            });
                        }

                        return node.result?.image ? (
                            <ChartImage
                                src={node.result.image}
                                alt={node.title}
                                variant="card"
                                clickable={true}
                                downloadable={true}
                            />
                        ) : null;
                    })()}

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
                                    onAdopt={onAdopt}
                                    onStatusChange={onStatusChange} // ✅ 修复: 传递状态回调
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

/**
 * 🆕 辅助函数：从标题推断洞察类型
 */
function inferInsightType(title: string): AdoptedInsight['type'] {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('分布') || lowerTitle.includes('distribution')) return 'distribution';
    if (lowerTitle.includes('相关') || lowerTitle.includes('correlation')) return 'correlation';
    if (lowerTitle.includes('缺失') || lowerTitle.includes('missing') || lowerTitle.includes('quality')) return 'data_quality';
    if (lowerTitle.includes('趋势') || lowerTitle.includes('trend')) return 'trend';
    if (lowerTitle.includes('异常') || lowerTitle.includes('outlier')) return 'outlier';
    return 'other';
}
