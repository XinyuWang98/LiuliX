/**
 * 洞察加载 Hook (集成版 - 双模式Skills + QualityGate)
 * 负责：数据脱敏、内存评估、AI双模式、Skills执行、质量门控
 */
import { useState, useRef } from 'react';
import { InsightNode } from '@/types/insightTree';
import { ProjectFile } from '@/utils/projectUtils';
import { sampleDataForAI } from '@/utils/sampleData';
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
import { getAnalysisConfig } from '@/config/analysisConfig';

export function useInsightLoaderV2() {
    const [loadingStage, setLoadingStage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [executionProgress, setExecutionProgress] = useState<{ current: number; total: number } | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const currentFileRef = useRef<any>(null);  // 🆕 追踪当前处理的文件

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
            let 有效列名: string[] = columns || [];
            let totalRows = rowCount || 0;

            if (有效列名.length === 0 && tableName) {
                const engine = DuckDBEngine.getInstance();
                await engine.init();
                const describeResult = await engine.runQuery(`DESCRIBE ${tableName}`);
                有效列名 = describeResult.map((row: any) => row.column_name);

                // 获取总行数
                const countResult = await engine.runQuery(`SELECT COUNT(*) as cnt FROM ${tableName}`);
                totalRows = countResult[0]?.cnt || 0;
            }

            logger.log('AI洞察', '数据规模', { data: { columns: 有效列名.length, totalRows } });

            // ========== 🆕 步骤1.5：列数限制（应用角色配置）==========
            const analysisConfig = getAnalysisConfig();
            const MAX_COLUMNS = analysisConfig.maxColumns; // 数据分析师50列，业务专家20列
            let 选中列名 = 有效列名;
            if (有效列名.length > MAX_COLUMNS) {
                选中列名 = 有效列名.slice(0, MAX_COLUMNS);
                logger.warn('AI洞察', `列数过多，限制到${MAX_COLUMNS}列`, {
                    data: { original: 有效列名.length, limited: 选中列名.length }
                });
            }

            // ========== 步骤2：数据采样（应用角色配置）==========
            let 采样数据: any[] = [];
            if (tableName) {
                const SAMPLE_ROWS = analysisConfig.samplingRows; // 数据分析师100行，业务专家30行
                const { sampledData } = await sampleDataForAI(tableName, SAMPLE_ROWS);
                采样数据 = sampledData;
            }


            // ========== 步骤2.5：数据脱敏（使用统一工具） ==========
            // 获取列信息用于脱敏
            let 列信息: any[] = [];
            let 统计信息: any[] = [];
            if (tableName) {
                try {
                    const engine = DuckDBEngine.getInstance();
                    const describeResult = await engine.runQuery(`DESCRIBE ${tableName}`);
                    列信息 = describeResult.map((row: any) => ({
                        name: row.column_name,
                        type: row.column_type
                    }));
                    // 从采样数据构造基础统计
                    统计信息 = 列信息.map((col: any) => {
                        const values = 采样数据.map((row: any) => row[col.name]);
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
                列信息,
                统计信息,
                采样数据,
                {
                    respectUserSettings: true,
                    intelligentDetection: true,
                    granularity: 'coarse'  // 洞察使用粗粒度
                }
            );

            logger.log('数据隐私', `脱敏完成 模式=${privacyMode}`, {
                data: { columns: 列信息.length, mode: privacyMode }
            });

            // ========== 步骤3：AI生成洞察（双模式） ==========

            // ✅ 获取列类型信息（Router 模式需要）
            let columnTypes: Record<string, string> | undefined;
            if (tableName) {
                try {
                    const engine = DuckDBEngine.getInstance();
                    const describeResult = await engine.runQuery(`DESCRIBE ${tableName}`);
                    columnTypes = Object.fromEntries(
                        describeResult.map((row: any) => [row.column_name, row.column_type])
                    );
                } catch (e) {
                    logger.warn('AI洞察', 'Failed to get column types');
                }
            }

            // ✅ 构造 Router Prompt（使用新架构）
            const USE_ROUTER_MODE = true; // 🎯 切换开关

            let prompt: string;
            if (USE_ROUTER_MODE) {
                prompt = buildRouterPrompt(
                    选中列名,
                    privacyMode === 'sanitized' ? [] : 采样数据,
                    columnTypes
                );
                logger.log('AI服务', '[Router] 使用 Router Prompt 模式');
            } else {
                // 旧版 Coder Prompt（保留兼容）
                prompt = generateBatchInsightsPrompt(
                    选中列名,
                    采样数据.length,
                    totalRows,
                    privacyMode === 'sanitized' ? [] : 采样数据
                );
                logger.log('AI服务', '[Coder] 使用传统 Coder Prompt 模式');
            }


            // ========== 步骤3.5：使用统一AI调用（自动降级） ==========
            setLoadingStage('progress.sendingRequest');
            const aiStartTime = performance.now();

            const { invokeAI } = await import('@/services/aiInvoker');
            const aiResponse = await invokeAI(prompt, {
                type: 'insight',
                priority: 'normal'
            });

            const aiDuration = (performance.now() - aiStartTime) / 1000;
            logger.log('AI洞察', `AI响应收到 (${aiResponse.length}字符，耗时${aiDuration.toFixed(1)}秒)`);

            // ========== 步骤4：解析AI响应并膨胀为 InsightNode[] ==========
            setLoadingStage('progress.analyzingResponse');
            let insightNodes: InsightNode[] = [];

            if (USE_ROUTER_MODE) {
                // ✅ Router 模式：解析轻量 JSON → 膨胀为完整节点
                const recommendations = parseRouterResponse(aiResponse);

                if (recommendations.length === 0) {
                    logger.warn('AI服务', '[Router] AI未返回推荐，使用规则层兜底');
                    const fallbackRecs = buildFallbackRecommendations(选中列名, columnTypes);
                    insightNodes = await inflateRecommendations(fallbackRecs as any);
                } else {
                    logger.log('AI服务', '[Router] 解析成功', { data: { count: recommendations.length } });
                    insightNodes = await inflateRecommendations(recommendations as any);
                }
            } else {
                // 旧版 Coder 模式（需要转换为 InsightNode）
                const insightSuggestions = parseBatchInsightsResponse(aiResponse);

                if (insightSuggestions.length === 0) {
                    logger.warn('AI洞察', 'AI未返回有效建议，使用预置模板');
                    const fallback = getFallbackInsights();
                    // 转换为 InsightNode 格式
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
                            rawCode: sugg.full_mode.code,  // ✅ 保留纯净代码（fallback无增强）
                            summary: '',
                            columnsUsed: sugg.columns_used || []
                        }
                    }));
                    logger.log('AI洞察', '解析成功', { data: { count: insightNodes.length } });
                }
            }

            // ========== 步骤5：执行代码并填充结果（使用公共执行器）==========
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

                const validationResult = validateColumnsExist(paramsToValidate, 有效列名);

                if (!validationResult.valid) {
                    logger.warn('AI洞察', `跳过无效列名的洞察: ${node.title}`, {
                        data: { invalidColumns: validationResult.invalidColumns, validColumns: 有效列名 }
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
                }
            );

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

    return {
        isLoading,
        executionProgress,
        loadingStage,
        loadInsights,
        cancelLoading,
    };
}
