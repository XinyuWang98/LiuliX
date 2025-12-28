/**
 * usePromptExecution Hook
 * 用于执行 Prompt 库中的 Prompt，支持森林式下钻交互
 * 
 * 设计文档: docs/01-架构设计/11-架构设计-洞察建议Prompt库时序图.md
 */

import { useState, useCallback, useRef } from 'react';
import { promptRegistry } from '@/services/promptRegistry';
import {
    InsightNode,
    InsightChain,
    L1Response,
    L1Recommendation,
    DrillDownAction,
    ExecutionResult,
    AnalysisHistory,
    MAX_DRILL_DEPTH
} from '@/types/insightTree';
import { logger } from '@/utils/logger';

// ========== 工具函数 ==========

/**
 * 填充 Prompt 模板的占位符
 */
function fillTemplate(template: string, params: Record<string, unknown>): string {
    let result = template;
    Object.entries(params).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        result = result.replace(new RegExp(placeholder, 'g'), stringValue);
    });
    return result;
}

/**
 * 生成唯一 ID (简化版，不依赖 uuid 库)
 */
function generateNodeId(): string {
    return `insight-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ========== Hook 定义 ==========

export interface UsePromptExecutionOptions {
    /** 调用 AI 的函数 (由调用方提供) */
    callAI: (prompt: string) => Promise<string>;
    /** 执行 Python 代码的函数 */
    executePython?: (code: string) => Promise<{ image?: string; output?: string }>;
}

export interface UsePromptExecutionReturn {
    /** 洞察链状态 */
    insightChain: InsightChain;
    /** 是否正在加载 L1 推荐 */
    isLoadingRecommendations: boolean;
    /** 是否正在执行 Prompt */
    isExecuting: boolean;
    /** 加载 L1 推荐 (初始化，需要传入列名用于兜底) */
    loadRecommendations: (dfSummary: string, columns: string[], history?: AnalysisHistory[]) => Promise<void>;
    /** 执行推荐项 (用户点击推荐按钮) */
    executeRecommendation: (recommendation: L1Recommendation) => Promise<void>;
    /** 执行下钻 (用户点击下钻按钮) */
    executeDrillDown: (parentNode: InsightNode, action: DrillDownAction) => Promise<void>;
    /** 执行自选分析 (用户自己选择列和方法) */
    executeCustomAnalysis: (promptId: string, params: Record<string, unknown>) => Promise<void>;
    /** 重置状态 */
    reset: () => void;
}

export function usePromptExecution(options: UsePromptExecutionOptions): UsePromptExecutionReturn {
    const { callAI, executePython } = options;

    // 状态
    const [insightChain, setInsightChain] = useState<InsightChain>({
        rootCards: [],
        isLoadingRecommendations: false,
        recommendations: []
    });
    const [isExecuting, setIsExecuting] = useState(false);

    // 历史记录 (用于传递给 L1)
    const historyRef = useRef<AnalysisHistory[]>([]);

    /**
     * 解析 AI 返回的 JSON
     */
    const parseAIResponse = useCallback(<T>(response: string): T | null => {
        try {
            // 尝试提取 JSON
            const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as T;
            }
            return null;
        } catch (error) {
            logger.log('AI服务', `JSON 解析失败: ${error}`);
            return null;
        }
    }, []);

    /**
     * 加载 L1 推荐 (初始化)
     */
    const loadRecommendations = useCallback(async (
        dfSummary: string,
        columns: string[],
        history?: AnalysisHistory[]
    ) => {
        setInsightChain(prev => ({ ...prev, isLoadingRecommendations: true }));

        try {
            // 获取 L1 Prompt
            const l1Prompt = promptRegistry.getPrompt('explorer-general-v1');
            if (!l1Prompt) {
                throw new Error('L1 Prompt not found');
            }

            // 记录 L1 使用
            promptRegistry.recordUsage('explorer-general-v1');

            // 填充模板
            const historyStr = history && history.length > 0
                ? JSON.stringify(history, null, 2)
                : '暂无历史记录';
            const filledPrompt = fillTemplate(l1Prompt.template, {
                df_summary: dfSummary,
                history: historyStr
            });

            logger.log('AI服务', '调用 L1 Prompt 获取推荐');

            // 调用 AI
            const response = await callAI(filledPrompt);
            const parsed = parseAIResponse<L1Response>(response);

            // 验证响应
            const { validateL1Response, generateFallbackRecommendations } = await import('@/utils/l1Validator');
            let validRecommendations = validateL1Response(parsed);

            // 如果验证后为空，使用兜底推荐
            if (validRecommendations.length === 0) {
                logger.log('AI服务', '使用兜底推荐');
                validRecommendations = generateFallbackRecommendations(columns);
            }

            setInsightChain(prev => ({
                ...prev,
                recommendations: validRecommendations,
                isLoadingRecommendations: false
            }));
            logger.log('AI服务', `获取到 ${validRecommendations.length} 条有效推荐`);
        } catch (error) {
            logger.log('AI服务', `L1 推荐加载失败: ${error}`);

            // AI 失败时使用兜底
            const { generateFallbackRecommendations } = await import('@/utils/l1Validator');
            const fallback = generateFallbackRecommendations(columns);

            setInsightChain(prev => ({
                ...prev,
                recommendations: fallback,
                isLoadingRecommendations: false
            }));
        }
    }, [callAI, parseAIResponse]);

    /**
     * 执行 L2 Prompt 并生成节点
     */
    const executeL2Prompt = useCallback(async (
        promptId: string,
        params: Record<string, unknown>,
        depth: number,
        parentContext?: string,
        drillHint?: DrillDownAction
    ): Promise<InsightNode | null> => {
        setIsExecuting(true);

        try {
            // 获取 L2 Prompt
            const l2Prompt = promptRegistry.getPrompt(promptId);
            if (!l2Prompt) {
                throw new Error(`L2 Prompt not found: ${promptId}`);
            }

            // 记录使用 (实际执行)
            promptRegistry.recordUsage(promptId);

            // 填充模板
            const filledPrompt = fillTemplate(l2Prompt.template, params);

            logger.log('AI服务', `执行 L2 Prompt: ${l2Prompt.title}`);

            // 调用 AI 获取代码
            const response = await callAI(filledPrompt);
            const parsed = parseAIResponse<ExecutionResult>(response);

            if (!parsed) {
                throw new Error('L2 返回格式错误');
            }

            // 执行 Python 代码 (如果有)
            let image: string | undefined;
            if (executePython && parsed.code) {
                try {
                    const execResult = await executePython(parsed.code);
                    image = execResult.image;
                } catch (execError) {
                    logger.log('Python', `代码执行失败: ${execError}`);
                }
            }

            // 构建下钻动作
            const drillDownActions: DrillDownAction[] = [];
            if (depth < MAX_DRILL_DEPTH && drillHint) {
                drillDownActions.push({
                    ...drillHint,
                    isRecommended: true
                });
            }

            // 创建节点
            const node: InsightNode = {
                id: generateNodeId(),
                depth,
                title: parsed.summary || l2Prompt.title,
                columnsUsed: parsed.columnsUsed || [],
                parentContext,
                promptId,
                params,
                isLoading: false,
                result: {
                    code: parsed.code,
                    summary: parsed.summary,
                    columnsUsed: parsed.columnsUsed || [],
                    image
                },
                drillDownActions,
                children: [],
                isExpanded: true
            };

            // 记录历史
            historyRef.current.push({
                promptId,
                columnsUsed: parsed.columnsUsed || [],
                resultSummary: parsed.summary
            });

            return node;
        } catch (error) {
            logger.log('AI服务', `L2 执行失败: ${error}`);
            return null;
        } finally {
            setIsExecuting(false);
        }
    }, [callAI, executePython, parseAIResponse]);

    /**
     * 执行推荐项 (用户点击推荐按钮)
     */
    const executeRecommendation = useCallback(async (recommendation: L1Recommendation) => {
        const node = await executeL2Prompt(
            recommendation.promptId,
            recommendation.params,
            0, // 根节点深度为 0
            undefined,
            recommendation.drillHint
        );

        if (node) {
            setInsightChain(prev => ({
                ...prev,
                rootCards: [...prev.rootCards, node]
            }));
        }
    }, [executeL2Prompt]);

    /**
     * 执行下钻 (用户点击下钻按钮)
     */
    const executeDrillDown = useCallback(async (parentNode: InsightNode, action: DrillDownAction) => {
        // 检查深度限制
        if (parentNode.depth >= MAX_DRILL_DEPTH) {
            logger.log('AI服务', '已达到最大下钻深度');
            return;
        }

        // 继承父节点的列信息
        const inheritedParams: Record<string, unknown> = {
            ...action.params,
            parent_context: parentNode.result?.summary || parentNode.title
        };

        // 如果参数中缺少列名，从父节点继承
        if (!inheritedParams.column_name && parentNode.columnsUsed.length > 0) {
            inheritedParams.column_name = parentNode.columnsUsed[0];
        }
        if (!inheritedParams.col_x && parentNode.columnsUsed.length > 0) {
            inheritedParams.col_x = parentNode.columnsUsed[0];
        }
        if (!inheritedParams.col_y && parentNode.columnsUsed.length > 1) {
            inheritedParams.col_y = parentNode.columnsUsed[1];
        }

        const childNode = await executeL2Prompt(
            action.promptId,
            inheritedParams,
            parentNode.depth + 1,
            parentNode.result?.summary
        );

        if (childNode) {
            // 将子节点添加到父节点的 children 中
            setInsightChain(prev => {
                const updateChildren = (nodes: InsightNode[]): InsightNode[] => {
                    return nodes.map(node => {
                        if (node.id === parentNode.id) {
                            return {
                                ...node,
                                children: [...node.children, childNode],
                                isExpanded: true
                            };
                        }
                        if (node.children.length > 0) {
                            return { ...node, children: updateChildren(node.children) };
                        }
                        return node;
                    });
                };

                return {
                    ...prev,
                    rootCards: updateChildren(prev.rootCards)
                };
            });

            // 异步刷新推荐 (静默调用 L1)
            // TODO: 实现异步刷新逻辑
        }
    }, [executeL2Prompt]);

    /**
     * 执行自选分析
     */
    const executeCustomAnalysis = useCallback(async (
        promptId: string,
        params: Record<string, unknown>
    ) => {
        const node = await executeL2Prompt(promptId, params, 0);

        if (node) {
            setInsightChain(prev => ({
                ...prev,
                rootCards: [...prev.rootCards, node]
            }));
        }
    }, [executeL2Prompt]);

    /**
     * 重置状态
     */
    const reset = useCallback(() => {
        setInsightChain({
            rootCards: [],
            isLoadingRecommendations: false,
            recommendations: []
        });
        historyRef.current = [];
    }, []);

    return {
        insightChain,
        isLoadingRecommendations: insightChain.isLoadingRecommendations,
        isExecuting,
        loadRecommendations,
        executeRecommendation,
        executeDrillDown,
        executeCustomAnalysis,
        reset
    };
}
