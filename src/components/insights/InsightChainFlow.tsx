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
import { executeAndFillResult } from '@/services/insights/executor';  // ✅ 使用公共执行器
import { ProjectFile } from '@/utils/projectUtils';
import { getCurrentRoleConfig } from '@/config/userRolePresets';
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

export function InsightChainFlow({ columns, rowCount, tableName, file, insightCache, hideTitle = false, showNotebook: showNotebookProp, onInsightAdopt }: InsightChainFlowProps) {
    const { t } = useI18n();
    const roleConfig = getCurrentRoleConfig();

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

    // 🆕 展开状态管理 - 用于同步卡片和 Notebook 的展开状态
    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

    // 🆕 Live Notebook 显示/隐藏状态
    // 优先级：外部 prop > 用户手动设置 > 角色配置
    const [internalShowNotebook, setInternalShowNotebook] = useState(() => {
        // 如果有外部 prop，使用外部值
        if (showNotebookProp !== undefined) return showNotebookProp;

        // 优先使用用户手动设置
        const userPreference = localStorage.getItem('insights_notebook_manual');
        if (userPreference !== null) {
            return userPreference === 'true';
        }

        // 否则使用角色配置
        const showCode = localStorage.getItem('insights_show_code');
        return showCode === 'true' || (showCode === null && roleConfig.insights.showCode);
    });
    const showNotebook = showNotebookProp !== undefined ? showNotebookProp : internalShowNotebook;
    const setShowNotebook = (value: boolean) => {
        setInternalShowNotebook(value);
        // 🆕 保存用户手动偏好
        localStorage.setItem('insights_notebook_manual', String(value));
    };

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

    // 🆕 收集所有顶层已解析节点的代码（不包括下钻子节点）
    // ✅ 修复：仅收集顶层节点，确保左侧卡片数量与右侧代码块一致
    const resolvedCodes = useMemo(() => {
        // 🔧 递归展平所有节点（包括嵌套的 children）
        const flattenNodes = (nodes: InsightNodeType[]): InsightNodeType[] => {
            return nodes.reduce<InsightNodeType[]>((acc, node) => {
                // 添加当前节点
                acc.push(node);
                // 递归添加子节点
                if (node.children && node.children.length > 0) {
                    acc.push(...flattenNodes(node.children));
                }
                return acc;
            }, []);
        };

        const allNodes = flattenNodes(insightNodes);

        return allNodes
            .filter(node =>
                !node.isLoading &&     // 已完成加载
                !node.error &&          // 无错误  
                node.result?.code       // 有代码
            )
            .map(node => ({
                id: node.id,
                title: node.title,
                code: node.result!.code,        // ✅ 已在 filter 中确认 result 存在
                rawCode: node.result!.rawCode,  // ✅ 同时传递纯净代码
                depth: node.depth,              // 🆕 用于 Notebook 标题显示层级
                isAdopted: node.isAdopted,      // 🆕 采纳状态
                isIgnored: node.isIgnored       // 🆕 拒绝状态
            }));
    }, [insightNodes]);

    // 🆕 日志：监控 resolvedCodes 更新
    useEffect(() => {
        if (resolvedCodes.length > 0) {
            logger.log('UI', 'Live Notebook代码块更新', {
                data: {
                    total: resolvedCodes.length,
                    ids: resolvedCodes.map(c => c.id),
                    titles: resolvedCodes.map(c => c.title)
                }
            });
        }
    }, [resolvedCodes]);

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
            // ✅ 优先级：props.tableName > file.data.tableName > file.tableName
            const effectiveTableName = tableName || file?.data?.tableName || file?.tableName;

            if (!effectiveTableName) {
                throw new Error('无法获取有效的 tableName，请检查数据加载状态');
            }

            // ✅ 使用公共执行器（统一处理 rawCode）
            const executorResult = await executeAndFillResult(childNode, {
                tableName: effectiveTableName,
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

        // 🆕 自动设置焦点到新解析的节点，并显示 Notebook
        setFocusedNodeId(childNode.id);
        // ✅ 同步更新Live Notebook展开状态（手风琴效果）
        setExpandedNodeIds(new Set([childNode.id]));
        setShowNotebook(true); // 自动展开 Notebook面板

        logger.log('UI', 'Live Notebook焦点同步（下钻）', {
            data: {
                focusedId: childNode.id,
                expandedIds: [childNode.id]
            }
        });
    };

    // 展开/折叠处理 - 同步更新展开状态 + 手风琴交互
    const handleToggleExpand = (nodeId: string) => {
        let targetNode: InsightNodeType | null = null;
        let targetDepth = 0;

        // 查找目标节点并获取其深度
        const findNode = (nodes: InsightNodeType[], depth: number): boolean => {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    targetNode = node;
                    targetDepth = depth;
                    return true;
                }
                if (node.children.length > 0 && findNode(node.children, depth + 1)) {
                    return true;
                }
            }
            return false;
        };

        findNode(insightNodes, 0);

        if (!targetNode) return;

        // 如果是展开操作（当前是折叠状态，要展开）
        // 使用类型守卫确保 TypeScript 正确推断类型
        const currentNode: InsightNodeType = targetNode;
        const willExpand = !currentNode.isExpanded;

        if (willExpand && targetDepth === 0) {
            // 🆕 手风琴逻辑：如果是顶层节点（父洞察卡片），收起所有其他顶层节点
            insightNodes.forEach(node => {
                if (node.id !== nodeId && node.isExpanded) {
                    node.isExpanded = false;
                    // 同步更新展开状态
                    setExpandedNodeIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(node.id);
                        return newSet;
                    });
                }
            });
        }

        // 切换目标节点的展开状态
        currentNode.isExpanded = !currentNode.isExpanded;

        // 同步更新展开状态到 Notebook
        setExpandedNodeIds(prev => {
            const newSet = new Set(prev);
            if (targetNode!.isExpanded) {
                newSet.add(nodeId);
            } else {
                newSet.delete(nodeId);
            }

            // 🆕 日志：展开状态更新
            logger.log('UI', '展开状态已更新', {
                data: {
                    nodeId,
                    isExpanded: targetNode!.isExpanded,
                    expandedCount: newSet.size,
                    expandedIds: Array.from(newSet)
                }
            });

            return newSet;
        });

        setInsightNodes([...insightNodes]);
    };

    // 🆕 处理节点状态变化 (adopted/ignored)
    const handleStatusChange = (nodeId: string, isAdopted: boolean, isIgnored: boolean) => {
        // 递归查找并更新节点
        const updateNodeStatus = (nodes: InsightNodeType[]): boolean => {
            for (const node of nodes) {
                if (node.id === nodeId) {
                    node.isAdopted = isAdopted;
                    node.isIgnored = isIgnored;
                    return true;
                }
                if (node.children.length > 0 && updateNodeStatus(node.children)) {
                    return true;
                }
            }
            return false;
        };

        updateNodeStatus(insightNodes);
        setInsightNodes([...insightNodes]); // 触发重新渲染
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
                            onFocus={(nodeId) => {
                                // ✅ 方案A修复：设置焦点的同时,更新Live Notebook的展开状态
                                setFocusedNodeId(nodeId);

                                // ✅ 手风琴效果：只展开聚焦的代码块,折叠其他所有代码块
                                setExpandedNodeIds(new Set([nodeId]));

                                logger.log('UI', 'Live Notebook焦点同步', {
                                    data: {
                                        focusedId: nodeId,
                                        expandedIds: [nodeId]
                                    }
                                });
                            }}
                            onAdopt={onInsightAdopt} // 🆕
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
