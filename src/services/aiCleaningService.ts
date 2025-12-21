/**
 * AI清洗建议服务（集成版）
 * 包含数据脱敏、AI调用、三层校验、降级机制、大文件采样
 */
import { askAICleaning } from './aiService';
import type { CleaningSuggestion } from './aiService';
import { buildDesensitizedMetadata, generateQualityIssues } from '@/utils/dataSanitizer';
import { buildCleaningPrompt } from './prompts/cleaningSuggestions';
import { validateAIResponse, validateSQLSafety, validateWithDryRun } from '@/utils/sqlValidator';
import { sampleDataForAI } from '@/utils/sampleData';
import { logger } from '@/utils/logger';
export { type CleaningSuggestion } from './aiService';
/**
 * 验证SQL中的列名是否存在于列名映射表中
 */
function validateColumnNamesInSQL(
    sql: string,
    columnMapping: Map<string, string>
): { valid: boolean; invalidColumns?: string[] } {
    const columnPattern = /"([^"]+)"/g;
    const matches = [...sql.matchAll(columnPattern)];
    const referencedColumns = matches.map(m => m[1]);
    const validColumns = Array.from(columnMapping.keys());
    const invalidColumns = referencedColumns.filter(col => !validColumns.includes(col));
    if (invalidColumns.length > 0) {
        return { valid: false, invalidColumns };
    }
    return { valid: true };
}
/**
 * 生成AI清洗建议（完整版）
 */
export async function generateAICleaningSuggestions(
    tableName: string,
    columns: any[],
    stats: any[],
    t: (key: string, params?: Record<string, any>) => string,
    duckdbEngine?: any,
    onProgress?: (progressMsg: string) => void,
    onSuggestionUpdate?: (suggestions: CleaningSuggestion[]) => void,
    language: string = 'Chinese (Simplified)'
): Promise<CleaningSuggestion[]> {
    try {
        logger.group('AI清洗', '生成清洗建议流程');

        // 1. 数据脱敏
        logger.log('AI清洗', '数据脱敏中');
        onProgress?.(t('cleaning.desensitizing'));
        const { metadata: desensitizedData, columnMapping } = buildDesensitizedMetadata(columns, stats);
        const qualityIssues = generateQualityIssues(desensitizedData);
        // 1.5. 大文件采样（性能优化）
        let samplingMetadata: { isSampled: boolean; sampleSize: number; totalSize: number; } | null = null;
        try {
            const { metadata } = await sampleDataForAI(tableName, 1000);
            samplingMetadata = metadata;
            logger.log('AI清洗', `采样完成: ${metadata.isSampled ? '已采样' : '全量数据'}`, { count: metadata.sampleSize, data: `/${metadata.totalSize}行` });
        } catch (err) {
            logger.warn('AI清洗', '采样元数据获取失败,使用stats统计', err);
        }
        // 2. 构建 AI Prompt
        const prompt = buildCleaningPrompt(tableName, desensitizedData, qualityIssues, t, language);
        logger.log('AI清洗', '构建Prompt完成', { data: `${prompt.length}字符` });
        onProgress?.(t('cleaning.generatingSuggestions'));
        // 3. 调用AI（使用清洗专用通道，30s超时）
        const { content } = await askAICleaning(prompt);
        logger.log('AI清洗', 'AI响应收到', { data: `${content.length}字符` });
        // 4. 第1层校验：JSON格式
        const aiSuggestions = validateAIResponse(content, t);
        if (!aiSuggestions || aiSuggestions.length === 0) {
            logger.warn('AI清洗', 'JSON校验失败');
            throw new Error('AI response validation failed');
        }
        logger.log('AI清洗', 'JSON校验通过', { count: aiSuggestions.length });
        // 5. 第2层：SQL安全校验 + 列名验证
        logger.log('数据清洗', 'SQL安全校验中');
        onProgress?.(t('cleaning.validatingSuggestions'));
        const safeSuggestions = aiSuggestions.filter(sugg => {
            // SQL安全校验
            const safetyCheck = validateSQLSafety(sugg.sql, tableName, t);
            if (!safetyCheck.valid) {
                logger.warn('数据清洗', `建议${sugg.id}被过滤 ${safetyCheck.error}`);
                return false;
            }

            // 列名验证（新增）
            const columnCheck = validateColumnNamesInSQL(sugg.sql, columnMapping);
            if (!columnCheck.valid) {
                logger.warn('数据清洗', `建议${sugg.id}被过滤 列名错误: ${columnCheck.invalidColumns?.join(', ')}`);
                return false;
            }

            return true;
        });
        logger.log('数据清洗', 'SQL安全校验通过', { count: safeSuggestions.length });
        if (safeSuggestions.length === 0) {
            throw new Error('All suggestions filtered by safety check');
        }
        // 6. 初始化建议状态
        const processedSuggestions: CleaningSuggestion[] = safeSuggestions.map(s => ({
            ...s,
            dryRunStatus: 'pending' as const
        }));
        // 立即发送初步建议到UI
        if (onSuggestionUpdate) {
            logger.log('数据清洗', '发送初步建议到UI');
            onSuggestionUpdate([...processedSuggestions]);
        }
        // 7. 第3层：DuckDB Dry Run（异步并行）
        if (duckdbEngine) {
            logger.log('数据清洗', 'Dry-run验证中');
            onProgress?.('DuckDB Dry Run (Async)');
            await Promise.all(processedSuggestions.map(async (sugg, index) => {
                try {
                    const dryRunResult = await validateWithDryRun(
                        sugg.sql,
                        tableName,
                        duckdbEngine,
                        t
                    );
                    if (!dryRunResult.valid) {
                        logger.warn('数据清洗', `建议${sugg.id} Dry-run失败`, dryRunResult.error);
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
                    logger.warn('数据清洗', `建议${sugg.id}校验异常`, error);
                    processedSuggestions[index] = {
                        ...sugg,
                        dryRunStatus: 'failed' as const
                    };
                }
                // 增量更新回调
                if (onSuggestionUpdate) {
                    onSuggestionUpdate([...processedSuggestions]);
                }
            }));
            // 过滤出成功的建议
            const finalSuggestions = processedSuggestions.filter(s => s.dryRunStatus === 'success');
            logger.groupEnd();
            logger.log('数据清洗', '建议生成完成', {
                count: finalSuggestions.length,
                data: samplingMetadata ? `(${samplingMetadata.isSampled ? '采样' : '全量'})` : ''
            });
            return finalSuggestions;
        }
        // 没有DuckDB引擎，直接返回安全建议
        logger.groupEnd();
        logger.log('数据清洗', '建议生成完成', {
            count: safeSuggestions.length,
            data: samplingMetadata ? `(${samplingMetadata.isSampled ? '采样' : '全量'})` : ''
        });
        return safeSuggestions;
    } catch (error: any) {
        logger.groupEnd(); // 确保遇错时关闭分组
        // 降级到规则引擎
        logger.warn('AI清洗', `${t('cleaning.aiFailed')}: ${error.message}`);
        logger.log('数据清洗', '降级到规则引擎');
        return [];
    }
}