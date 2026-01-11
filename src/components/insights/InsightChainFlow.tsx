import { useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { InsightNode as InsightNodeType } from '@/types/insightTree';
import { DrillDownAction } from '@/types/insightTree';
import { ForestExplorer } from './forest/ForestExplorer';
import { LiveNotebookPanel } from './LiveNotebookPanel';
import { logger } from '../../utils/logger';
import { Loader } from 'lucide-react';
import { useInsightLoaderV2 } from '@/hooks/useInsightLoaderV2';
import { useInsightRefresh } from '@/hooks/useInsightRefresh';
import { useNotebookLayout } from '@/hooks/useNotebookLayout';  // ✅ 新Hook
import { useInsightNodeManager } from '@/hooks/useInsightNodeManager';  // ✅ 新Hook
import { executeAndFillResult } from '@/services/insights/executor';
import { extractColumnsUsed } from '@/services/insights/inflater';  // 🆕 复用列名提取函数
import { ProjectFile } from '@/utils/projectUtils';
import './InsightChainFlow.css';

const INIT_DELAY_MS = 800;

interface InsightChainFlowProps {
    columns: string[];
    rowCount: number;
    sampleData?: any[];
    tableName?: string;
    file?: ProjectFile;
    fileName?: string;
    insightCache?: {
        isStale?: boolean;
        status?: string;
    };
    hideTitle?: boolean;
    showNotebook?: boolean; // 外部控制 Notebook 显示/隐藏
    onInsightAdopt?: () => void; // 🆕
}

import { enhanceProjectFile } from '@/utils/fileEnhancer';

export function InsightChainFlow({ columns, rowCount, tableName, file, insightCache, hideTitle = false, showNotebook: showNotebookProp, onInsightAdopt }: InsightChainFlowProps) {
    const { t } = useI18n();

    // ✅ 新Hook: Notebook布局管理
    const {
        showNotebook,
        notebookWidthPercent,
        isResizing,
        containerRef,
        handleResizeStart
    } = useNotebookLayout(showNotebookProp);

    // ✅ 新Hook: InsightNode管理
    const {
        insightNodes,
        setInsightNodes,
        focusedNodeId,
        expandedNodeIds,
        resolvedCodes,
        handleToggleExpand,
        handleStatusChange,
        setFocusWithExpand
    } = useInsightNodeManager();

    // 使用 V2 Hook（包含完整质量门控）
    const {
        isLoading,
        executionProgress,
        loadingStage, // 🆕 获取详细进度状态
        loadInsights,
        cancelLoading,
        triggerFollowUp  // ✅ 导出EDA闭环函数
    } = useInsightLoaderV2();

    // 加载洞察函数（V2 + 质量门控）
    const handleLoadInsights = async () => {
        // ✅ 优先级：传入的 tableName > file.data.tableName > file.tableName
        // 遵循与 useDataLoader.ts 一致的模式
        const effectiveTableName = tableName || file?.data?.tableName || file?.tableName || 'uploaded_data';

        // ✅ 使用工具函数增强file对象 (替换原有13行手动逻辑)
        const enhancedFile = enhanceProjectFile(file, effectiveTableName, rowCount);

        logger.log('AI洞察', '使用V2增强模式（含双重质量门控）');
        const result = await loadInsights(columns, rowCount, effectiveTableName, enhancedFile);
        setInsightNodes(result); // 直接设置 InsightNode[]
    };

    // 使用智能刷新 Hook
    useInsightRefresh({
        hypothesesLength: insightNodes.length,
        tableName,
        insightCache,
        onRefresh: handleLoadInsights,
    });

    // Cleanup: 取消未完成的AI请求
    useEffect(() => {
        return () => {
            cancelLoading();
        };
    }, [cancelLoading]);

    // 初始化缓冲状态，防止"暂无数据"闪烁
    const [isInitializing, setIsInitializing] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, INIT_DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    const showInitializing = isInitializing && insightNodes.length === 0;
    const showEmpty = !isLoading && !isInitializing && insightNodes.length === 0;

    // 🆕 下钻处理逻辑
    const handleDrillDown = async (
        parentNode: InsightNodeType,
        action: DrillDownAction
    ) => {
        logger.log('UI', '执行下钻分析', { data: { parent: parentNode.title, action: action.label } });

        // 🔍 防重复检查：如果在同一父节点下已有相同 promptId 和 params 的子节点，则不再创建
        // 防止用户疯狂点击或误触导致生成多个相同的图表
        const existingChild = parentNode.children.find(child =>
            child.promptId === action.promptId &&
            JSON.stringify(child.params) === JSON.stringify(action.params)
        );

        if (existingChild) {
            logger.log('UI', '拦截重复下钻操作', { data: { actionLabel: action.label } });
            // 如果已存在节点被折叠，则展开它
            if (!existingChild.isExpanded) {
                existingChild.isExpanded = true;
                setInsightNodes([...insightNodes]);
            }
            return;
        }

        // 创建子节点
        const childNode: InsightNodeType = {
            id: `drill-${Date.now()}-${Math.random()}`,
            depth: parentNode.depth + 1,
            title: action.label || t('insight.drillDown'),
            columnsUsed: extractColumnsUsed(action.params),  // ✅ 使用专业提取函数，支持数组参数
            promptId: action.promptId,
            params: action.params,
            isLoading: true,
            drillDownActions: [],
            children: [],
            isExpanded: true,
            // 🆕 继承父节点的采样状态
            isSampled: parentNode.isSampled,
            sampleSize: parentNode.sampleSize
        };

        // 添加到父节点
        parentNode.children.push(childNode);
        parentNode.isExpanded = true;
        setInsightNodes([...insightNodes]);

        try {
            // ✅ 优先级：props.tableName > file.data.tableName > file.tableName
            const effectiveTableName = tableName || file?.data?.tableName || file?.tableName;

            if (!effectiveTableName) {
                throw new Error('无法获取有效的 tableName，请检查数据加载状态');
            }

            // ✅ 使用公共执行器（统一处理 rawCode + 内存评估）
            const executorResult = await executeAndFillResult(childNode, {
                tableName: effectiveTableName,
                totalRows: rowCount,  // ✅ 传递行数用于内存评估和采样决策
                enableQualityGate: false,  // 下钻不使用质量门控
                logPrefix: '下钻'
            });

            childNode.isLoading = false;

            if (executorResult.success && executorResult.result) {
                childNode.result = executorResult.result;
                logger.log('UI', '下钻成功', {
                    data: {
                        title: childNode.title,
                        hasRawCode: !!executorResult.result.rawCode,
                        rawCodeLength: executorResult.result.rawCode?.length || 0
                    }
                });
            } else {
                childNode.error = executorResult.error || t('common.error');
                logger.error('UI', '下钻失败', executorResult.error);
            }
        } catch (error) {
            childNode.isLoading = false;
            childNode.error = String(error);
            logger.error('UI', '下钻异常', error);
        }

        setInsightNodes([...insightNodes]);

        // ✅ 自动设置焦点到新解析的节点
        setFocusWithExpand(childNode.id);
    };

    // ✅ EDA闭环: 采纳洞察后自动触发下一步分析
    const handleAdoptWithFollowUp = async (nodeId: string) => {
        logger.log('用户操作', '洞察被采纳', { data: { nodeId } });

        // 查找被采纳的节点
        const findNode = (nodes: InsightNodeType[]): InsightNodeType | null => {
            for (const node of nodes) {
                if (node.id === nodeId) return node;
                if (node.children.length > 0) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
            return null;
        };

        const adoptedNode = findNode(insightNodes);
        if (!adoptedNode) {
            logger.warn('用户操作', '未找到被采纳的节点', { data: { nodeId } });
            return;
        }

        // 触发EDA闭环 (仅L0和L1节点触发,避免层级过深)
        if (adoptedNode.depth <= 1) {
            logger.log('AI洞察', '触发EDA闭环', {
                data: {
                    nodeId: adoptedNode.id,
                    depth: adoptedNode.depth,
                    title: adoptedNode.title
                }
            });

            try {
                await triggerFollowUp(adoptedNode);
                setInsightNodes([...insightNodes]); // 刷新UI
            } catch (error) {
                logger.error('AI洞察', 'EDA闭环触发失败', error);
            }
        }

        // 保留原有的跳转逻辑
        onInsightAdopt?.();
    };

    // 自定义分析（可选）
    const handleCustomAnalysis = (promptId: string, params: Record<string, unknown>) => {
        logger.log('UI', '自定义分析待实现', { data: { promptId, params } });
        // TODO: 实现自定义分析逻辑
    };

    return (
        <div className="insight-chain-flow">
            {!hideTitle && (
                <div className="insight-chain-header">
                    <h3 className="insight-chain-title">
                        {t('insightChain.title')}
                    </h3>
                </div>
            )}


            {/* 加载状态 + 执行进度 (覆盖 Initializing 阶段) */}
            {(isLoading || showInitializing) && (
                <div className="insight-loading-container">
                    <Loader size={32} className="spinning" />
                    <p>
                        {loadingStage
                            ? t(loadingStage, executionProgress || {})
                            : t(isLoading ? 'insightChain.loadingHypothesis' : 'analysis.initializing')
                        }
                    </p>
                    {executionProgress && (
                        <p className="insight-execution-progress">
                            {t('insightChain.analyzing')} {executionProgress.current}/{executionProgress.total}
                        </p>
                    )}
                </div>
            )}

            {/* AI假设生成失败/空状态提示 */}
            {showEmpty && (
                <div className="insight-empty-state">
                    <div className="insight-icon-wrapper">
                        <span className="insight-icon">✨</span>
                    </div>

                    <div className="insight-empty-text">
                        <h4 className="insight-ready-hint">
                            {t('analysis.readyHint')}
                        </h4>
                        <p className="insight-waiting-text">
                            {t('analysis.waitingForData')}
                        </p>
                    </div>

                    <button
                        className="btnPrimary insight-retry-btn"
                        onClick={() => window.location.reload()}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        {t('aiRetry.retryButton')}
                    </button>
                </div>
            )}

            {/* 🆕 Forest Explorer (Dark Forest Theme) */}
            {!isLoading && insightNodes.length > 0 && (
                <div
                    ref={containerRef}
                    className={`insight-split-view ${isResizing ? 'resizing' : ''}`}
                >
                    {/* 左侧：洞察树 */}
                    <div
                        className="tree-panel"
                        style={{ width: showNotebook ? `${100 - notebookWidthPercent}%` : '100%' }}
                    >
                        <ForestExplorer
                            nodes={insightNodes.filter(node => !node.error)}
                            columns={columns}
                            onDrillDown={handleDrillDown}
                            onToggleExpand={handleToggleExpand}
                            onCustomAnalysis={handleCustomAnalysis}
                            onFocus={setFocusWithExpand}
                            onAdopt={handleAdoptWithFollowUp} // ✅ 使用EDA闭环handler
                            onStatusChange={handleStatusChange} // 🆕 状态变化回调
                        />
                    </div>

                    {/* 拖拽手柄 */}
                    {showNotebook && (
                        <div
                            className={`notebook-resize-handle ${isResizing ? 'active' : ''}`}
                            onMouseDown={handleResizeStart}
                            title="拖拽调整宽度"
                        >
                            <div className="resize-indicator" />
                        </div>
                    )}

                    {/* 右侧：Live Notebook */}
                    {showNotebook && (
                        <div
                            className="notebook-panel"
                            style={{ width: `${notebookWidthPercent}%` }}
                        >
                            <LiveNotebookPanel
                                codeBlocks={resolvedCodes}
                                focusedId={focusedNodeId}
                                expandedIds={expandedNodeIds}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
