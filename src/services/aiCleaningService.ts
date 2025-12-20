/**
 * AI清洗建议服务（集成版）
 * 包含数据脱敏、AI调用、三层校验、降级机制、大文件采样
 */

import { askAI } from './aiService';
import type { CleaningSuggestion } from './aiService';
import { buildDesensitizedMetadata, generateQualityIssues } from '@/utils/dataSanitizer';
import { buildCleaningPrompt } from './prompts/cleaningSuggestions';
import { validateAIResponse, validateSQLSafety, validateWithDryRun } from '@/utils/sqlValidator';
import { sampleDataForAI } from '@/utils/sampleData'; // 🚀 数据采样工具

export { type CleaningSuggestion } from './aiService';

/**
 * 生成AI清洗建议（完整版）
 */
/**
 * 生成AI清洗建议（完整版）
 */
export async function generateAICleaningSuggestions(
    tableName: string,
    columns: any[],
    stats: any[],
    t: (key: string, params?: Record<string, any>) => string,
    duckdbEngine?: any,
    onProgress?: (progressMsg: string) => void,  // 进度回调
    onSuggestionUpdate?: (suggestions: CleaningSuggestion[]) => void, // 增量更新回调
    language: string = 'Chinese (Simplified)' // Default to Chinese
): Promise<CleaningSuggestion[]> {

    try {
        // 1. 数据脱敏
        const step1 = t('cleaning.desensitizing');
        console.log('[AI清洗] Step 1/4:', step1);
        onProgress?.(step1);

        const desensitizedData = buildDesensitizedMetadata(columns, stats);
        const qualityIssues = generateQualityIssues(desensitizedData);

        // 🚀 1.5. 大文件采样（性能优化）
        // 获取采样元数据以记录在建议中
        let samplingMetadata: { isSampled: boolean; sampleSize: number; totalSize: number; } | null = null;
        try {
            const { metadata } = await sampleDataForAI(tableName, 1000);
            samplingMetadata = metadata;
            console.log('[AI清洗] 采样信息:',
                `${metadata.isSampled ? '已采样' : '全量数据'} (${metadata.sampleSize}/${metadata.totalSize}行)`
            );
        } catch (err) {
            console.warn('[AI清洗] 采样元数据获取失败，使用stats统计:', err);
            // 降级：使用现有stats数据（已是聚合统计）
        }

        // 2. 构建 AI Prompt
        const step2 = t('cleaning.generatingSuggestions');
        console.log('[AI清洗] Step 2/4:', step2);
        onProgress?.(step2);

        const prompt = buildCleaningPrompt(tableName, desensitizedData, qualityIssues, t, language);

        // 打印Prompt供调试
        console.log('[AI清洗] Prompt长度:', prompt.length, '字符');

        // 3. 调用AI（使用DeepSeek）
        const { content } = await askAI(prompt, { modelHint: 'deepseek' });
        console.log('[AI清洗] AI返回内容长度:', content.length);

        // 4. 第1层校验：JSON格式
        const aiSuggestions = validateAIResponse(content, t);

        if (!aiSuggestions || aiSuggestions.length === 0) {
            console.warn('[AI清洗] JSON校验失败');
            throw new Error('AI response validation failed');
        }

        console.log(`[AI清洗] JSON校验通过，获得${aiSuggestions.length}条建议`);

        // 5. 第2层：SQL安全校验
        const step3 = t('cleaning.validatingSuggestions');
        console.log('[AI清洗] Step 3/4:', step3);
        onProgress?.(step3);

        const safeSuggestions = aiSuggestions.filter(sugg => {
            const safetyCheck = validateSQLSafety(sugg.sql, tableName, t);
            if (!safetyCheck.valid) {
                console.warn(`[AI清洗] 建议${sugg.id}被过滤:`, safetyCheck.error);
                return false;
            }
            return true;
        });

        console.log(`[AI清洗] SQL安全校验通过，剩余${safeSuggestions.length}条建议`);

        if (safeSuggestions.length === 0) {
            throw new Error('All suggestions filtered by safety check');
        }

        // --- Async Dry Run Logic Starts Here ---

        // Initialize processed suggestions with pending status
        const processedSuggestions: CleaningSuggestion[] = safeSuggestions.map(s => ({
            ...s,
            dryRunStatus: 'pending' as const
        }));

        // Emit initial suggestions immediately (so UI shows them)
        if (onSuggestionUpdate) {
            console.log('[AI清洗] 立即发送初步建议到UI');
            onSuggestionUpdate([...processedSuggestions]);
        }

        // 6. 第3层：DuckDB Dry Run（异步并行）
        if (duckdbEngine) {
            const step4 = 'DuckDB Dry Run (Async)';
            console.log('[AI清洗] Step 4/4:', step4);
            onProgress?.(step4);

            await Promise.all(processedSuggestions.map(async (sugg, index) => {
                try {
                    const dryRunResult = await validateWithDryRun(
                        sugg.sql,
                        tableName,
                        duckdbEngine,
                        t
                    );

                    if (!dryRunResult.valid) {
                        console.warn(`[AI清洗] 建议${sugg.id} Dry Run失败:`, dryRunResult.error);
                        processedSuggestions[index] = {
                            ...sugg,
                            dryRunStatus: 'failed' as const,
                            reason: `${sugg.reason} (校验失败: ${dryRunResult.error})`
                        };
                    } else {
                        processedSuggestions[index] = {
                            ...sugg,
                            expectedImpact: t('cleaning.affectedRows', { count: dryRunResult.affectedRows || 0 }),
                            dryRunStatus: 'success' as const
                        };
                    }
                } catch (error) {
                    console.warn(`[AI清洗] 建议${sugg.id}校验异常:`, error);
                    processedSuggestions[index] = {
                        ...sugg,
                        dryRunStatus: 'failed' as const
                    };
                }

                // Incremental update callback
                if (onSuggestionUpdate) {
                    onSuggestionUpdate([...processedSuggestions]);
                }
            }));

            // Filter out failed suggestions for the final return
            const finalSuggestions = processedSuggestions.filter(s => s.dryRunStatus === 'success');

            // 🚀 记录采样元数据（未来可附加到建议对象的metadata字段）
            if (samplingMetadata) {
                console.log(`[AI清洗] ✅ Dry Run完成，最终生成${finalSuggestions.length}条有效建议 (基于${samplingMetadata.isSampled ? '采样数据' : '全量数据'})`);
            } else {
                console.log(`[AI清洗] ✅ Dry Run完成，最终生成${finalSuggestions.length}条有效建议`);
            }
            return finalSuggestions;
        }

        // 没有DuckDB引擎，直接返回安全建议
        if (samplingMetadata) {
            console.log(`[AI清洗] 返回${safeSuggestions.length}条建议 (基于${samplingMetadata.isSampled ? '采样数据' : '全量数据'})`);
        }
        return safeSuggestions;

    } catch (error: any) {
        // 降级到规则引擎
        console.warn('[AI清洗] ⚠️', t('cleaning.aiFailed'), ':', error.message);
        console.log('[AI清洗] 降级到规则引擎...');
        return [];
    }
}
