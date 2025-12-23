/**
 * 洞察加载 Hook (集成版 - 双模式Skills + QualityGate)
 * 负责：数据脱敏、内存评估、AI双模式、Skills执行、质量门控
 */
import { useState, useRef } from 'react';
import { HypothesisCard as HypothesisCardType } from '@/types/insightChain';
import { askAIInsight } from '@/services/aiService';
import { sampleDataForAI } from '@/utils/sampleData';
import { DuckDBEngine } from '@/db/duckdbEngine';
import { generateBatchInsightsPrompt, parseBatchInsightsResponse, InsightSuggestion } from '@/services/prompts/batchInsightGenerator';
import { logger } from '../utils/logger';
import { localLLMService, SUPPORTED_MODELS } from '@/services/localLLMService';
import { prepareAIInput } from '@/utils/dataPrivacy';
import { assessMemoryBeforeExecution } from '@/utils/memoryAssessment';
import { executeInsightWithMode } from '@/services/skills/modeExecutor';
import { batchValidateInsights } from '@/utils/qualityGate';
import { getFallbackInsights } from '@/utils/fallbackTemplates';
import { RESOURCE_LIMITS, checkAvailableMemory } from '@/utils/resourceLimits';

export function useInsightLoader() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLocalModel, setIsLoadingLocalModel] = useState(false);
    const [executionProgress, setExecutionProgress] = useState<{ current: number; total: number } | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * 加载洞察假设（集成版）
     */
    const loadInsights = async (
        columns: string[],
        rowCount: number,
        tableName?: string
    ): Promise<HypothesisCardType[]> => {
        setIsLoading(true);
        setExecutionProgress(null);

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

            // ========== 步骤2：数据采样 ==========
            let 采样数据: any[] = [];
            if (tableName) {
                const { sampledData } = await sampleDataForAI(tableName, 1000);
                采样数据 = sampledData;
            }

            // ========== 步骤2.5：数据脱敏检查 ==========
            const { mode: privacyMode } = await prepareAIInput(
                tableName || '',
                采样数据,
                totalRows
            );

            // ========== 步骤3：AI生成洞察（双模式） ==========
            const useLocalModel = localStorage.getItem('use_local_model') === 'true';
            let aiResponse: string;

            // 构造Prompt（传入totalRows）
            const prompt = generateBatchInsightsPrompt(
                有效列名,
                采样数据.length,
                totalRows,
                privacyMode === 'auto_sanitize' ? [] : 采样数据  // 脱敏模式下传空
            );

            if (useLocalModel) {
                const status = localLLMService.getStatus();
                if (!status.isReady && !status.isInitializing) {
                    setIsLoadingLocalModel(true);
                    await localLLMService.reload(SUPPORTED_MODELS.QWEN);
                    setIsLoadingLocalModel(false);
                }

                const localStatus = localLLMService.getStatus();
                if (localStatus.isReady) {
                    aiResponse = await localLLMService.generateInsight(prompt);
                } else {
                    const aiResult = await askAIInsight(prompt);
                    aiResponse = aiResult.content;
                }
            } else {
                const aiResult = await askAIInsight(prompt);
                aiResponse = aiResult.content;
            }

            // ========== 步骤4：解析AI响应（双模式） ==========
            let insightSuggestions = parseBatchInsightsResponse(aiResponse);

            if (insightSuggestions.length === 0) {
                logger.warn('AI洞察', 'AI未返回有效建议，使用预置模板');
                insightSuggestions = getFallbackInsights() as InsightSuggestion[];
            }

            logger.log('AI洞察', '解析成功', { data: { count: insightSuggestions.length } });

            // ========== 步骤5：质量门控（过滤低质量） ==========
            const validated = batchValidateInsights(insightSuggestions);

            if (validated.length === 0) {
                logger.warn('AI服务', '质量门控全部被拒绝，使用预置模板');
                insightSuggestions = getFallbackInsights();
            } else {
                insightSuggestions = validated.map(v => v.insight);
            }

            // ========== 步骤6：批量内存评估与Skills执行 ==========
            const 洞察卡片: HypothesisCardType[] = [];
            let validCount = 0;

            // ⚠️ 安全限制：最多执行5个洞察
            const maxInsights = Math.min(
                insightSuggestions.length,
                RESOURCE_LIMITS.SAFETY_LIMITS.MAX_INSIGHTS_PER_RUN
            );

            for (let i = 0; i < maxInsights; i++) {
                const suggestion = insightSuggestions[i];

                // 更新进度
                setExecutionProgress({ current: i + 1, total: maxInsights });

                // ⚠️ 执行中内存监控：每2个洞察检查一次
                if (i % 2 === 0 && i > 0) {
                    const freeMemory = checkAvailableMemory();
                    if (freeMemory < RESOURCE_LIMITS.SAFETY_LIMITS.MIN_FREE_MEMORY) {
                        logger.warn('AI服务', `内存不足，停止执行剩余${maxInsights - i}个洞察`);
                        break;
                    }
                }

                // 6.1 内存评估
                const assessment = await assessMemoryBeforeExecution(
                    totalRows,
                    suggestion.columns_used || []
                );

                logger.log('AI服务', `洞察${i + 1}: ${assessment.mode}模式`, {
                    data: { memory: `${assessment.estimatedMemory.toFixed(0)}MB` }
                });

                // 6.2 执行对应模式
                const result = await executeInsightWithMode(
                    suggestion,
                    assessment.mode,
                    tableName || ''
                );

                if (result.success) {
                    validCount++;
                    洞察卡片.push({
                        id: `insight-${Date.now()}-${i}`,
                        title: suggestion.title,
                        description: suggestion.description,
                        verificationMethod: `执行模式：${assessment.mode}`,
                        isExpanded: false,
                        executionResult: {
                            image: result.data?.image || '',
                            summary: result.data?.summary || '',
                            code: suggestion.full_mode.code
                        },
                        executionStatus: 'success'
                    });
                } else {
                    logger.warn('Skills', `洞察${i + 1}执行失败`, { data: result.error });
                }
            }

            // ========== 步骤7：检查是否全部失败 ==========
            if (validCount === 0) {
                logger.warn('Skills', '所有洞察执行失败，使用预置模板');
                const fallback = getFallbackInsights() as InsightSuggestion[];

                // 执行fallback（使用full模式）
                for (let i = 0; i < Math.min(fallback.length, 3); i++) {
                    const fb = fallback[i];
                    const result = await executeInsightWithMode(fb, 'full', tableName || '');

                    if (result.success) {
                        洞察卡片.push({
                            id: `fallback-${i}`,
                            title: fb.title,
                            description: fb.description,
                            verificationMethod: '预置模板',
                            isExpanded: false,
                            executionResult: {
                                image: result.data?.image || '',
                                summary: result.data?.summary || '',
                                code: fb.full_mode.code
                            },
                            executionStatus: 'success'
                        });
                    }
                }
            }

            logger.log('AI洞察', `完成：生成${validCount}条有效洞察`);
            logger.groupEnd();

            return 洞察卡片;

        } catch (error) {
            logger.groupEnd();
            logger.error('AI洞察', '流程失败', error);

            // Mock降级
            return [
                {
                    id: 'mock-error',
                    title: '洞察生成失败',
                    description: `错误: ${String(error)}`,
                    verificationMethod: '请检查数据或重试',
                    isExpanded: false,
                    executionStatus: 'error'
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
        isLoadingLocalModel,
        executionProgress,
        loadInsights,
        cancelLoading,
    };
}
