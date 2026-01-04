import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { InsightNode as InsightNodeType } from '@/types/insightTree';
import { DrillDownAction } from '@/types/insightTree';
import { ForestExplorer } from './forest/ForestExplorer';
import { LiveNotebookPanel } from './LiveNotebookPanel';
import { logger } from '../../utils/logger';
import { Loader } from 'lucide-react';
import { useInsightLoaderV2 } from '@/hooks/useInsightLoaderV2';
import { useInsightRefresh } from '@/hooks/useInsightRefresh';
import { getRenderedCode } from '@/services/insights/inflater';
import { executeInsightWithMode } from '@/services/skills/modeExecutor';
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
}

export function InsightChainFlow({ columns, rowCount, tableName, file, insightCache, hideTitle = false, showNotebook: showNotebookProp }: InsightChainFlowProps) {
    const { t } = useI18n();

    // 使用 InsightNode 状态
    const [insightNodes, setInsightNodes] = useState<InsightNodeType[]>([]);

    // 使用 V2 Hook（包含完整质量门控）
    const {
        isLoading,
        executionProgress,
        loadingStage, // 🆕 获取详细进度状态
        loadInsights,
        cancelLoading
    } = useInsightLoaderV2();

    // 加载洞察函数（V2 + 质量门控）
    const handleLoadInsights = async () => {
        // ✅ 优先级：传入的 tableName > file.data.tableName > file.tableName
        // 遵循与 useDataLoader.ts 一致的模式
        const effectiveTableName = tableName || file?.data?.tableName || file?.tableName;

        logger.log('AI洞察', '使用V2增强模式（含双重质量门控）');
        const result = await loadInsights(columns, rowCount, effectiveTableName, file);
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

    // 🆕 焦点跟踪状态
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

    // 🆕 Live Notebook 显示/隐藏状态
    // 优先使用外部 prop，否则使用内部状态和 localStorage
    const [internalShowNotebook, setInternalShowNotebook] = useState(() =>
        localStorage.getItem('insightFlow.showNotebook') !== 'false'
    );
    const showNotebook = showNotebookProp !== undefined ? showNotebookProp : internalShowNotebook;
    const setShowNotebook = setInternalShowNotebook;

    // 🆕 Notebook 宽度状态 (默认 50%)
    const [notebookWidthPercent, setNotebookWidthPercent] = useState(() => {
        const saved = localStorage.getItem('insightFlow.notebookWidth');
        return saved ? parseFloat(saved) : 50; // 默认 1:1 布局
    });

    // 🆕 拖拽状态
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 保存用户偏好到 localStorage
    useEffect(() => {
        localStorage.setItem('insightFlow.showNotebook', showNotebook.toString());
    }, [showNotebook]);

    useEffect(() => {
        localStorage.setItem('insightFlow.notebookWidth', notebookWidthPercent.toString());
    }, [notebookWidthPercent]);

    // 🆕 拖拽处理逻辑
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';
    }, []);

    const handleResize = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const offsetX = e.clientX - containerRect.left;

        // 计算右侧 Notebook 的宽度百分比
        const newPercent = ((containerWidth - offsetX) / containerWidth) * 100;
        // 限制范围: 25% ~ 75%
        const clampedPercent = Math.max(25, Math.min(75, newPercent));
        setNotebookWidthPercent(clampedPercent);
    }, [isResizing]);

    // 全局事件监听
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResize);
            window.addEventListener('mouseup', handleResizeEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isResizing, handleResize, handleResizeEnd]);

    // 🆕 收集所有已解析节点的代码
    const resolvedCodes = useMemo(() => {
        const collectResolvedCodes = (nodes: InsightNodeType[]): Array<{ id: string; title: string; code: string }> => {
            const results: Array<{ id: string; title: string; code: string }> = [];

            const traverse = (nodeList: InsightNodeType[]) => {
                for (const node of nodeList) {
                    // 检查节点是否已解析且有代码
                    if (!node.isLoading && node.result?.code) {
                        results.push({
                            id: node.id,
                            title: node.title,
                            code: node.result.code
                        });
                    }
                    if (node.children && node.children.length > 0) {
                        traverse(node.children);
                    }
                }
            };

            traverse(nodes);
            return results;
        };

        return collectResolvedCodes(insightNodes);
    }, [insightNodes]);

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
            columnsUsed: Object.values(action.params).filter(v => typeof v === 'string') as string[],
            promptId: action.promptId,
            params: action.params,
            isLoading: true,
            drillDownActions: [],
            children: [],
            isExpanded: true
        };

        // 添加到父节点
        parentNode.children.push(childNode);
        parentNode.isExpanded = true;
        setInsightNodes([...insightNodes]);

        try {
            // 渲染代码
            const renderedCode = await getRenderedCode(action.promptId, action.params);

            if (!renderedCode) {
                throw new Error(`无法渲染模板: ${action.promptId}`);
            }

            // 执行代码
            const execResult = await executeInsightWithMode(
                {
                    title: childNode.title,
                    description: '',
                    columns_used: childNode.columnsUsed,
                    full_mode: { code: renderedCode },
                    aggregated_mode: { sql: '', viz_code: '' }
                },
                'full',
                tableName || ''
            );

            childNode.isLoading = false;

            // 🔍 验证日志：检查执行结果
            logger.log('UI', '下钻执行结果', {
                data: {
                    success: execResult.success,
                    hasImage: !!execResult.data?.image,
                    imageLength: execResult.data?.image?.length || 0,
                    hasSummary: !!execResult.data?.summary,
                    summaryLength: execResult.data?.summary?.length || 0,
                    error: execResult.error
                }
            });

            if (execResult.success) {
                childNode.result = {
                    code: renderedCode,
                    image: execResult.data?.image,
                    summary: execResult.data?.summary || '',
                    columnsUsed: childNode.columnsUsed
                };
                logger.log('UI', '下钻成功', { data: { title: childNode.title } });
            } else {
                childNode.error = execResult.error || t('common.error');
                logger.error('UI', '下钻失败', execResult.error);
            }
        } catch (error) {
            childNode.isLoading = false;
            childNode.error = String(error);
            logger.error('UI', '下钻异常', error);
        }

        setInsightNodes([...insightNodes]);

        // 🆕 自动设置焦点到新解析的节点
        setFocusedNodeId(childNode.id);
    };

    // 展开/折叠处理
    const handleToggleExpand = (nodeId: string) => {
        const toggleNode = (nodes: InsightNodeType[]): boolean => {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    node.isExpanded = !node.isExpanded;
                    return true;
                }
                if (node.children.length > 0 && toggleNode(node.children)) {
                    return true;
                }
            }
            return false;
        };

        toggleNode(insightNodes);
        setInsightNodes([...insightNodes]);
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
                            onFocus={setFocusedNodeId}
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
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
