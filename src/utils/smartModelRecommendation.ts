/**
 * 智能模型推荐策略
 * 基于硬件性能和模型质量评估
 */

import { detectHardware } from './hardwareDetection';

/**
 * 模型性能矩阵
 */
export const MODEL_QUALITY_MATRIX = {
    'qwen2.5-coder:3b': {
        quality: 1,      // 质量评分 1-5
        minRAM: 4,       // 最低内存要求 (GB)
        speed: 5,        // 速度评分 1-5
        recommendation: '不推荐（质量未达标）'
    },
    'qwen2.5-coder:7b': {
        quality: 4,      // 浏览器测试效果好
        minRAM: 16,      // 需要16GB+内存
        speed: 3,
        recommendation: '高性能设备推荐'
    },
    'qwen2.5-coder:14b': {
        quality: 5,      // 理论最佳
        minRAM: 32,      // 需要32GB+内存
        speed: 2,
        recommendation: '顶配设备可选'
    }
} as const;

export type ModelId = keyof typeof MODEL_QUALITY_MATRIX;

/**
 * 推荐模式
 */
export type RecommendMode = 'cloud-api' | 'local-7b' | 'local-14b';

export interface ModelRecommendation {
    mode: RecommendMode;
    modelId?: ModelId;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
    estimatedPerformance?: {
        inferenceTime: string;  // 预估推理时间
        quality: string;        // 预期质量
    };
}

/**
 * 智能模型推荐
 * @returns 推荐的模型配置
 */
export async function getSmartModelRecommendation(): Promise<ModelRecommendation> {
    const hardware = await detectHardware();
    // 优先使用 deviceMemoryGB，若不存在则使用 storageQuotaGB 推测（除以20作为粗略估算）
    const totalRAM = hardware.memory.deviceMemoryGB ?? (hardware.memory.storageQuotaGB / 20);

    // 策略1: 32GB+ RAM → 推荐 14B 模型
    if (totalRAM >= 32 && hardware.overallScore >= 80) {
        return {
            mode: 'local-14b',
            modelId: 'qwen2.5-coder:14b',
            reason: '您的设备性能优秀（32GB+ RAM），推荐使用 14B 本地模型获得最佳质量',
            confidence: 'high',
            estimatedPerformance: {
                inferenceTime: '5-8秒/条',
                quality: '⭐⭐⭐⭐⭐ 优秀'
            }
        };
    }

    // 策略2: 16GB+ RAM → 推荐 7B 模型（已验证效果好）
    if (totalRAM >= 16 && hardware.overallScore >= 65) {
        return {
            mode: 'local-7b',
            modelId: 'qwen2.5-coder:7b',
            reason: '您的设备性能良好（16GB+ RAM），推荐使用 7B 本地模型，质量与速度兼具',
            confidence: 'high',
            estimatedPerformance: {
                inferenceTime: '2-4秒/条',
                quality: '⭐⭐⭐⭐ 良好'
            }
        };
    }

    // 策略3: 8-16GB RAM → 推荐云端API（3B质量差，不推荐）
    if (totalRAM >= 8 && totalRAM < 16) {
        return {
            mode: 'cloud-api',
            reason: '您的设备内存（8-16GB）不足以流畅运行 7B 模型，推荐使用云端 API 获得最佳体验',
            confidence: 'high',
            estimatedPerformance: {
                inferenceTime: '2-3秒/条',
                quality: '⭐⭐⭐⭐⭐ 优秀'
            }
        };
    }

    // 策略4: <8GB RAM → 强制云端API
    return {
        mode: 'cloud-api',
        reason: '您的设备内存不足（<8GB），本地模型无法运行，使用云端 API',
        confidence: 'high',
        estimatedPerformance: {
            inferenceTime: '2-3秒/条',
            quality: '⭐⭐⭐⭐⭐ 优秀'
        }
    };
}

/**
 * 检查指定模型是否可用
 */
export async function isModelAvailable(modelId: ModelId): Promise<boolean> {
    const hardware = await detectHardware();
    // 使用与推荐逻辑一致的内存获取方式
    const totalRAM = hardware.memory.deviceMemoryGB ?? (hardware.memory.storageQuotaGB / 20);
    const modelSpec = MODEL_QUALITY_MATRIX[modelId];

    return totalRAM >= modelSpec.minRAM && hardware.overallScore >= 60;
}

/**
 * 获取首次启动的模型推荐（用于引导用户）
 */
export async function getFirstTimeSetupRecommendation(): Promise<{
    shouldEnableLocal: boolean;
    recommendedModel?: ModelId;
    message: string;
}> {
    const recommendation = await getSmartModelRecommendation();

    if (recommendation.mode === 'cloud-api') {
        return {
            shouldEnableLocal: false,
            message: '推荐使用云端 API 模式，质量最优，无需配置本地模型'
        };
    }

    return {
        shouldEnableLocal: true,
        recommendedModel: recommendation.modelId,
        message: `检测到您的设备适合运行 ${recommendation.modelId}，${recommendation.reason}`
    };
}
