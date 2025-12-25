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
import { validateExecutionResult } from '@/utils/postExecutionGate';
import { useI18n } from '@/contexts/I18nContext';

import { CacheManager } from '../utils/cacheManager';

export function useInsightLoaderV2() {
    const { t } = useI18n();  // 获取i18n翻译函数
    const [loadingStage, setLoadingStage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLocalModel, setIsLoadingLocalModel] = useState(false);
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
        fileName?: string,  // 🆕 文件名参数
        currentFile?: any  // 🆕 当前文件对象（用于缓存管理）
    ): Promise<HypothesisCardType[]> => {
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

            // ========== 🆕 步骤1.5：列数限制（避免Prompt过大）==========
            const MAX_COLUMNS = 50;
            let 选中列名 = 有效列名;
            if (有效列名.length > MAX_COLUMNS) {
                选中列名 = 有效列名.slice(0, MAX_COLUMNS);
                logger.warn('AI洞察', `列数过多，限制到${MAX_COLUMNS}列`, {
                    data: { original: 有效列名.length, limited: 选中列名.length }
                });
            }

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
            let aiResponse: string = ''; // 初始化为空字符串，避免未赋值错误

            // 构造Prompt（传入totalRows，使用限制后的列名）
            const prompt = generateBatchInsightsPrompt(
                选中列名,  // ✅ 使用限制后的列名
                采样数据.length,
                totalRows,
                privacyMode === 'auto_sanitize' ? [] : 采样数据,  // 脱敏模式下传空
                t  // i18n翻译函数
            );

            if (useLocalModel) {
                // ✅ 检查GPU是否可用（及是否为软件模拟）
                setLoadingStage('progress.sendingRequest');
                let hasEnoughMemory = true;

                try {
                    if ('gpu' in navigator) {
                        const adapter = await (navigator as any).gpu.requestAdapter();
                        if (adapter && adapter.limits) {
                            // 修正：maxBufferSize是单个Buffer限制（通常2GB），不代表总显存
                            // 只要不是软件模拟适配器(isFallbackAdapter)，且maxBufferSize >= 1GB，就尝试运行
                            const isSoftware = (adapter as any).isFallbackAdapter;
                            const maxBufferSize = adapter.limits.maxBufferSize || 0;
                            const bufferLimitMB = maxBufferSize / (1024 * 1024);

                            logger.log('本地模型', `GPU能力检测`, {
                                data: {
                                    isSoftware,
                                    bufferLimit: `${bufferLimitMB.toFixed(0)}MB`,
                                    description: (adapter as any).info?.description || 'Unknown' // 如果支持
                                }
                            });

                            // 宽松策略：只要不是软件模拟且Buffer限制>1GB，就认为可以尝试
                            // 真正的OOM由WebLLM内部捕获
                            if (isSoftware || bufferLimitMB < 1000) {
                                hasEnoughMemory = false;
                                logger.warn('本地模型', `GPU能力不足（软件模拟或显存过小），降级到API模式`);
                            } else {
                                hasEnoughMemory = true;
                                logger.log('本地模型', `GPU检测通过，准备加载模型`);
                            }
                        }
                    }
                } catch (err) {
                    logger.warn('本地模型', 'GPU检测失败，降级到API模式', err);
                    hasEnoughMemory = false;
                }

                const status = localLLMService.getStatus();
                if (hasEnoughMemory && !status.isReady && !status.isInitializing) {
                    setIsLoadingLocalModel(true);
                    await localLLMService.reload(SUPPORTED_MODELS.QWEN);
                }

                // 🔄 使用本地模型生成
                if (localStorage.getItem('use_local_model') === 'true') {
                    const localStatus = localLLMService.getStatus();
                    if (hasEnoughMemory && localStatus.isReady) {
                        aiResponse = await localLLMService.generateInsight(prompt);
                    } else if (hasEnoughMemory) {
                        // 🔄 模型正在预加载中，等待最多30秒
                        logger.log('本地模型', '等待预加载完成...');
                        const maxWaitTime = 30000; // 30秒
                        const checkInterval = 1000; //  1秒
                        const startTime = Date.now();

                        let modelReady = false;
                        while (Date.now() - startTime < maxWaitTime) {
                            const currentStatus = localLLMService.getStatus();
                            if (currentStatus.isReady) {
                                logger.log('本地模型', '预加载完成，继续生成');
                                aiResponse = await localLLMService.generateInsight(prompt);
                                modelReady = true;
                                break;
                            }
                            // 等待1秒后重试
                            await new Promise(resolve => setTimeout(resolve, checkInterval));
                        }


                        // 如果超时仍未就绪
                        if (!modelReady) {
                            throw new Error('本地模型加载超时（30秒），请刷新页面重试');
                        }
                    } else {
                        // 降级到云端API
                        logger.warn('本地模型', '本地模型未就绪，降级到云端API');
                        const aiResult = await askAIInsight(prompt);
                        aiResponse = aiResult.content;
                    }
                }
                setIsLoadingLocalModel(false); // 无论成功失败，都关闭加载状态
            } else {
                // 使用云端API
                setLoadingStage('progress.sendingRequest');
                const aiResult = await askAIInsight(prompt);
                aiResponse = aiResult.content;
            }

            // ========== 步骤4：解析AI响应（双模式） ==========
            setLoadingStage('progress.analyzingResponse');
            let insightSuggestions = parseBatchInsightsResponse(aiResponse);

            if (insightSuggestions.length === 0) {
                logger.warn('AI洞察', 'AI未返回有效建议，使用预置模板');
                insightSuggestions = getFallbackInsights() as InsightSuggestion[];
            }

            logger.log('AI洞察', '解析成功', { data: { count: insightSuggestions.length } });

            // ========== 步骤5：质量门控（过滤低质量） ==========
            setLoadingStage('progress.validating');
            const { passed: validated, rejected } = batchValidateInsights(insightSuggestions);

            // 📊 产品分析：记录被拒绝数量（未来可展示"AI探索日志"）
            if (rejected.length > 0) {
                logger.log('AI服务', `质量门控拒绝了${rejected.length}个低质量洞察`, {
                    data: {
                        rejectedTitles: rejected.map(r => r.insight.title),
                        rejectedReasons: rejected.map(r => r.score.reasons?.join(', ') || '未知')
                    }
                });
            }

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
                setLoadingStage('progress.generatingInsight');

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
                    // ========== 执行后质量评估 ==========
                    const postScore = validateExecutionResult(
                        suggestion,
                        {
                            image: result.data?.image || '',
                            summary: result.data?.summary || ''
                        }
                    );

                    if (postScore.passed) {
                        // ✅ 高价值洞察 - 展示给用户
                        validCount++;
                        洞察卡片.push({
                            id: `insight-${Date.now()}-${i}`,
                            title: suggestion.title,
                            description: suggestion.description,
                            verificationMethod: `执行模式：${assessment.mode}`,
                            fileName: fileName,  // 🆕 添加文件名
                            columnsUsed: suggestion.columns_used || [],  // 🆕 添加列名
                            isExpanded: false,
                            executionResult: {
                                image: result.data?.image || '',
                                summary: result.data?.summary || '',
                                code: suggestion.full_mode.code
                            },
                            executionStatus: 'success'
                        });
                    } else {
                        // ⚠️ 低价值洞察 - 记录到日志，不展示
                        logger.log('AI服务', `洞察${i + 1}质量不足，不展示`, {
                            data: {
                                title: suggestion.title,
                                score: postScore.total,
                                reasons: postScore.reasons
                            }
                        });
                    }
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

            // 🆕 队列优化：更新缓存时间戳
            if (currentFileRef.current) {
                CacheManager.updateInsightTimestamp(currentFileRef.current);
            }

            logger.groupEnd();

            return 洞察卡片;

        } catch (error) {
            logger.groupEnd();
            logger.error('AI洞察', '流程失败', error);

            // 🆕 队列优化：如果是中断错误，标记缓存失效
            if (error instanceof Error && error.name === 'AbortError' && currentFileRef.current) {
                logger.log('AI洞察', '请求被中断，标记缓存失效');
                CacheManager.invalidateInsightCache(currentFileRef.current);
            }

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
        loadingStage,
        loadInsights,
        cancelLoading,
    };
}
