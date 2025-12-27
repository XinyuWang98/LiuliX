/**
 * AI模式智能推荐引擎
 * 基于硬件检测结果，推荐最佳AI使用模式
 */

import type { HardwareDetectionResult } from './hardwareDetection';
import { logger } from './logger';

/**
 * AI模式类型
 */
export type AIMode = 'local' | 'api';

/**
 * 推荐置信度
 */
export type RecommendationConfidence = 'high' | 'medium' | 'low';

/**
 * 推荐结果
 */
export interface AIModeRecommendation {
    mode: AIMode;
    confidence: RecommendationConfidence;
    reason: string;              // 推荐理由（用户友好）
    technicalReason: string;     // 技术原因（详细）
    expectedLoadTime?: string;   // 预期加载时间
    expectedInferenceTime?: string; // 预期推理时间
}

/**
 * 推荐配置存储
 */
interface RecommendationStorage {
    mode: AIMode;
    isUserCustomized: boolean;   // 用户是否手动修改过
    lastDetectionTime: number;
    detectionResult: HardwareDetectionResult;
    recommendation: AIModeRecommendation;
}

const STORAGE_KEY = 'ai_mode_recommendation';
const REDETECTION_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7天

/**
 * 获取AI模式推荐
 */
export function getAIModeRecommendation(
    detection: HardwareDetectionResult,
    t: (key: string, params?: any) => string
): AIModeRecommendation {
    const score = detection.overallScore;

    // 推荐逻辑 (Ollama 版本 - 性能更好，阈值更宽松)
    // 🔧 2024-12: 阈值从 75 降到 60，因为 Ollama 原生 GPU 加速性能远超 WebGPU
    if (score >= 60) {
        // 中高性能硬件：推荐本地模型
        return {
            mode: 'local',
            confidence: score >= 80 ? 'high' : 'medium',
            reason: detection.platform.isM1Plus
                ? t('hardware.reasonMacPlus')
                : t('hardware.reasonGood'),
            technicalReason: `${t('hardware.score')}: ${score}/100 (${t('hardware.platform')}: ${detection.platform.isM1Plus ? t('hardware.macM1Plus') : (detection.platform.os === 'windows' ? t('hardware.windows') : detection.platform.os)}, GPU: ${detection.gpu.score}, ${t('hardware.memory')}: ${detection.memory.score})`,
            // Ollama 性能更好，更新预期时间
            expectedLoadTime: '3-5s',
            expectedInferenceTime: '10-30s'
        };
    } else if (score >= 40) {
        // 中等硬件：可以尝试本地，但提示可能较慢
        return {
            mode: 'local',
            confidence: 'low',
            reason: t('hardware.reasonMedium'),
            technicalReason: `${t('hardware.score')}: ${score}/100`,
            expectedLoadTime: '5-10s',
            expectedInferenceTime: '30-60s'
        };
    } else {
        // 低性能硬件：推荐API
        return {
            mode: 'api',
            confidence: 'high',
            reason: t('hardware.reasonLow'),
            technicalReason: `${t('hardware.score')}: ${score}/100`,
            expectedLoadTime: '> 60s',
            expectedInferenceTime: '> 120s'
        };
    }
}

/**
 * 保存推荐结果到localStorage
 */
export function saveRecommendation(
    detection: HardwareDetectionResult,
    recommendation: AIModeRecommendation,
    isUserCustomized: boolean = false
): void {
    const storage: RecommendationStorage = {
        mode: recommendation.mode,
        isUserCustomized,
        lastDetectionTime: detection.detectionTime,
        detectionResult: detection,
        recommendation
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
        logger.log('AI配置', `推荐结果已保存 (模式: ${recommendation.mode}, 评分: ${detection.overallScore})`);
    } catch (error) {
        logger.warn('AI配置', '推荐结果保存失败', error);
    }
}

/**
 * 加载已保存的推荐结果
 */
export function loadSavedRecommendation(): RecommendationStorage | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const data: RecommendationStorage = JSON.parse(stored);

        // 检查是否需要重新检测（7天后）
        const timeSinceDetection = Date.now() - data.lastDetectionTime;
        if (!data.isUserCustomized && timeSinceDetection > REDETECTION_INTERVAL) {
            logger.log('AI配置', '推荐结果已过期，需要重新检测');
            return null;
        }

        return data;
    } catch (error) {
        logger.warn('AI配置', '推荐结果加载失败', error);
        return null;
    }
}

/**
 * 标记为用户自定义（用户手动修改后调用）
 */
export function markAsUserCustomized(mode: AIMode): void {
    const saved = loadSavedRecommendation();
    if (!saved) return;

    saved.mode = mode;
    saved.isUserCustomized = true;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        logger.log('AI配置', `用户自定义配置已保存 (模式: ${mode})`);
    } catch (error) {
        logger.warn('AI配置', '配置保存失败', error);
    }
}

/**
 * 检查是否应该显示首次引导
 */
export function shouldShowFirstTimeWizard(): boolean {
    const saved = loadSavedRecommendation();
    return saved === null; // 没有保存记录 = 首次使用
}

/**
 * 获取推荐的详细说明（用于UI展示）
 */
export function getRecommendationDetails(recommendation: AIModeRecommendation): {
    title: string;
    pros: string[];
    cons: string[];
} {
    if (recommendation.mode === 'local') {
        return {
            title: '本地AI模型',
            pros: [
                '✓ 数据完全离线，隐私安全',
                '✓ 无需API Key，永久免费',
                '✓ 离线可用，不受网络限制',
                recommendation.confidence === 'high'
                    ? '✓ 您的硬件性能优秀，推理速度快'
                    : '⚠️ 推理速度一般，需耐心等待'
            ],
            cons: [
                `⏱️ 首次加载需要 ${recommendation.expectedLoadTime || '20-60秒'}`,
                `⏱️ 推理时间约 ${recommendation.expectedInferenceTime || '30-90秒'}`
            ]
        };
    } else {
        return {
            title: '云端AI (推荐)',
            pros: [
                '✓ 推理速度快（5-15秒）',
                '✓ 质量高，模型更强大',
                '✓ 无需等待模型加载',
                '✓ 适合所有设备配置'
            ],
            cons: [
                '⚠️ 需要网络连接',
                '⚠️ 需要配置API Key（可使用免费额度）'
            ]
        };
    }
}
