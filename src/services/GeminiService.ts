import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

/**
 * Gemini API 服务封装
 * 负责与 Google Gemini API 交互
 */
class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;

    /**
     * 初始化 Gemini API
     * @param apiKey Google AI Studio 提供的 API Key
     * @param modelId 模型 ID（默认使用 gemini-pro）
     */
    initialize(apiKey: string, modelId: string = 'gemini-pro'): void {
        if (!apiKey || !apiKey.startsWith('AIza')) {
            throw new Error('所有 Gemini 模型都需要有效的 API Key');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        // 使用指定的模型
        this.model = this.genAI.getGenerativeModel({
            model: modelId,
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
            },
        });

        console.log(`✅ Gemini API 已初始化 (模型: ${modelId})`);
    }

    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean {
        return this.model !== null;
    }

    /**
     * 生成文本
     * @param prompt 提示词
     * @returns 生成的文本内容
     */
    async generateText(prompt: string): Promise<string> {
        if (!this.model) {
            throw new Error('Gemini API 未初始化，请先调用 initialize()');
        }

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            if (!text) {
                throw new Error('API 返回空响应');
            }

            return text;
        } catch (error: any) {
            console.error('Gemini API 调用失败:', error);

            // 友好的错误提示
            if (error.message?.includes('API_KEY_INVALID')) {
                throw new Error('API Key 无效，请检查您的密钥');
            } else if (error.message?.includes('QUOTA_EXCEEDED')) {
                throw new Error('API 配额已用尽，请稍后再试');
            } else if (error.message?.includes('RATE_LIMIT')) {
                throw new Error('请求过于频繁，请稍后再试');
            }

            throw new Error(`API 调用失败: ${error.message}`);
        }
    }

    /**
     * 生成结构化 JSON 输出
     * @param prompt 提示词
     * @param schema JSON schema 描述
     * @returns 解析后的 JSON 对象
     */
    async generateJSON<T = any>(prompt: string, schemaDescription?: string): Promise<T> {
        const jsonPrompt = schemaDescription
            ? `${prompt}\n\n请以 JSON 格式输出，遵循以下结构:\n${schemaDescription}\n\n重要：只返回 JSON，不要包含任何其他文字说明。`
            : `${prompt}\n\n请以 JSON 格式输出。重要：只返回 JSON，不要包含任何其他文字说明。`;

        const text = await this.generateText(jsonPrompt);

        try {
            // 尝试提取 JSON（处理可能的 markdown 代码块）
            const jsonMatch = text.match(/```json\s*\n([\s\S]*?)\n```/) ||
                text.match(/```\s*\n([\s\S]*?)\n```/) ||
                text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                return JSON.parse(jsonStr.trim());
            }

            // 如果没有代码块，尝试直接解析
            return JSON.parse(text.trim());
        } catch (error) {
            console.error('JSON 解析失败，原始响应:', text);
            throw new Error('无法解析 AI 返回的 JSON 格式');
        }
    }

    /**
     * 测试 API 连接
     * @returns 是否连接成功
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        if (!this.model) {
            return { success: false, message: 'API 未初始化' };
        }

        try {
            const response = await this.generateText('请用一句话介绍你自己。');
            return {
                success: true,
                message: `连接成功！AI 回复: ${response.slice(0, 50)}...`
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 清除 API Key（用户登出时调用）
     */
    clear(): void {
        this.genAI = null;
        this.model = null;
        console.log('🔒 Gemini API 已清除');
    }
}

// 单例导出
export const geminiService = new GeminiService();
