/**
 * AI清洗建议服务（集成版）
 * 包含数据脱敏、AI调用、三层校验、降级机制、大文件采样
 */
import { askAICleaning } from './aiService';
import type { CleaningSuggestion } from './aiService';
import { buildDesensitizedMetadata, generateQualityIssues } from '@/utils/dataSanitizer';
import { compressMetadataForPrompt } from '@/utils/promptCompressor';
import { buildCleaningPrompt } from './prompts/cleaningSuggestions';
import { validateAIResponse, validateSQLSafety, validateWithDryRun } from '@/utils/sqlValidator';
import { sampleDataForAI } from '@/utils/sampleData';
import { logger } from '@/utils/logger';
import { localLLMService, SUPPORTED_MODELS } from '@/services/localLLMService';
export { type CleaningSuggestion } from './aiService';
/**
 * 验证SQL中的列名是否存在于列名映射表中
 */
function validateColumnNamesInSQL(
    sql: string,
    columnMapping: Map<string, string>,
    tableName: string // ✅ 新增参数
): { valid: boolean; invalidColumns?: string[] } {
    const columnPattern = /"([^"]+)"/g;
    const matches = [...sql.matchAll(columnPattern)];
    const referencedColumns = matches.map(m => m[1]);
    const validColumns = Array.from(columnMapping.keys());

    // 过滤掉不在validColumns中，但恰好是tableName的引用
    const invalidColumns = referencedColumns.filter(col =>
        !validColumns.includes(col) && col !== tableName
    );

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
    signal?: AbortSignal,
    language?: string
): Promise<CleaningSuggestion[]> {
    const totalStartTime = performance.now(); // 总计时开始
    logger.group('AI服务', '开始生成清洗建议 (Function Call)');
    logger.log('AI服务', `Language: ${language}`);

    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    try {
        logger.group('AI清洗', '生成清洗建议流程');

        // 1. 数据脱敏
        logger.log('AI清洗', '数据脱敏中');
        onProgress?.(t('cleaning.desensitizing'));

        const { metadata: desensitizedData, columnMapping } = buildDesensitizedMetadata(columns, stats);
        const qualityIssues = generateQualityIssues(desensitizedData);

        // 1.5. Prompt压缩优化（减少Token消耗）
        const compressedData = compressMetadataForPrompt(desensitizedData);
        const originalSize = JSON.stringify(desensitizedData).length;
        const compressedSize = JSON.stringify(compressedData).length;
        const reductionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

        logger.log('AI清洗', `Prompt压缩完成`, {
            data: `减少${reductionRatio}% (体积: ${originalSize}→${compressedSize}字符)`
        });

        // 1.6. 大文件采样（性能优化）
        let samplingMetadata: { isSampled: boolean; sampleSize: number; totalSize: number; } | null = null;
        try {
            const { metadata } = await sampleDataForAI(tableName, 1000);
            samplingMetadata = metadata;
            logger.log('AI清洗', `采样完成: ${metadata.isSampled ? '已采样' : '全量数据'}`, { count: metadata.sampleSize, data: `/${metadata.totalSize}行` });
        } catch (err) {
            logger.warn('AI清洗', '采样元数据获取失败,使用stats统计', err);
        }

        // 2. 构建 AI Prompt（使用压缩后的数据）
        const prompt = buildCleaningPrompt(tableName, compressedData, qualityIssues, t, language);
        const estimatedTokens = Math.ceil(prompt.length / 1.5);
        logger.log('AI清洗', '构建Prompt完成', {
            data: `${prompt.length}字符 (约${estimatedTokens} tokens)`
        });
        logger.groupCollapsed('AI清洗', '完整Prompt内容（点击展开）');
        console.log(prompt);
        logger.groupEnd();
        onProgress?.(t('cleaning.generatingSuggestions'));

        // 3. 调用本地模型（🚫 API已禁用）
        const aiStartTime = performance.now();

        // 🔄 切换到本地模型
        const useLocalModel = localStorage.getItem('use_local_model') === 'true';
        let content: string;

        if (useLocalModel) {
            const status = localLLMService.getStatus();

            // 如果模型未加载，先等待预加载完成（最多30秒）
            if (!status.isReady && !status.isInitializing) {
                logger.log('AI清洗', '模型未加载，启动加载流程...');
                await localLLMService.reload(SUPPORTED_MODELS.QWEN);
            } else if (status.isInitializing) {
                // 模型正在加载中，等待完成
                logger.log('AI清洗', '等待模型预加载完成...');
                const maxWaitTime = 30000; // 30秒
                const checkInterval = 1000; // 1秒
                const startTime = Date.now();

                while (Date.now() - startTime < maxWaitTime) {
                    const currentStatus = localLLMService.getStatus();
                    if (currentStatus.isReady) {
                        logger.log('AI清洗', '预加载完成，继续生成');
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, checkInterval));
                }
            }


            const finalStatus = localLLMService.getStatus();
            if (!finalStatus.isReady) {
                throw new Error('本地模型加载失败，请刷新页面重试');
            }

            // ⚡ 使用高优先级，可插队优先执行（用户主动触发的清洗建议）
            content = await localLLMService.generateInsight(prompt, 'high');
        } else {
            // 降级到云端API
            const { content: apiContent } = await askAICleaning(prompt);
            content = apiContent;
        }

        const aiDuration = (performance.now() - aiStartTime) / 1000;
        logger.log('AI清洗', 'AI响应收到', {
            data: `${content.length}字符 (耗时${aiDuration.toFixed(1)}秒)`
        });
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
            // 🔄 临时替换表名用于校验
            const executableSQL = sugg.sql.replace(/__TABLE_NAME__/g, tableName);

            // SQL安全校验
            const safetyCheck = validateSQLSafety(executableSQL, tableName, t);
            if (!safetyCheck.valid) {
                logger.warn('数据清洗', `建议${sugg.id}被过滤 ${safetyCheck.error}`);
                return false;
            }

            // 列名验证（新增）
            const columnCheck = validateColumnNamesInSQL(executableSQL, columnMapping, tableName);
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
            sql: s.sql, // ✅ 透传原始SQL（含 __TABLE_NAME__）
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
                    // 🔄 Dry Run 必须使用真实表名
                    const executableSQL = sugg.sql.replace(/__TABLE_NAME__/g, tableName);

                    const dryRunResult = await validateWithDryRun(
                        executableSQL,
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

            const totalDuration = ((performance.now() - totalStartTime) / 1000).toFixed(1);
            logger.log('AI清洗', `✅ 清洗建议生成完成 | 总耗时${totalDuration}秒`, {
                count: finalSuggestions.length,
                data: samplingMetadata ? `(${samplingMetadata.isSampled ? '采样' : '全量'})` : ''
            });
            return finalSuggestions;
        }
        // 没有DuckDB引擎，直接返回安全建议
        logger.groupEnd();

        const totalDuration = ((performance.now() - totalStartTime) / 1000).toFixed(1);
        logger.log('AI清洗', `✅ 清洗建议生成完成 | 总耗时${totalDuration}秒`, {
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