/**
 * 本地 LLM 服务（基于 WebLLM）
 * 支持浏览器端运行大语言模型，首次下载后永久离线可用
 */

import * as webllm from "@mlc-ai/web-llm";
import { logger } from '@/utils/logger';

// 支持的模型列表
export const SUPPORTED_MODELS = {
    QWEN: 'Qwen2.5-7B-Instruct-q4f16_1-MLC', // 默认推荐，中文强
    // LLAMA: 'Llama-3.1-8B-Instruct-q4f16_1-MLC', // P1：上下文长
} as const;

export type ModelId = typeof SUPPORTED_MODELS[keyof typeof SUPPORTED_MODELS];

/**
 * 本地 LLM 服务管理器
 */
class LocalLLMService {
    private engine: webllm.MLCEngine | null = null;
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
    async reload(modelId: ModelId): Promise<void> {
        // 如果正在加载同一个模型，直接返回
        if (this.currentModel === modelId && this.engine) {
            logger.log('本地模型', '模型已就绪', { data: modelId });
            return;
        }

        // 如果正在初始化，抛出错误
        if (this.isInitializing) {
            throw new Error('模型正在加载中，请稍后再试');
        }

        this.isInitializing = true;
        this.initProgress = 0;

        try {
            logger.group('本地模型', `加载模型: ${modelId}`);

            // 创建初始化进度回调
            let lastLoggedMilestone = -1;
            const initProgressCallback = (report: webllm.InitProgressReport) => {
                this.initProgress = report.progress * 100;
                const message = report.text || '正在加载...';

                // 只记录关键里程碑：0%, 25%, 50%, 75%, 100%
                const currentMilestone = Math.floor(this.initProgress / 25) * 25;
                if (currentMilestone !== lastLoggedMilestone && currentMilestone % 25 === 0) {
                    logger.log('本地模型', `加载进度 ${currentMilestone}%: ${message}`);
                    lastLoggedMilestone = currentMilestone;
                }

                this.progressCallback?.(this.initProgress, message);
            };

            // 创建新引擎
            this.engine = await webllm.CreateMLCEngine(
                modelId,
                {
                    initProgressCallback,
                    // 启用 WebGPU 加速
                    logLevel: 'INFO',
                }
            );

            this.currentModel = modelId;
            this.isInitializing = false;
            this.initProgress = 100;

            logger.log('本地模型', '模型加载完成', { data: modelId });
            logger.groupEnd();

            this.progressCallback?.(100, '模型就绪');
        } catch (error) {
            this.isInitializing = false;
            this.initProgress = 0;
            logger.groupEnd();
            logger.error('本地模型', '加载失败', error);
            throw new Error(`模型加载失败: ${error}`);
        }
    }

    /**
     * 生成洞察建议
     */
    async generateInsight(prompt: string): Promise<string> {
        if (!this.engine) {
            throw new Error('模型未加载，请先调用 reload()');
        }

        try {
            logger.log('本地模型', '开始生成洞察');

            const response = await this.engine.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的数据分析专家，擅长从数据中发现洞察和模式。请用中文回复，返回 JSON 格式的洞察建议。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048,
            });

            const result = response.choices[0]?.message?.content || '';
            logger.log('本地模型', '洞察生成完成', { data: `${result.length} 字符` });

            return result;
        } catch (error) {
            logger.error('本地模型', '生成失败', error);
            throw new Error(`洞察生成失败: ${error}`);
        }
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
            isReady: !!this.engine && !this.isInitializing,
            isInitializing: this.isInitializing,
            currentModel: this.currentModel,
            progress: this.initProgress,
        };
    }

    /**
     * 卸载模型（释放内存）
     */
    async unload(): Promise<void> {
        if (this.engine) {
            logger.log('本地模型', '卸载模型');
            this.engine = null;
            this.currentModel = null;
        }
    }
}

// 导出单例
export const localLLMService = new LocalLLMService();
