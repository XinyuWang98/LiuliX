/**
 * 洞察预加载完整链路（双模式 + 质量门控）
 * 
 * 完整7步流程：
 * 1. 读取配置（数据脱敏策略）
 * 2. AI生成洞察（双模式）
 * 3. 内存评估（基于AI选择的列）
 * 4. 质量门控过滤
 * 5. Skills执行（根据内存评估选择模式）
 * 6. 结果缓存
 * 7. 增量更新支持
 */

import { logger } from './logger';
import { ProjectFile } from './projectUtils';
import { sampleDataForAI } from './sampleData';
import { prepareAIInput } from './dataPrivacy';
import { generateBatchInsightsPrompt, parseBatchInsightsResponse } from '@/services/prompts/batchInsightGenerator';
import { askAIInsight } from '@/services/aiService';
import { localLLMService } from '@/services/localLLMService';
import { assessMemoryBeforeExecution } from './memoryAssessment';
import { batchValidateInsights } from './qualityGate';
import { getFallbackInsights } from './fallbackTemplates';
import { executeInsightWithMode } from '@/services/skills/modeExecutor';

const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30分钟缓存有效期

/**
 * L1缓存：精确匹配缓存检查
 */
export function hasValidInsightCache(file: ProjectFile): boolean {
    const cache = file.analysisCache?.insight;
    if (!cache || !cache.prefetchedSuggestions) return false;

    // 检查是否过期
    if (cache.isStale) return false;

    // 检查缓存时间
    const now = Date.now();
    const generatedAt = cache.generatedAt || 0;
    if (now - generatedAt > CACHE_EXPIRY_MS) return false;

    return cache.status === 'ready' && cache.prefetchedSuggestions.length > 0;
}

/**
 * 后台预加载完整7步链路
 */
export async function prefetchInsightsForFile(
    file: ProjectFile,
    projectId: string,
    fileIndex: number,
    setProjects: (updater: (projects: any[]) => any[]) => void,
    saveProjects: (projects: any[]) => Promise<void>
): Promise<void> {
    try {
        // L1检查：如果已有有效缓存，跳过
        if (hasValidInsightCache(file)) {
            logger.log('AI洞察预加载', `L1缓存命中: ${file.data.fileName}`);
            return;
        }

        logger.group('AI洞察预加载', `开始预生成: ${file.data.fileName}`);

        const tableName = file.data.tableName!;
        const totalRows = file.data.rowCount;
        const columns = file.data.columns;

        // ========== 步骤1：数据采样 + 脱敏 ==========
        const { sampledData } = await sampleDataForAI(tableName, 1000);
        const { mode: privacyMode } = await prepareAIInput(tableName, sampledData, totalRows);

        // ========== 步骤2：AI生成洞察（双模式） ==========
        const useLocalModel = localStorage.getItem('use_local_model') === 'true';
        const prompt = generateBatchInsightsPrompt(
            columns,
            sampledData.length,
            totalRows,
            privacyMode === 'auto_sanitize' ? [] : sampledData
        );

        let aiResponse: string;
        if (useLocalModel && localLLMService.getStatus().isReady) {
            aiResponse = await localLLMService.generateInsight(prompt);
        } else {
            const result = await askAIInsight(prompt);
            aiResponse = result.content;
        }

        let insightSuggestions = parseBatchInsightsResponse(aiResponse);
        if (insightSuggestions.length === 0) {
            logger.warn('AI洞察预加载', '使用预置模板');
            insightSuggestions = getFallbackInsights();
        }

        // ========== 步骤3：质量门控 ==========
        const validated = batchValidateInsights(insightSuggestions);
        if (validated.length === 0) {
            logger.warn('AI洞察预加载', '质量门控全拒，使用预置模板');
            insightSuggestions = getFallbackInsights();
        } else {
            insightSuggestions = validated.map(v => v.insight);
        }

        // ========== 步骤4-6：内存评估 + Skills执行 ==========
        const executedInsights: any[] = [];
        for (let i = 0; i < Math.min(insightSuggestions.length, 5); i++) {
            const suggestion = insightSuggestions[i];

            // 内存评估
            const assessment = await assessMemoryBeforeExecution(
                totalRows,
                suggestion.columns_used || []
            );

            // Skills执行
            const result = await executeInsightWithMode(
                suggestion,
                assessment.mode,
                tableName
            );

            if (result.success) {
                executedInsights.push({
                    ...suggestion,
                    executionMode: assessment.mode,
                    executionResult: result.data
                });
            }
        }

        // ========== 步骤7：缓存结果 ==========
        setProjects(currentProjects => {
            const targetProject = currentProjects.find((p: any) => p.id === projectId);
            if (!targetProject) return currentProjects;

            const updatedFiles = targetProject.files.map((f: any, idx: number) => {
                if (idx === fileIndex) {
                    return {
                        ...f,
                        analysisCache: {
                            ...f.analysisCache,
                            insight: {
                                ...f.analysisCache?.insight,
                                prefetchedSuggestions: executedInsights,
                                status: 'ready' as const,
                                isStale: false,
                                generatedAt: Date.now()
                            }
                        }
                    };
                }
                return f;
            });

            const finalProjects = currentProjects.map((p: any) =>
                p.id === projectId ? { ...p, files: updatedFiles } : p
            );
            saveProjects(finalProjects).catch(err => logger.warn('文件管理', 'IDB保存失败', err));
            return finalProjects;
        });

        logger.log('AI洞察预加载', `完成: ${file.data.fileName}`, { count: executedInsights.length });
        logger.groupEnd();

    } catch (err) {
        logger.groupEnd();
        logger.warn('AI洞察预加载', `失败（不影响主流程）: ${file.data.fileName}`, err);
    }
}

/**
 * L3：数据清洗后标记缓存失效（增量更新）
 */
export function invalidateInsightCache(
    projectId: string,
    fileId: string,
    setProjects: (updater: (projects: any[]) => any[]) => void
): void {
    logger.log('AI洞察预加载', `L3缓存失效: 项目${projectId} 文件${fileId}`);

    setProjects(currentProjects => {
        return currentProjects.map((p: any) => {
            if (p.id === projectId) {
                return {
                    ...p,
                    files: p.files.map((f: any) => {
                        if (f.id === fileId && f.analysisCache?.insight) {
                            return {
                                ...f,
                                analysisCache: {
                                    ...f.analysisCache,
                                    insight: {
                                        ...f.analysisCache.insight,
                                        isStale: true
                                    }
                                }
                            };
                        }
                        return f;
                    })
                };
            }
            return p;
        });
    });
}
