/**
 * LLM 适配器
 * 屏蔽 DeepSeek (Native Tools) 和 Qwen (Prompt Shim) 的差异
 * 提供统一的 Skills 调用接口
 */

import { skillRegistry } from '../skills/registry';
import { logger } from '@/utils/logger';
import ky from 'ky';

/** LLM 响应格式 */
export interface LLMResponse {
    content: string;
    toolCalls?: Array<{
        name: string;
        arguments: Record<string, any>;
    }>;
    isMultiStep?: boolean;  // 🆕 Phase 2: 标识是否为多步调用
}

/** LLM 适配器类 */
export class LLMAdapter {
    /**
     * 调用 LLM（自动适配 DeepSeek Native 或 Qwen Shim）
     * @param prompt 用户提示
     * @param modelType 模型类型 ('deepseek' | 'qwen')
     * @param apiKey API Key (仅 DeepSeek 需要)
     * @returns LLM 响应
     */
    async call(
        prompt: string,
        modelType: 'deepseek' | 'qwen',
        apiKey?: string
    ): Promise<LLMResponse> {
        if (modelType === 'deepseek') {
            return await this.callDeepSeek(prompt, apiKey!);
        } else {
            return await this.callQwen(prompt);
        }
    }

    /**
     * DeepSeek 调用（使用 Native Tools API）
     */
    private async callDeepSeek(prompt: string, apiKey: string): Promise<LLMResponse> {
        logger.group('Skills', 'DeepSeek Native Tools 调用');

        try {
            const tools = skillRegistry.toOpenAITools();
            logger.log('Skills', `注册了 ${tools.length} 个工具`);

            const response = await ky.post('/api/proxy/deepseek-skills', {
                json: {
                    data: {  // 🔧 包装在data字段中，匹配后端格式
                        messages: [
                            { role: 'user', content: prompt }
                        ],
                        model: 'deepseek-chat',
                        tools
                    }
                },
                headers: {
                    'x-api-key': apiKey
                },
                timeout: 120000  // 延长到120秒
            }).json<any>();

            const message = response.choices[0].message;

            // 检查是否有工具调用
            if (message.tool_calls && message.tool_calls.length > 0) {
                logger.log('Skills', `LLM 请求调用 ${message.tool_calls.length} 个工具`);

                const toolCalls = message.tool_calls.map((tc: any) => ({
                    name: tc.function.name,
                    arguments: JSON.parse(tc.function.arguments)
                }));

                logger.groupEnd();
                return {
                    content: message.content || '',
                    toolCalls,
                    isMultiStep: toolCalls.length > 1  // 🆕 Phase 2
                };
            }

            logger.log('Skills', 'LLM 未请求工具调用，返回纯文本');
            logger.groupEnd();

            return {
                content: message.content || '',
                toolCalls: undefined
            };

        } catch (error: any) {
            logger.error('Skills', 'DeepSeek 调用失败', error);
            logger.groupEnd();
            throw error;
        }
    }

    /**
     * Qwen 调用（使用 Prompt Shim）
     */
    private async callQwen(prompt: string): Promise<LLMResponse> {
        logger.group('Skills', 'Qwen Prompt Shim 调用');

        try {
            // 1. 生成工具描述（注入到 System Prompt）
            const toolsDesc = skillRegistry.toPromptShim();
            const systemPrompt = `你是一个智能数据分析助手。${toolsDesc}\n\n重要：如果需要调用工具，必须严格按照 JSON 格式返回，否则直接回答用户问题。`;

            logger.log('Skills', `System Prompt 长度: ${systemPrompt.length} 字符`);

            // 2. 调用 Qwen 本地模型（通过 /api/proxy/qwen-skills）
            const response = await ky.post('/api/proxy/qwen-skills', {
                json: {
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ]
                },
                timeout: 30000
            }).json<any>();

            const content = response.choices[0].message.content;

            // 3. 尝试解析 JSON（如果 LLM 返回了工具调用）
            const toolCalls = this.parseToolCallsFromText(content);

            if (toolCalls.length > 0) {
                logger.log('Skills', `从文本中解析出 ${toolCalls.length} 个工具调用`);
                logger.groupEnd();

                return {
                    content,
                    toolCalls,
                    isMultiStep: toolCalls.length > 1  // 🆕 Phase 2
                };
            }

            logger.log('Skills', '未检测到工具调用，返回纯文本');
            logger.groupEnd();

            return {
                content,
                toolCalls: undefined
            };

        } catch (error: any) {
            logger.error('Skills', 'Qwen 调用失败', error);
            logger.groupEnd();
            throw error;
        }
    }

    /**
     * 从文本中解析工具调用（Prompt Shim 模式）
     * 支持自动修复常见的 JSON 格式错误
     */
    private parseToolCallsFromText(text: string): Array<{ name: string; arguments: Record<string, any> }> {
        try {
            // 1. 尝试提取 JSON 块
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return [];
            }

            const jsonStr = jsonMatch[1] || jsonMatch[0];

            // 2. 尝试解析
            let parsed = JSON.parse(jsonStr);

            // 3. 🆕 Phase 2: 支持多步格式
            if (Array.isArray(parsed.steps)) {
                logger.log('Skills', '检测到多步调用格式');
                return parsed.steps.map((step: any) => ({
                    name: step.tool,
                    arguments: step.arguments || step.args || {}
                }));
            }

            // 4. 标准化单步格式
            if (parsed.tool && parsed.arguments) {
                return [{
                    name: parsed.tool,
                    arguments: parsed.arguments
                }];
            }

            return [];

        } catch (error) {
            // JSON 解析失败，尝试自动修复
            logger.warn('Skills', 'JSON 解析失败，尝试修复', error);

            try {
                // 简单修复：移除尾部逗号、修复引号等
                const fixed = text
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .replace(/'/g, '"');

                const parsed = JSON.parse(fixed);

                if (parsed.tool && parsed.arguments) {
                    logger.log('Skills', 'JSON 修复成功');
                    return [{
                        name: parsed.tool,
                        arguments: parsed.arguments
                    }];
                }
            } catch (fixError) {
                logger.error('Skills', 'JSON 修复失败', fixError);
            }

            return [];
        }
    }
}

/** 全局单例 */
export const llmAdapter = new LLMAdapter();
