/**
 * 本地模型服务（基于 Transformers.js）
 * 提供模型加载和推理功能
 */

import axios from 'axios';

/**
 * 模型服务类
 */
class ModelService {
    constructor() {
        this.currentModel = null;
        this.isLoading = false;
        this.ollamaBaseUrl = 'http://localhost:11434';
    }

    /**
     * 加载模型 (对于Ollama，这是检查模型可用性)
     * @param {string} modelId - Ollama模型标签 (例如: 'qwen2.5-coder:3b')
     */
    async loadModel(modelId = 'qwen2.5-coder:3b') {
        if (this.isLoading) return { status: 'loading', modelId };

        this.isLoading = true;

        try {
            console.log(`[模型服务] 正在连接 Ollama 服务: ${this.ollamaBaseUrl}`);

            // 1. 检查 Ollama 服务是否运行
            try {
                await axios.get(this.ollamaBaseUrl);
            } catch (e) {
                throw new Error('无法连接到 Ollama 服务，请确保 Ollama 已安装并运行 (http://localhost:11434)');
            }

            // 2. 检查模型是否已下载
            console.log(`[模型服务] 检查模型: ${modelId}`);
            const listRes = await axios.get(`${this.ollamaBaseUrl}/api/tags`);
            const models = listRes.data.models || [];
            const exists = models.some(m => m.name.startsWith(modelId));

            if (!exists) {
                console.log(`[模型服务] 模型未找到，尝试自动拉取 (这可能需要几分钟)...`);
                // 触发拉取但不等待完成 (由前端轮询状态或后续调用触发)
                // 注意：在实际生产中，最好有专门的拉取进度反馈。这里为了简化逻辑，
                // 我们调用 pull 接口。
                await axios.post(`${this.ollamaBaseUrl}/api/pull`, { name: modelId, stream: false });
            }

            this.currentModel = modelId;
            console.log(`[模型服务] ✅ Ollama 模型就绪: ${modelId}`);

            return {
                status: 'ready',
                modelId: this.currentModel,
                backend: 'ollama'
            };

        } catch (error) {
            console.error('[模型服务] ❌ Ollama 连接/加载失败:', error.message);
            // 抛出友好错误供前端展示
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 生成文本
     * @param {string} prompt - 输入提示词
     * @param {object} options - 生成选项
     */
    async generate(prompt, options = {}) {
        if (!this.currentModel) {
            throw new Error('模型未就绪，请先调用 loadModel');
        }

        const startTime = Date.now();

        try {
            // 对接 Ollama Generate API
            // 文档: https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-completion
            const response = await axios.post(`${this.ollamaBaseUrl}/api/generate`, {
                model: this.currentModel,
                prompt: prompt,
                stream: false, // 暂时使用非流式，简单适配当前前端
                options: {
                    temperature: options.temperature || 0.7,
                    num_predict: options.maxTokens || 2048, // Ollama 使用 num_predict
                    top_p: 0.9,
                    repeat_penalty: 1.1
                }
            });

            const duration = Date.now() - startTime;
            const text = response.data.response;

            console.log(`[模型服务] 生成完成，耗时 ${duration}ms，长度 ${text.length}字符`);

            return {
                text,
                duration
            };

        } catch (error) {
            console.error(`[模型服务] ❌ 生成失败:`, error.message);
            throw error;
        }
    }

    /**
     * 获取模型状态
     */
    getStatus() {
        return {
            isReady: !!this.currentModel,
            isLoading: this.isLoading,
            currentModel: this.currentModel,
            backend: 'ollama'
        };
    }
}

// 导出单例
export default new ModelService();

