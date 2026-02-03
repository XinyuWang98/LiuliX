/**
 * 洞察加载 Hook (集成版 - 双模式Skills + QualityGate)
 * 负责：数据脱敏、内存评估、AI双模式、Skills执行、质量门控
 */
import { useState, useRef } from 'react';
import { InsightNode } from '@/types/insightTree';
import { ProjectFile } from '@/utils/projectUtils';
// ✅ 已移除sampleDataForAI，直接查询working表
import { DuckDBEngine } from '@/db/duckdbEngine';
import { generateBatchInsightsPrompt, parseBatchInsightsResponse } from '@/services/prompts/library/insight';
// 🆕 Router 模式导入
import { buildRouterPrompt, parseRouterResponse, buildFallbackRecommendations } from '@/services/prompts/routerPrompt';
import { inflateRecommendations } from '@/services/insights/inflater';
import { logger } from '../utils/logger';
// ✅ 使用公共执行器
import { executeBatchNodes } from '@/services/insights/executor';
import { getFallbackInsights } from '@/utils/fallbackTemplates';
import { RESOURCE_LIMITS, checkAvailableMemory } from '@/utils/resourceLimits';
import { CacheManager } from '../utils/cacheManager';
// ✅ 已移除getAnalysisConfig，角色配置samplingRows和maxColumns已废弃
import { buildEDAExecutionContext } from '@/services/insights/executionContextBuilder';

// 🆕 EDA 闭环依赖
import { useInsightChain } from '@/contexts/InsightChainContext';
import { useAnalysisContext } from '@/contexts/AnalysisContext';
// import { injectContextToPrompt } from '@/services/prompts/contextInjector'; // 在 buildRouterPrompt 内部使用
// import { aiRequestQueue } from '@/services/aiRequestQueue'; // P1: 请求队列 -> 这里还没实现，先注释掉

