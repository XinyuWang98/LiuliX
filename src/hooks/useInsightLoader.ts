/**
 * 洞察加载 Hook
 * 负责：DuckDB查询、数据采样、AI调用（本地/云端）、Pyodide执行
 */
import { useState, useRef } from 'react';
import { HypothesisCard as HypothesisCardType } from '@/types/insightChain';
import { askAIInsight } from '@/services/aiService';
import { sampleDataForAI } from '@/utils/sampleData';
import { DuckDBEngine } from '@/db/duckdbEngine';
import { generateBatchInsightsPrompt, parseBatchInsightsResponse } from '@/services/prompts/batchInsightGenerator';
import { executeBatchInsights } from '@/services/insightExecutor';
import { logger } from '@/utils/logger';
import { localLLMService, SUPPORTED_MODELS } from '@/services/localLLMService';

export function useInsightLoader() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLocalModel, setIsLoadingLocalModel] = useState(false);
    const [executionProgress, setExecutionProgress] = useState<{ current: number; total: number } | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * 加载洞察假设
     */
    const loadInsights = async (
        columns: string[],
        rowCount: number,
        tableName?: string
    ): Promise<HypothesisCardType[]> => {
        setIsLoading(true);
        setExecutionProgress(null);

        // 创建新的 AbortController
        abortControllerRef.current = new AbortController();

        try {
            logger.group('AI洞察', '批量洞察生成流程');
            logger.log('AI洞察', '流程启动', { count: columns?.length || 0 });

            // 步骤1：获取有效列名（从 DuckDB 动态获取）
            let 有效列名: string[] = columns || [];
            if (有效列名.length === 0 && tableName) {
                logger.log('DuckDB', '从DESCRIBE获取列信息', { data: tableName });
                try {
                    const engine = DuckDBEngine.getInstance();
                    await engine.init();
                    const describeResult = await engine.runQuery(`DESCRIBE ${tableName}`);
                    有效列名 = describeResult.map((row: any) => row.column_name);
                    logger.log('DuckDB', 'DESCRIBE成功', { count: 有效列名.length });
                } catch (describeError) {
                    logger.log('DuckDB', 'DESCRIBE失败', { data: String(describeError) });
                }
            }

            logger.log('AI洞察', '最终列数', { count: 有效列名.length });

            // 步骤2：准备采样数据
            let 采样数据: any[] = [];
            try {
                if (tableName) {
                    const { sampledData } = await sampleDataForAI(tableName, 1000);
                    采样数据 = sampledData;
                    logger.log('AI洞察', '数据采样成功', { count: 采样数据.length });
                }
            } catch (采样错误) {
                logger.log('AI洞察', '数据采样失败', { data: String(采样错误) });
            }

            // 步骤3：检查是否启用本地模型
            const useLocalModel = localStorage.getItem('use_local_model') === 'true';
            let aiResponse: string;

            if (useLocalModel) {
                logger.log('本地模型', '本地模型已启用，检查状态');
                const status = localLLMService.getStatus();

                // 如果模型未就绪，先加载
                if (!status.isReady && !status.isInitializing) {
                    try {
                        setIsLoadingLocalModel(true);
                        logger.log('本地模型', '开始加载', { data: SUPPORTED_MODELS.QWEN });
                        await localLLMService.reload(SUPPORTED_MODELS.QWEN);
                        logger.log('本地模型', '模型加载完成');
                        setIsLoadingLocalModel(false);
                        console.log('✅ 本地模型就绪，洞察分析超快！');
                    } catch (loadError) {
                        logger.error('本地模型', '加载失败，降级DeepSeek', loadError);
                        setIsLoadingLocalModel(false);
                        // 降级到云端
                        const prompt = generateBatchInsightsPrompt(有效列名, rowCount || 0, 采样数据);
                        const aiResult = await askAIInsight(prompt);
                        aiResponse = aiResult.content;
                    }
                }

                // 使用本地模型生成
                const localStatus = localLLMService.getStatus();
                if (localStatus.isReady) {
                    logger.log('本地模型', '使用本地模型生成洞察');
                    const prompt = generateBatchInsightsPrompt(有效列名, rowCount || 0, 采样数据);
                    aiResponse = await localLLMService.generateInsight(prompt);
                    logger.log('本地模型', '本地生成完成');
                } else {
                    logger.warn('本地模型', '模型未就绪，降级DeepSeek');
                    const prompt = generateBatchInsightsPrompt(有效列名, rowCount || 0, 采样数据);
                    const aiResult = await askAIInsight(prompt);
                    aiResponse = aiResult.content;
                }
            } else {
                // 使用云端模型（DeepSeek）
                logger.log('AI洞察', '使用云端模型（DeepSeek）');
                const prompt = generateBatchInsightsPrompt(有效列名, rowCount || 0, 采样数据);
                const aiResult = await askAIInsight(prompt);
                aiResponse = aiResult.content;
            }

            // 步骤4：解析AI响应
            const insightSuggestions = parseBatchInsightsResponse(aiResponse);

            if (insightSuggestions.length === 0) {
                throw new Error('AI未返回有效的洞察建议');
            }

            logger.log('AI洞察', 'AI生成成功', { count: insightSuggestions.length });

            // 步骤5：加载数据到Pyodide（关键！）
            logger.log('Python', '加载数据到Pyodide环境');
            if (tableName && 采样数据.length > 0) {
                try {
                    await (window as any).pyodideManager.loadDataFromJSON(采样数据);
                    logger.log('Python', '数据加载成功', { count: 采样数据.length });
                } catch (loadError) {
                    logger.log('Python', '数据加载失败', { data: String(loadError) });
                    throw new Error('无法加载数据到Pyodide');
                }
            } else {
                logger.log('Python', '跳过数据加载（无tableName或采样数据）');
            }

            // 步骤6：批量执行Python代码（串行，显示进度）
            logger.log('Python', 'Pyodide批量执行开始', { count: insightSuggestions.length });

            const codes = insightSuggestions.map(s => s.code);
            const results = await executeBatchInsights(codes, (current, total) => {
                logger.log('Python', '执行进度更新', { count: current, data: `${current}/${total}` });
                setExecutionProgress({ current, total });
            });

            logger.log('Python', 'Pyodide批量执行完成', {
                count: results.filter(r => r !== null).length,
                data: { failed: results.filter(r => r === null).length }
            });

            // 步骤7：组装卡片（含执行结果）
            const 洞察卡片: HypothesisCardType[] = insightSuggestions.map((suggestion, idx) => ({
                id: `insight-${Date.now()}-${idx}`,
                title: suggestion.title,
                description: suggestion.description,
                verificationMethod: '点击查看图表和统计结果',
                isExpanded: false,
                executionResult: results[idx] ? {
                    image: results[idx]!.image,
                    summary: results[idx]!.summary,
                    code: suggestion.code
                } : undefined,
                executionStatus: results[idx] ? 'success' : 'error'
            }));

            logger.log('UI', '洞察卡片组装完成', { count: 洞察卡片.length });
            logger.groupEnd();

            return 洞察卡片;

        } catch (AI错误) {
            // 降级：AI失败时使用Mock数据（保证UI不崩溃）
            logger.groupEnd();
            logger.log('AI服务', 'AI生成失败，降级Mock', { data: String(AI错误) });

            const mockHypotheses: HypothesisCardType[] = [
                {
                    id: 'hyp-mock-0',
                    title: '数值字段存在异常值 (Mock)',
                    description: '数据中可能存在超出正常范围的异常值，影响统计分析准确性',
                    verificationMethod: '使用箱线图检测异常值分布',
                    isExpanded: false,
                    executionStatus: 'error'
                },
                {
                    id: 'hyp-mock-1',
                    title: '关键字段缺失率偏高 (Mock)',
                    description: '部分重要字段的缺失比例超过阈值，需要补全或删除',
                    verificationMethod: '计算各字段缺失率并可视化',
                    isExpanded: false,
                    executionStatus: 'error'
                },
            ];

            return mockHypotheses;
        } finally {
            setIsLoading(false);
            setExecutionProgress(null);
        }
    };

    /**
     * 取消加载
     */
    const cancelLoading = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    return {
        isLoading,
        isLoadingLocalModel,
        executionProgress,
        loadInsights,
        cancelLoading,
    };
}
