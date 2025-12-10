import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

/**
 * Gemini API 服务封装
 * 负责与 Google Gemini API 交互
 */
class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;
    private apiKey: string = '';
    private modelId: string = 'gemini-pro';
    private baseUrl?: string;

    /**
     * 初始化 Gemini API
     * @param apiKey Google AI Studio 提供的 API Key
     * @param modelId 模型 ID（默认使用 gemini-pro）
     * @param baseUrl 自定义 API Base URL (可选, 用于代理)
     */
    initialize(apiKey: string, modelId: string = 'gemini-pro', baseUrl?: string): void {
        if (!apiKey) {
            throw new Error('所有 Gemini 模型都需要有效的 API Key');
        }

        this.apiKey = apiKey;
        this.modelId = modelId;
        this.baseUrl = baseUrl; // 如果提供了 baseUrl，将优先使用 REST API

        // 即使有 baseUrl 也初始化 SDK，以备后用或作为默认方式
        try {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: modelId,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                },
            });
        } catch (e) {
            console.warn('SDK 初始化失败 (可能是因为 Key 格式)，将尝试使用 REST API');
        }

        console.log(`✅ Gemini API 已初始化 (模型: ${modelId}, 代理: ${baseUrl || '无'})`);
    }

    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean {
        // 只要有 apiKey 就算初始化了 (因为可能用 REST)
        return !!this.apiKey;
    }

    /**
     * 生成文本
     * @param prompt 提示词
     * @returns 生成的文本内容
     */
    async generateText(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Gemini API 未初始化，请先调用 initialize()');
        }

        // 如果配置了 Base URL，使用 REST API
        if (this.baseUrl) {
            return this.generateTextViaRest(prompt);
        }

        // 默认使用 SDK
        if (!this.model) {
            throw new Error('Gemini SDK 未初始化且未提供 Base URL');
        }

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('Gemini SDK 调用失败:', error);
            this.handleError(error);
            return ''; // Should verify if handleError throws
        }
    }

    /**
     * 通过 REST API 生成文本 (支持自定义 Base URL)
     */
    private async generateTextViaRest(prompt: string): Promise<string> {
        // 移除末尾斜杠
        const cleanBaseUrl = this.baseUrl?.replace(/\/+$/, '');
        // 构建完整的 Endpoint
        const url = `${cleanBaseUrl}/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP Error ${response.status}: ${errorBody}`);
            }

            const data = await response.json();

            // 解析 Gemini REST 响应格式
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
                return data.candidates[0].content.parts[0].text;
            } else {
                console.error('Unexpected REST response:', data);
                throw new Error('API 返回了无法解析的响应格式');
            }

        } catch (error: any) {
            console.error('Gemini REST API 调用失败:', error);
            this.handleError(error);
            return '';
        }
    }

    private handleError(error: any) {
        const msg = error.message || '';

        if (msg.includes('API_KEY_INVALID') || msg.includes('400')) {
            throw new Error('API_KEY_INVALID');
        } else if (msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
            throw new Error('QUOTA_EXCEEDED');
        } else if (msg.includes('RATE_LIMIT')) {
            throw new Error('RATE_LIMIT');
        } else if (msg.includes('Failed to fetch')) {
            throw new Error('NETWORK_ERROR');
        } else if (msg.includes('non ISO-8859-1')) {
            throw new Error('INVALID_CHARACTERS');
        }

        // Pass through original message if not matched, but don't add Chinese prefix
        throw new Error(msg || 'UNKNOWN_ERROR');
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
        if (!this.apiKey) {
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
        this.apiKey = '';
        this.baseUrl = undefined;
        console.log('🔒 Gemini API 已清除');
    }
}

// 单例导出
export const geminiService = new GeminiService();
