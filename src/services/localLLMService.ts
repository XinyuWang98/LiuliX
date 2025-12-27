/**
 * 本地 LLM 服务（后端API版本）
 * 通过HTTP调用后端模型服务，替代浏览器端WebLLM
 */

import { logger } from '../utils/logger';
import { localModelQueue } from '../utils/localModelQueue';

// 后端API基础URL
const API_BASE_URL = 'http://localhost:3001/api/model';

// 支持的模型列表（按质量排序）
export const SUPPORTED_MODELS = {
    // Qwen2.5-Coder 专业代码模型系列
    QWEN_7B: 'qwen2.5-coder:7b',    // 推荐：质量好，16GB+内存可用
    QWEN_14B: 'qwen2.5-coder:14b',  // 顶配：最佳质量，32GB+内存
    QWEN_3B: 'qwen2.5-coder:3b',    // 不推荐：质量差，仅测试用
} as const;

export type ModelId = typeof SUPPORTED_MODELS[keyof typeof SUPPORTED_MODELS];

/**
 * 本地 LLM 服务管理器（后端版）
 */
class LocalLLMService {
    private currentModel: ModelId | null = null;
    private isInitializing: boolean = false;
    private initProgress: number = 0;
    private progressCallback: ((progress: number, message: string) => void) | null = null;

    /**
     * 设置进度回调
     */
    setProgressCallback(callback: (progress: number, message: string) => void) {
        this.progressCallback = callback;
    }

    /**
     * 加载或切换模型
     */
    async reload(modelId: ModelId, onProgress?: (progress: number, message: string) => void): Promise<void> {
        // 如果提供了回调，立即设置
        if (onProgress) {
            this.setProgressCallback(onProgress);
        }

        // 如果正在加载同一个模型，直接返回
        if (this.currentModel === modelId) {
            logger.log('本地模型', '模型已就绪', { data: modelId });
            onProgress?.(100, '模型已就绪');
            return;
        }

        // 如果正在初始化，抛出错误
        if (this.isInitializing) {
            throw new Error('模型正在加载中，请稍后再试');
        }

        this.isInitializing = true;
        this.initProgress = 0;
        const startTime = performance.now();

        try {
            logger.group('本地模型', `加载模型: ${modelId}`);

            // 调用后端API加载模型
            onProgress?.(25, '连接后端服务...');
            this.progressCallback?.(25, '连接后端服务...');

            const response = await fetch(`${API_BASE_URL}/load`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '后端模型加载失败');
            }

            onProgress?.(75, '后端模型加载中...');
            this.progressCallback?.(75, '后端模型加载中...');

            await response.json();

            this.currentModel = modelId;
            this.isInitializing = false;
            this.initProgress = 100;

            const loadTime = ((performance.now() - startTime) / 1000).toFixed(1);
            logger.log('本地模型', `模型加载完成 ${modelId}`, {
                data: `耗时 ${loadTime}秒（后端）`
            });
            logger.groupEnd();

            onProgress?.(100, '模型就绪');
            this.progressCallback?.(100, '模型就绪');

        } catch (error) {
            this.isInitializing = false;
            this.initProgress = 0;
            const failTime = ((performance.now() - startTime) / 1000).toFixed(1);
            logger.groupEnd();
            logger.error('本地模型', `加载失败 (${failTime}秒)`, error);
            throw new Error(`模型加载失败: ${error}`);
        }
    }

    /**
     * 生成洞察建议
     * @param prompt AI提示词
     * @param priority 优先级 (high=清洗建议, normal=洞察生成)
     */
    async generateInsight(prompt: string, priority: 'high' | 'normal' = 'normal'): Promise<string> {
        // 🔒 通过队列机制防止并发调用（保持与WebLLM版本一致）
        return localModelQueue.enqueue(async () => {
            const startTime = performance.now();
            try {
                logger.log('本地模型', '开始生成洞察（后端）');

                const response = await fetch(`${API_BASE_URL}/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt,
                        maxTokens: 2048,
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || '后端生成失败');
                }

                const result = await response.json();
                const duration = ((performance.now() - startTime) / 1000).toFixed(1);

                logger.log('本地模型', '洞察生成完成（后端）', {
                    data: `${result.text.length}字符 | 耗时${duration}秒`
                });

                return result.text;

            } catch (error) {
                const duration = ((performance.now() - startTime) / 1000).toFixed(1);
                logger.error('本地模型', `生成失败 (${duration}秒)`, error);
                throw new Error(`洞察生成失败: ${error}`);
            }
        }, priority);
    }

    /**
     * 流式生成洞察建议
     * 注意：后端暂不支持流式，此方法回退到非流式
     */
    async generateInsightStream(
        prompt: string,
        onChunk: (chunk: string) => void,
        priority: 'high' | 'normal' = 'normal'
    ): Promise<string> {
        // 暂时回退到非流式生成
        logger.warn('本地模型', '流式生成暂不支持，使用非流式模式');
        const result = await this.generateInsight(prompt, priority);

        // 模拟流式输出（按字符分批发送）
        const chunkSize = 50;
        for (let i = 0; i < result.length; i += chunkSize) {
            const chunk = result.slice(i, i + chunkSize);
            onChunk(chunk);
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return result;
    }

    /**
     * 获取当前模型状态
     */
    getStatus(): {
        isReady: boolean;
        isInitializing: boolean;
        currentModel: ModelId | null;
        progress: number;
    } {
        return {
            isReady: !!this.currentModel && !this.isInitializing,
            isInitializing: this.isInitializing,
            currentModel: this.currentModel,
            progress: this.initProgress,
        };
    }

    /**
     * 卸载模型（释放内存）
     */
    async unload(): Promise<void> {
        if (this.currentModel) {
            logger.log('本地模型', '卸载模型');
            this.currentModel = null;
        }
    }
}

// 导出单例
export const localLLMService = new LocalLLMService();
