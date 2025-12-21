// Pyodide 洞察执行器（Base64图片输出 + 错误重试）
import { pyodideManager } from './PyodideManager';
import { logger } from '@/utils/logger';

/**
 * 洞察执行结果接口
 */
export interface InsightExecutionResult {
    image: string; // Base64 格式：data:image/png;base64,...
    summary: string; // 统计文本摘要
}

/**
 * 执行洞察代码（支持错误重试）
 * @param code Python代码（必须返回JSON格式的{image, summary}）
 * @param maxRetries 最大重试次数
 * @returns 执行结果
 */
export async function executeInsightCode(
    code: string,
    maxRetries: number = 1
): Promise<InsightExecutionResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            logger.log('Python', `尝试执行 (${attempt + 1}/${maxRetries + 1})`);

            // 调用 PyodideManager 执行代码
            const result = await pyodideManager.runPython(code);

            // 解析返回的 JSON 字符串
            let parsed: any;
            if (typeof result === 'string') {
                parsed = JSON.parse(result);
            } else {
                parsed = result;
            }

            // 验证返回格式
            if (!parsed || !parsed.image || !parsed.summary) {
                throw new Error('执行结果缺少必要字段: image 或 summary');
            }

            // 验证 Base64 格式
            if (!parsed.image.startsWith('data:image/png;base64,')) {
                throw new Error('图片格式错误：必须是 data:image/png;base64,...');
            }

            logger.log('Python', '执行成功', {
                data: {
                    imageSize: parsed.image.length,
                    summary: parsed.summary.substring(0, 50)
                }
            });

            return {
                image: parsed.image,
                summary: parsed.summary
            };

        } catch (error) {
            lastError = error as Error;
            logger.log('Python', `执行失败 (尝试 ${attempt + 1})`, {
                data: String(error)
            });

            // 如果还有重试次数，继续
            if (attempt < maxRetries) {
                logger.log('Python', '准备重试...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
            }
        }
    }

    // 所有重试都失败
    throw new Error(`执行失败（已重试${maxRetries}次）: ${lastError?.message || '未知错误'}`);
}

/**
 * 批量执行洞察代码（串行执行）
 * @param codes Python代码数组
 * @param onProgress 进度回调（当前索引, 总数）
 * @returns 执行结果数组（失败的为null）
 */
export async function executeBatchInsights(
    codes: string[],
    onProgress?: (current: number, total: number) => void
): Promise<(InsightExecutionResult | null)[]> {
    logger.group('Python', `批量执行 ${codes.length} 条洞察`);

    const results: (InsightExecutionResult | null)[] = [];

    for (let i = 0; i < codes.length; i++) {
        try {
            // 通知进度
            if (onProgress) {
                onProgress(i + 1, codes.length);
            }

            logger.log('Python', `执行第 ${i + 1}/${codes.length} 条`);

            // 执行单条代码（最多重试1次）
            const result = await executeInsightCode(codes[i], 1);
            results.push(result);

        } catch (error) {
            logger.log('Python', `第 ${i + 1} 条执行失败，跳过`, {
                data: String(error)
            });
            results.push(null); // 失败的用null占位
        }
    }

    logger.groupEnd();

    const successCount = results.filter(r => r !== null).length;
    logger.log('Python', `批量执行完成`, {
        count: successCount,
        data: { failed: codes.length - successCount }
    });

    return results;
}
