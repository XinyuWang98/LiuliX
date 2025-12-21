/**
 * Skills 错误修正循环
 * LLM执行失败时，将错误回传让其自我修正
 */

import { llmAdapter, LLMResponse } from '../ai/llmAdapter';
import { stepsExecutor, ExecutionStep } from './stepsExecutor';
import { logger } from '@/utils/logger';
import { getSkillsConfig } from '@/config/skillsConfig';

export interface RecoveryOptions {
    modelType: 'deepseek' | 'qwen';
    apiKey?: string;
    onProgress?: (current: number, total: number) => void;
}

/**
 * 带错误修正的Skills执行
 * @param userPrompt 用户原始提示
 * @param options 执行选项
 * @returns 执行结果
 */
export async function executeWithRecovery(
    userPrompt: string,
    options: RecoveryOptions
): Promise<any> {
    const config = getSkillsConfig();
    const MAX_RETRY = config.ADVANCED.MAX_RETRY || 3;

    let attempt = 0;
    const failedAttempts = new Set<string>();  // 防死循环
    let currentPrompt = userPrompt;
    let lastResponse: LLMResponse | null = null;

    logger.group('Skills', '错误修正循环启动');
    logger.log('Skills', `最大重试次数: ${MAX_RETRY}`);

    while (attempt < MAX_RETRY) {
        attempt++;
        logger.log('Skills', `尝试 ${attempt}/${MAX_RETRY}`);

        try {
            // 1. 调用LLM
            const llmResponse: LLMResponse = await llmAdapter.call(
                currentPrompt,
                options.modelType,
                options.apiKey
            );

            lastResponse = llmResponse;

            // 2. 检查是否有工具调用
            if (!llmResponse.toolCalls || llmResponse.toolCalls.length === 0) {
                logger.log('Skills', 'LLM未请求工具调用，返回纯文本');
                logger.groupEnd();
                return { content: llmResponse.content };
            }

            // 3. 转换为ExecutionStep格式
            const steps: ExecutionStep[] = llmResponse.toolCalls.map(tc => ({
                tool: tc.name,
                arguments: tc.arguments
            }));

            logger.log('Skills', `LLM请求执行 ${steps.length} 个工具`);

            // 4. 执行工具调用
            const context = await stepsExecutor.executeSteps(steps, options.onProgress);

            logger.log('Skills', '✅ 所有步骤执行成功');
            logger.groupEnd();

            return {
                success: true,
                results: context.results,
                steps: steps.length,
                duration: context.endTime! - context.startTime
            };

        } catch (error: any) {
            const errorMsg = error.message || String(error);
            logger.warn('Skills', `❌ 执行失败 (尝试 ${attempt}/${MAX_RETRY})`, errorMsg);

            // 5. 检测重复失败（防死循环）
            const attemptSignature = JSON.stringify(lastResponse?.toolCalls || {});
            if (failedAttempts.has(attemptSignature)) {
                logger.error('Skills', '检测到重复失败，终止执行');
                logger.groupEnd();
                throw new Error('重复失败，终止重试');
            }
            failedAttempts.add(attemptSignature);

            // 6. 最后一次尝试失败则抛出错误
            if (attempt >= MAX_RETRY) {
                logger.error('Skills', '超过最大重试次数');
                logger.groupEnd();
                throw new Error(`执行失败，已重试 ${MAX_RETRY} 次: ${errorMsg}`);
            }

            // 7. 构建错误上下文，回传给LLM
            const errorContext = formatErrorForLLM(errorMsg);
            logger.log('Skills', '生成错误上下文，请求LLM修正');

            // 更新Prompt，加入错误反馈
            currentPrompt = `${userPrompt}\n\n[执行失败]: ${errorContext}\n请修正参数后重试。`;
        }
    }

    throw new Error('不应到达此处');
}

/**
 * 格式化错误信息为LLM可读文本
 */
function formatErrorForLLM(errorMsg: string): string {
    // 提取关键错误信息
    if (errorMsg.includes('Invalid column')) {
        return errorMsg + '\n\n💡 提示：请使用DuckDB表中实际存在的列名。';
    }

    if (errorMsg.includes('does not exist')) {
        return errorMsg + '\n\n💡 提示：请检查表名和列名是否正确。';
    }

    if (errorMsg.includes('Step') && errorMsg.includes('failed')) {
        // 提取步骤号和具体错误
        return errorMsg + '\n\n💡 提示：请检查该步骤的参数是否正确。';
    }

    return errorMsg;
}
