/**
 * 本地 LLM 服务（基于 WebLLM）
 * 支持浏览器端运行大语言模型，首次下载后永久离线可用
 */

import * as webllm from "@mlc-ai/web-llm";
import { logger } from '../utils/logger';
import { localModelQueue } from '../utils/localModelQueue';

// WebGPU 类型声明（修复 TS 错误）
interface GPU {
    requestAdapter(): Promise<GPUAdapter | null>;
}

interface GPUAdapter {
    requestAdapterInfo(): Promise<any>;
    limits: {
        maxBufferSize: number;
    };
}

declare global {
    interface Navigator {
        gpu?: GPU;
    }
}


// 支持的模型列表
export const SUPPORTED_MODELS = {
    QWEN: 'Qwen2.5-7B-Instruct-q4f16_1-MLC', // 默认推荐，中文强
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
    async reload(modelId: ModelId, onProgress?: (progress: number, message: string) => void): Promise<void> {
        // 如果提供了回调，立即设置
        if (onProgress) {
            this.setProgressCallback(onProgress);
        }

        // 如果正在加载同一个模型，直接返回
        if (this.currentModel === modelId && this.engine) {
            logger.log('本地模型', '模型已就绪', { data: modelId });
            // 立即报告完成
            onProgress?.(100, '模型已就绪');
            return;
        }

        // 如果正在初始化，抛出错误
        if (this.isInitializing) {
            throw new Error('模型正在加载中，请稍后再试');
        }


        this.isInitializing = true;
        this.initProgress = 0;
        const startTime = performance.now(); // 开始计时

        try {
            logger.group('本地模型', `加载模型: ${modelId}`);

            // 🔍 GPU 设备诊断（新增调试日志）
            if (navigator.gpu) {
                try {
                    const adapter = await navigator.gpu.requestAdapter();
                    if (adapter) {
                        const adapterInfo = await adapter.requestAdapterInfo();
                        logger.log('本地模型', 'GPU设备信息', {
                            data: `${adapterInfo.vendor || 'Unknown'} | ${adapterInfo.device || 'Unknown'}`
                        });

                        // 记录GPU内存限制
                        const limits = adapter.limits;
                        const maxBufferGB = (limits.maxBufferSize / (1024 * 1024 * 1024)).toFixed(2);
                        logger.log('本地模型', 'GPU内存限制', {
                            data: `maxBuffer=${maxBufferGB}GB`
                        });
                    } else {
                        logger.warn('本地模型', 'GPU Adapter获取失败');
                    }
                } catch (gpuError) {
                    logger.warn('本地模型', 'GPU信息读取失败', gpuError);
                }
            } else {
                logger.warn('本地模型', 'WebGPU不支持，将降级到CPU模式');
            }

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

            const engineConfig: any = {
                initProgressCallback,
                logLevel: 'INFO',
            };

            // 📝 对于预设模型（如Qwen），不传递appConfig避免覆盖模型配置
            // WebLLM会自动使用模型的最优配置
            // 性能参数已在模型文件中预设，无需手动配置

            // 🔍 记录配置信息（调试用）
            logger.log('本地模型', '引擎配置', {
                data: `logLevel=${engineConfig.logLevel} | 使用模型预设配置`
            });

            // 创建新引擎
            this.engine = await webllm.CreateMLCEngine(modelId, engineConfig);

            this.currentModel = modelId;
            this.isInitializing = false;
            this.initProgress = 100;

            const loadTime = ((performance.now() - startTime) / 1000).toFixed(1);
            logger.log('本地模型', `模型加载完成 ${modelId}`, {
                data: `耗时 ${loadTime}秒`
            });
            logger.groupEnd();

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
        if (!this.engine) {
            throw new Error('模型未加载，请先调用 reload()');
        }

        // 🔒 通过队列机制防止并发调用导致GPU崩溃
        return localModelQueue.enqueue(async () => {
            const startTime = performance.now();
            try {
                logger.log('本地模型', '开始生成洞察');

                const response = await this.engine!.chat.completions.create({
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
                const duration = ((performance.now() - startTime) / 1000).toFixed(1);
                logger.log('本地模型', '洞察生成完成', {
                    data: `${result.length}字符 | 耗时${duration}秒`
                });

                return result;
            } catch (error) {
                const duration = ((performance.now() - startTime) / 1000).toFixed(1);
                logger.error('本地模型', `生成失败 (${duration}秒)`, error);
                throw new Error(`洞察生成失败: ${error}`);
            }
        }, priority); // 传递优先级
    }

    /**
     * 流式生成洞察建议（推荐）
     * 实时返回生成内容，提升用户体验
     * 
     * @param prompt AI提示词
     * @param onChunk 流式回调函数（每收到一块内容立即调用）
     * @param priority 优先级 (high=清洗建议, normal=洞察生成)
     * @returns 完整生成内容
     */
    async generateInsightStream(
        prompt: string,
        onChunk: (chunk: string) => void,
        priority: 'high' | 'normal' = 'normal'
    ): Promise<string> {
        if (!this.engine) {
            throw new Error('模型未加载，请先调用 reload()');
        }

        // 🔒 通过队列机制防止并发调用导致GPU崩溃
        return localModelQueue.enqueue(async () => {
            const startTime = performance.now();
            try {
                logger.log('本地模型', '开始流式生成洞察');

                const streamResponse = await this.engine!.chat.completions.create({
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
                    stream: true,  // 启用流式生成
                });

                let fullText = '';
                for await (const chunk of streamResponse) {
                    const delta = chunk.choices[0]?.delta?.content || '';
                    if (delta) {
                        fullText += delta;
                        onChunk(delta);  // 实时回调
                    }
                }

                const duration = ((performance.now() - startTime) / 1000).toFixed(1);
                logger.log('本地模型', '流式生成完成', {
                    data: `${fullText.length}字符 | 耗时${duration}秒`
                });
                return fullText;
            } catch (error) {
                const duration = ((performance.now() - startTime) / 1000).toFixed(1);
                logger.error('本地模型', `流式生成失败 (${duration}秒)`, error);
                throw new Error(`流式生成失败: ${error}`);
            }
        }, priority); // 传递优先级
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