export function useInsightLoaderV2() {
    const [loadingStage, setLoadingStage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [executionProgress, setExecutionProgress] = useState<{ current: number; total: number } | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const currentFileRef = useRef<any>(null);  // 🆕 追踪当前处理的文件

    // 🆕 EDA 闭环 Context
    const { addInsightNode, updateInsightNode } = useInsightChain();
    const { getAdoptedInsights } = useAnalysisContext();

    /**
     * 加载洞察假设（集成版）
     */
    const loadInsights = async (
        columns: string[],
        rowCount: number,
        tableName?: string,
        currentFile?: ProjectFile  // 🆕 当前文件对象（用于缓存管理）
    ): Promise<InsightNode[]> => {
        setIsLoading(true);
        setLoadingStage('progress.generatingPrompt');
        setExecutionProgress(null);

        // 🆕 保存当前文件引用
        currentFileRef.current = currentFile;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            logger.group('AI洞察', '批量洞察生成流程（双模式）');

            // ========== 步骤1：获取列信息 ==========
            let validColumns: string[] = columns || [];
            let totalRows = rowCount || 0;

            if (validColumns.length === 0 && tableName) {
                const engine = DuckDBEngine.getInstance();
                await engine.init();

                // ⚠️ 表存在性验证（方案C核心）
                const tableExists = await engine.tableExists(tableName);
                if (!tableExists) {
                    logger.warn('AI洞察', `表 ${tableName} 不存在，跳过洞察生成`);
                    throw new Error(`Table ${tableName} does not exist. 数据表尚未ready，请稍候再试`);
                }

                const describeResult = await engine.runQuery(`DESCRIBE ${tableName}`);
                validColumns = describeResult.map((row: any) => row.column_name);

                // 获取总行数
                const countResult = await engine.runQuery(`SELECT COUNT(*) as cnt FROM ${tableName}`);
                totalRows = countResult[0]?.cnt || 0;
            }

            logger.log('AI洞察', '数据规模', { data: { columns: validColumns.length, totalRows } });
            // ========== 🆕 步骤1.5：使用所有有效列（动态评估会根据列数自动调整行数）==========
            const selectedColumns = validColumns;  // ✅ 不限制列数，内存评估会自动平衡

            // ========== 步骤2：直接加载working表数据（上传时已优化）==========
            let sampledDataLocal: any[] = [];
            if (tableName) {
                const SAMPLE_ROWS = 100;  // ✅ 不再区分角色，Router统一100行。TODO: 设置页移除"采样行数"组件
                // ✅ 直接查询working表（上传时已按内存评估采样）
                const db = DuckDBEngine.getInstance();
                const allData = await db.runQuery(`SELECT * FROM ${tableName}`);
                sampledDataLocal = allData.slice(0, SAMPLE_ROWS);

                logger.log('AI洞察', `✅ 加载working表数据`, {
                    data: {
                        working表行数: allData.length,
                        Router用行数: sampledDataLocal.length
                    }
                });
            }


            // ========== 步骤2.5：数据脱敏（使用统一工具） ==========
            // 获取列信息用于脱敏
            let columnInfo: any[] = [];
            let statistics: any[] = [];
            if (tableName) {
                try {
                    const engine = DuckDBEngine.getInstance();
                    const describeResult = await engine.runQuery(`DESCRIBE ${tableName}`);
                    columnInfo = describeResult.map((row: any) => ({
                        name: row.column_name,
                        type: row.column_type
                    }));
                    // 从采样数据构造基础统计
                    statistics = columnInfo.map((col: any) => {
                        const values = sampledDataLocal.map((row: any) => row[col.name]);
                        return {
                            sampleData: values.slice(0, 3)
                        };
                    });
                } catch (e) {
                    logger.warn('AI洞察', '获取列信息失败，使用空列表');
                }
            }

            const { unifiedSanitize } = await import('@/utils/unifiedDataSanitizer');
            const { privacyMode } = await unifiedSanitize(
                columnInfo,
                statistics,
                sampledDataLocal,
                {
                    respectUserSettings: true,
                    intelligentDetection: true,
                    granularity: 'coarse'  // 洞察使用粗粒度
                }
            );

            logger.log('数据隐私', `脱敏完成 模式=${privacyMode}`, {
                data: { columns: columnInfo.length, mode: privacyMode }
            });

            // ========== 步骤3：AI生成洞察（双模式） ==========

            // ✅ 使用 SchemaService 获取列类型信息
            let columnTypes: Record<string, string> | undefined;
            if (tableName) {
                try {
                    const { getTableSchema, extractColumnTypes } = await import('@/services/schemaService');
                    const schema = await getTableSchema(tableName);
                    columnTypes = extractColumnTypes(schema);
                } catch (e) {
                    logger.warn('AI洞察', '获取列类型失败');
                }
            }

            // ✅ 构造 Router Prompt（使用新架构）
            const USE_ROUTER_MODE = true; // 🎯 切换开关

            let prompt = '';
            let insightNodes: InsightNode[] = [];

            // 🆕 Check Feature Flag for Local Router
            let isLocalSuccess = false;
            let recommendations: any[] = [];

            if (USE_ROUTER_MODE) {
                const { isFeatureEnabled } = await import('@/config/featureFlags');
                const useLocalRouter = isFeatureEnabled('ENABLE_LOCAL_ROUTER');

                if (useLocalRouter) {
                    try {
                        const { localInsightRouter } = await import('@/services/ai/localRouter/LocalInsightRouter');
                        logger.log('AI服务', '[Router] 🟢 启用本地模型 (LocalInsightRouter)');

                        recommendations = await localInsightRouter.generate(
                            selectedColumns,
                            columnTypes || {},
                            sampledDataLocal
                        );

                        if (recommendations.length > 0) {
                            isLocalSuccess = true;
                            logger.log('AI洞察', `[Local] 生成 ${recommendations.length} 条推荐`);
                        }
                    } catch (err) {
                        logger.warn('AI服务', `[Router] 本地模型失败，降级到云端: ${err}`);
                    }
                }

                if (!isLocalSuccess) {
                    // Cloud Flow (Original)
                    prompt = buildRouterPrompt(
                        selectedColumns,
                        privacyMode === 'sanitized' ? [] : sampledDataLocal,
                        columnTypes
                    );
                    logger.log('AI服务', '[Router] 使用 Cloud Router Prompt 模式');

                    // Call AI
                    setLoadingStage('progress.sendingRequest');
                    const { invokeAI } = await import('@/services/aiInvoker');
                    const aiStartTime = performance.now();
                    const aiResponse = await invokeAI(prompt, { type: 'insight', priority: 'normal' });
                    const aiDuration = (performance.now() - aiStartTime) / 1000;
                    logger.log('AI洞察', `AI响应收到 (${aiResponse.length}字符，耗时${aiDuration.toFixed(1)}秒)`);

                    recommendations = parseRouterResponse(aiResponse, selectedColumns);

                    // 🆕 注入统计参数（修复膨胀失败问题）
                    try {
                        const db = DuckDBEngine.getInstance();
                        const columnStats = await db.getColumnStats(tableName!);
                        const { injectStatsParams } = await import('@/services/prompts/paramInjector');
                        recommendations = injectStatsParams(recommendations, columnStats);
                        logger.log('AI服务', '[Router] 参数注入完成', {
                            data: { beforeCount: recommendations.length }
                        });
                    } catch (statsError) {
                        logger.warn('AI服务', '[Router] 参数注入失败，使用 AI 原始参数', {
                            data: { error: String(statsError) }
                        });
                        // 降级：保留 AI 猜测的参数
                    }
                }

                // Shared Inflation Logic
                logger.log('AI服务', `[LoadInsights] 🔍 准备膨胀推荐`, {
                    data: { count: recommendations.length, tableName: tableName! }
                });

                if (recommendations.length === 0) {
                    logger.warn('AI服务', '[Router] AI未返回推荐，使用规则层兜底');
                    const fallbackRecs = buildFallbackRecommendations(selectedColumns, columnTypes);
                    insightNodes = await inflateRecommendations(fallbackRecs as any, tableName!);
                } else {
                    logger.log('AI服务', '[Router] 解析成功', { data: { count: recommendations.length } });

                    const { processRecommendationsStreaming } = await import('@/services/insights/streamProcessor');

                    insightNodes = await processRecommendationsStreaming(
                        recommendations as any,
                        {
                            tableName: tableName!,
                            validColumns,
                            totalRows,
                            columnCount: validColumns.length
                        },
                        {
                            onProgress: (current, total) => {
                                setExecutionProgress({ current, total });
                                setLoadingStage('progress.generatingInsight');
                            }
                        },
                        {
                            inflateConcurrency: 2,
                            executeConcurrency: 1,
                            enableQualityGate: true,
                            enableColumnValidation: true
                        }
                    );
                }
            } else {
                // Legacy Coder Mode
                prompt = generateBatchInsightsPrompt(
                    selectedColumns,
                    sampledDataLocal.length,
                    totalRows,
                    privacyMode === 'sanitized' ? [] : sampledDataLocal
                );
                logger.log('AI服务', '[Coder] 使用传统 Coder Prompt 模式');

                // Call AI
                setLoadingStage('progress.sendingRequest');
                const { invokeAI } = await import('@/services/aiInvoker');
                const aiResponse = await invokeAI(prompt, { type: 'insight', priority: 'normal' });

                // Parse Coder response
                const insightSuggestions = parseBatchInsightsResponse(aiResponse);

                if (insightSuggestions.length === 0) {
                    logger.warn('AI洞察', 'AI未返回有效建议，使用预置模板');
                    const fallback = getFallbackInsights();
                    insightNodes = fallback.map((sugg, idx) => ({
                        id: `node-${Date.now()}-${idx}`,
                        depth: 0,
                        title: sugg.title,
                        columnsUsed: sugg.columns_used || [],
                        promptId: '',
                        params: {},
                        isLoading: false,
                        drillDownActions: [],
                        children: [],
                        isExpanded: false,
                        result: {
                            code: sugg.full_mode.code,
                            rawCode: sugg.full_mode.code,
                            summary: '',
                            columnsUsed: sugg.columns_used || []
                        }
                    }));
                } else {
                    insightNodes = insightSuggestions.map((sugg, idx) => ({
                        id: `node-coder-${Date.now()}-${idx}`,
                        depth: 0,
                        title: sugg.title,
                        columnsUsed: sugg.columns_used || [],
                        promptId: '',
                        params: {},
                        isLoading: false,
                        drillDownActions: [],
                        children: [],
                        isExpanded: false,
                        result: {
                            code: sugg.full_mode.code,
                            rawCode: sugg.full_mode.code,
                            summary: '',
                            columnsUsed: sugg.columns_used || []
                        }
                    }));
                }
            }

            // ========== 步骤5：执行代码并填充结果（使用公共执行器）==========
            // 🆕 仅对未执行的节点执行（流式处理分支已在 processRecommendationsStreaming 中执行）
            const hasUnexecutedNodes = insightNodes.some(node => !node.result);
            if (hasUnexecutedNodes) {
                setLoadingStage('progress.validating');

                const maxInsights = Math.min(
                    insightNodes.length,
                    RESOURCE_LIMITS.SAFETY_LIMITS.MAX_INSIGHTS_PER_RUN
                );

                // 截取需要执行的节点
                const nodesToExecute = insightNodes.slice(0, maxInsights);

                // ✅ 列名校验（在执行前过滤无效节点）
                const { validateColumnsExist } = await import('@/utils/columnValidator');
                const columnParamKeys = ['column_name', 'col_x', 'col_y', 'date_col', 'value_col', 'group_col'];

                for (const node of nodesToExecute) {
                    const paramsToValidate: Record<string, unknown> = {};
                    for (const key of columnParamKeys) {
                        if (node.params?.[key]) {
                            paramsToValidate[key] = node.params[key];
                        }
                    }

                    const validationResult = validateColumnsExist(paramsToValidate, validColumns);

                    if (!validationResult.valid) {
                        logger.warn('AI洞察', `跳过无效列名的洞察: ${node.title}`, {
                            data: { invalidColumns: validationResult.invalidColumns, validColumns: validColumns }
                        });
                        node.result = {
                            code: '',
                            rawCode: '',
                            summary: `列名校验失败: 列 ${validationResult.invalidColumns?.join(', ')} 不存在于数据集中`,
                            columnsUsed: []
                        };
                        node.error = '列名校验失败';
                    }
                }

                // ✅ 使用公共执行器批量执行（统一处理 rawCode）
                const validNodesToExecute = nodesToExecute.filter(node => !node.error);

                await executeBatchNodes(
                    validNodesToExecute,
                    {
                        tableName: tableName || '',
                        totalRows,
                        columnCount: validColumns.length,
                        enableQualityGate: true,
                        logPrefix: '批量洞察'
                    },
                    (current, total) => {
                        setExecutionProgress({ current, total });
                        setLoadingStage('progress.generatingInsight');

                        // 内存监控
                        if (current % 2 === 0 && current > 1) {
                            const freeMemory = checkAvailableMemory();
                            if (freeMemory < RESOURCE_LIMITS.SAFETY_LIMITS.MIN_FREE_MEMORY) {
                                logger.warn('AI服务', `内存不足，可能影响后续执行`);
                            }
                        }
                    },
                    // 🆕 流式更新回调：每个节点完成时触发UI更新
                    (node) => {
                        logger.log('AI洞察', `[流式更新] 节点完成: ${node.title}`, {
                            data: { status: node.status, hasImage: !!node.chartImage }
                        });
                        // 触发React状态更新（通过重新赋值insightNodes引用）
                        insightNodes = [...insightNodes]; // 强制触发引用变化
                    }
                );
            } else {
                logger.log('AI服务', '[流式处理] 跳过批量执行（已在流式处理器中完成）');
            }

            // 过滤掉失败的节点（可选，保留失败节点可以显示错误信息）
            const validNodes = insightNodes.filter(node => node.result && !node.error);

            logger.log('AI洞察', `完成：生成${validNodes.length}/${insightNodes.length}条有效洞察`);

            // 更新缓存时间戳
            if (currentFileRef.current) {
                CacheManager.updateInsightTimestamp(currentFileRef.current);
            }

            logger.groupEnd();

            return insightNodes; // 返回所有节点（包括失败的）

        } catch (error) {
            logger.groupEnd();
            logger.error('AI洞察', '流程失败', error);

            // 🆕 队列优化：如果是中断错误，标记缓存失效
            if (error instanceof Error && error.name === 'AbortError' && currentFileRef.current) {
                logger.log('AI洞察', '请求被中断，标记缓存失效');
                CacheManager.invalidateInsightCache(currentFileRef.current);
            }

            // 返回错误节点
            return [
                {
                    id: 'error-node',
                    depth: 0,
                    title: '洞察生成失败',
                    columnsUsed: [],
                    promptId: '',
                    params: {},
                    isLoading: false,
                    error: `错误: ${String(error)}`,
                    drillDownActions: [],
                    children: [],
                    isExpanded: false
                }
            ];
        } finally {
            setIsLoading(false);
            setExecutionProgress(null);
        }
    };

    const cancelLoading = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    /**
     * 🆕 EDA 闭环：静默触发后续分析
     * 基于父卡片和 AnalysisContext 生成新推荐
     */
    const triggerFollowUp = async (parentNode: InsightNode) => {
        const MAX_DRILL_DEPTH = 3;

        // P0 防护：深度限制
        if (parentNode.depth >= MAX_DRILL_DEPTH) {
            logger.log('AI洞察', '已达最大下钻深度，跳过静默触发');
            return;
        }

        logger.log('AI洞察', '[SilentTrigger] 开始静默触发', {
            data: { parentId: parentNode.id, depth: parentNode.depth }
        });

        // 1. 创建 Loading 占位节点
        const loadingNodeId = `loading-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        // 使用 any 绕过类型检查 (insightTree vs insightChain 类型不兼容)
        const loadingNode: any = {
            id: loadingNodeId,
            depth: parentNode.depth + 1, // 下一层级
            parentId: parentNode.id,
            hypothesisId: (parentNode as any).hypothesisId || 'unknown',
            title: '正在生成关联推荐...',
            conclusion: '结合历史发现分析中...',
            columnsUsed: [],
            params: {},
            promptId: '',
            chartType: 'table',
            isLoading: true, // UI 组件需要识别此状态显示 Skeleton
            isAdopted: false,
            timestamp: Date.now(),
            code: '',
            codeLanguage: 'python'
        };

        addInsightNode(loadingNode as any); // 强制转换以兼容 InsightChain 类型

        // 使用请求队列串行执行
        try {
            await (async () => {
                // 确保上下文最新
                const analysisContext = getAdoptedInsights();

                // 准备数据
                const currentFile = currentFileRef.current;
                if (!currentFile || !currentFile.columns || !currentFile.tableName) {
                    throw new Error('缺少文件上下文数据');
                }

                const tableName = currentFile.tableName;  // 🆕 提取 tableName 供后续使用

                // 1. 构建 Router Prompt (含 Context)
                const prompt = buildRouterPrompt(
                    currentFile.columns,
                    [],
                    currentFile.columnTypes,
                    analysisContext
                );
                logger.log('AI洞察', '[SilentTrigger] Prompt 构建完成', {
                    data: { promptLength: prompt.length, contextCount: analysisContext.length }
                });

                // 2. 调用 AI 服务
                const { invokeAI } = await import('@/services/aiInvoker');
                const aiStartTime = performance.now();

                const aiResponse = await invokeAI(prompt, {
                    type: 'insight',
                    priority: 'normal' // 使用 normal 优先级
                });

                const aiDuration = (performance.now() - aiStartTime) / 1000;
                logger.log('AI洞察', `[SilentTrigger] AI响应收到`, {
                    data: { length: aiResponse.length, duration: aiDuration.toFixed(1) + 's' }
                });

                // 3. 解析响应
                let recommendations = parseRouterResponse(
                    aiResponse,
                    parentNode.columnsUsed || [] // 🆕 传递父节点使用的列名
                );

                // 🆕 注入统计参数（与主流程保持一致）
                try {
                    const db = DuckDBEngine.getInstance();
                    const columnStats = await db.getColumnStats(tableName);
                    const { injectStatsParams } = await import('@/services/prompts/paramInjector');
                    recommendations = injectStatsParams(recommendations, columnStats);
                    logger.log('AI服务', '[SilentTrigger] 参数注入完成');
                } catch (statsError) {
                    logger.warn('AI服务', '[SilentTrigger] 参数注入失败，使用 AI 原始参数');
                }

                if (recommendations.length === 0) {
                    logger.warn('AI洞察', '[SilentTrigger] AI未返回推荐');
                    // 移除 Loading 节点
                    updateInsightNode(loadingNodeId, {
                        title: '暂无更多推荐',
                        conclusion: '基于当前发现，暂无进一步分析建议',
                        isLoading: false
                    } as any);
                    return;
                }

                // 4. 膨胀为 InsightNode[] (🆕 传递 analysisContext)
                const newNodes = await inflateRecommendations(recommendations as any, tableName);  // 🆕 传递tableName

                // 设置 depth 和 parentId
                newNodes.forEach((node: any) => {
                    node.depth = parentNode.depth + 1;
                    node.parentId = parentNode.id;
                });

                logger.log('AI洞察', '[SilentTrigger] 膨胀完成', {
                    data: { count: newNodes.length }
                });

                // 5. 执行代码获取结果 (✅ 使用工具函数构建ExecutionContext)
                // ❌ 移除 'uploaded_data' 降级值 - 如果缺少tableName应该抛出错误
                if (!currentFile.tableName) {
                    throw new Error('[SilentTrigger] currentFile.tableName 为空，无法继续');
                }

                await executeBatchNodes(
                    newNodes,
                    buildEDAExecutionContext(currentFile.tableName),
                    (current, total) => {
                        logger.log('AI洞察', `[SilentTrigger] 执行进度 ${current}/${total}`);
                    }
                );

                // 6. 更新 Loading 节点为第一个结果，其他节点添加到树
                if (newNodes.length > 0) {
                    const firstNode = newNodes[0];
                    updateInsightNode(loadingNodeId, {
                        ...firstNode,
                        id: loadingNodeId, // 保持 ID 不变
                        isLoading: false
                    } as any);

                    // 添加其余节点
                    for (let i = 1; i < newNodes.length; i++) {
                        addInsightNode(newNodes[i] as any);
                    }
                }

                logger.log('AI洞察', '[SilentTrigger] 完成', {
                    data: { totalNodes: newNodes.length }
                });

            })();
        } catch (error) {
            logger.error('AI洞察', '[SilentTrigger] 触发失败', error);
            // 标记错误状态
            updateInsightNode(loadingNodeId, {
                title: '推荐生成失败',
                conclusion: String(error),
                isLoading: false,
                isError: true
            } as any);
        }
    };

    return {
        isLoading,
        executionProgress,
        loadingStage,
        loadInsights,
        cancelLoading,
        triggerFollowUp, // 🆕 导出方法
    };
}
