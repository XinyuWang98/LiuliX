/**
 * 统一 AI 调用服务
 * 封装"本地优先 + API 降级"逻辑和 GPU 配置
 */

import { localLLMService, SUPPORTED_MODELS } from './localLLMService';
import { askAICleaning, askAIInsight } from './aiService';
import { logger } from '@/utils/logger';

/**
 * GPU 配置检测结果
 */
export interface GPUCheckResult {
    hasGPU: boolean;
    hasEnoughMemory: boolean;
    gpuInfo?: {
        vendor?: string;
        renderer?: string;
        maxBufferSize: number;
    };
    reason?: string;
}

/**
 * AI 调用选项
 */
export interface AIInvokeOptions {
    type: 'cleaning' | 'insight';  // 调用类型
    priority?: 'high' | 'normal';  // 优先级（用于本地模型队列）
    timeout?: number;              // 超时时间（毫秒）
    forceAPI?: boolean;            // 强制使用 API（跳过本地模型）
}

/**
 * GPU 能力检测（用于判断是否可以使用本地模型）
 */
export async function checkGPUCapability(): Promise<GPUCheckResult> {
    try {
        // 检查 WebGPU 支持
        if (!('gpu' in navigator)) {
            logger.warn('AI服务', 'WebGPU 不支持，建议使用云端 API');
            return {
                hasGPU: false,
                hasEnoughMemory: false,
                reason: 'WebGPU API 不支持（浏览器版本过旧）'
            };
        }

        const adapter = await (navigator as any).gpu.requestAdapter();
        if (!adapter) {
            return {
                hasGPU: false,
                hasEnoughMemory: false,
                reason: 'GPU 适配器获取失败'
            };
        }

        const isSoftware = (adapter as any).isFallbackAdapter || false;
        const maxBufferSize = adapter.limits?.maxBufferSize || 0;
        const bufferLimitMB = maxBufferSize / (1024 * 1024);

        const gpuInfo = {
            vendor: (adapter as any).info?.vendor,
            renderer: (adapter as any).info?.architecture,
            maxBufferSize
        };

        // 宽松策略：只要不是软件模拟且 Buffer 限制 > 1GB，就认为可以尝试
        if (isSoftware || bufferLimitMB < 1000) {
            return {
                hasGPU: false,
                hasEnoughMemory: false,
                gpuInfo,
                reason: `GPU 能力不足（${isSoftware ? '软件模拟' : '显存过小'}）`
            };
        }

        logger.log('AI服务', `GPU 检测通过 (${bufferLimitMB.toFixed(0)}MB)`);
        return {
            hasGPU: true,
            hasEnoughMemory: true,
            gpuInfo,
            reason: 'GPU 能力满足要求'
        };

    } catch (err) {
        logger.warn('AI服务', 'GPU 检测失败', err);
        return {
            hasGPU: false,
            hasEnoughMemory: false,
            reason: `GPU 检测异常: ${err instanceof Error ? err.message : '未知错误'}`
        };
    }
}

/**
 * 统一 AI 调用入口
 * 实现"本地优先 + API 降级"逻辑
 */
export async function invokeAI(prompt: string, options: AIInvokeOptions): Promise<string> {
    const { type, priority = 'normal', forceAPI = false } = options;


    // 🛡️ P0 Fix: 强制检查 Feature Flag (MVP阶段禁用本地模型)
    const isLocalModelFeatureEnabled = localStorage.getItem('feature_LOCAL_AI_MODEL') === 'true';
    const userPrefersLocal = localStorage.getItem('use_local_model') === 'true';

    // 只有当 Feature Flag 开启 且 用户在设置中开启时，才认为启用了本地模型
    const useLocalModel = isLocalModelFeatureEnabled && userPrefersLocal;

    logger.group('AI服务', `${type === 'cleaning' ? '清洗建议' : '洞察分析'}`);

    try {
        // 1. 如果强制使用 API 或者用户关闭了本地模型
        if (forceAPI || !useLocalModel) {
            logger.log('AI服务', '使用云端 API');
            const apiResult = await callCloudAPI(prompt, type);
            return apiResult;
        }

        // 2. 尝试使用本地模型
        logger.log('AI服务', '尝试本地模型 (Ollama)');

        // 检查模型状态
        const status = localLLMService.getStatus();

        // 如果模型未加载，尝试加载
        if (!status.isReady && !status.isInitializing) {
            logger.log('AI服务', '本地模型未加载，启动加载流程');
            try {
                await localLLMService.reload(SUPPORTED_MODELS.QWEN_7B);
            } catch (loadError) {
                logger.warn('AI服务', '本地模型加载失败，降级到 API', loadError);
                return await callCloudAPI(prompt, type);
            }
        }

        // 如果正在加载，等待最多 30 秒
        if (status.isInitializing) {
            logger.log('AI服务', '等待本地模型加载完成（最多30秒）');
            const maxWaitTime = 30000;
            const checkInterval = 1000;
            const startTime = Date.now();

            while (Date.now() - startTime < maxWaitTime) {
                const currentStatus = localLLMService.getStatus();
                if (currentStatus.isReady) {
                    logger.log('AI服务', '本地模型加载完成');
                    break;
                }
                // 不检查 error 属性（该属性不存在于 status 类型中）
                await new Promise(resolve => setTimeout(resolve, checkInterval));
            }

            // 超时检查
            const finalStatus = localLLMService.getStatus();
            if (!finalStatus.isReady) {
                logger.warn('AI服务', '本地模型加载超时（30秒），降级到 API');
                return await callCloudAPI(prompt, type);
            }
        }

        // 3. 使用本地模型生成
        const finalStatus = localLLMService.getStatus();
        if (finalStatus.isReady) {
            try {
                logger.log('AI服务', '开始本地模型推理');
                const content = await localLLMService.generateInsight(prompt, priority);
                logger.log('AI服务', `本地模型成功 (${content.length} 字符)`);
                return content;
            } catch (genError) {
                logger.warn('AI服务', '本地模型推理失败，降级到 API', genError);
                return await callCloudAPI(prompt, type);
            }
        }

        // 4. 兜底：降级到 API
        logger.warn('AI服务', '本地模型不可用，降级到 API');
        return await callCloudAPI(prompt, type);

    } finally {
        logger.groupEnd();
    }
}

/**
 * 调用云端 API（私有辅助函数）
 */
async function callCloudAPI(prompt: string, type: 'cleaning' | 'insight'): Promise<string> {
    if (type === 'cleaning') {
        const result = await askAICleaning(prompt);
        return result.content;
    } else {
        const result = await askAIInsight(prompt);
        return result.content;
    }
}

/**
 * 获取当前 AI 调用策略的描述（用于 UI 展示）
 */
export function getCurrentAIStrategy(): string {
    const useLocalModel = localStorage.getItem('use_local_model') === 'true';
    const status = localLLMService.getStatus();

    if (!useLocalModel) {
        return '云端 API';
    }

    if (status.isReady) {
        return '本地模型 (Ollama) + API 降级';
    } else if (status.isInitializing) {
        return '本地模型加载中...';
    } else {
        return '本地模型未就绪，降级到 API';
    }
}
