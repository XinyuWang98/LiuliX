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
export function getAIModeRecommendation(detection: HardwareDetectionResult): AIModeRecommendation {
    const score = detection.overallScore;

    // 推荐逻辑
    if (score >= 75) {
        // 高性能硬件：强烈推荐本地模型
        return {
            mode: 'local',
            confidence: 'high',
            reason: detection.platform.isM1Plus
                ? 'MacBook Pro M系列，硬件性能优秀，本地AI体验流畅'
                : '您的设备配置优秀，本地AI模型性能出色',
            technicalReason: `综合评分: ${score}/100 (平台: ${detection.platform.isM1Plus ? 'M系列Mac' : detection.platform.os}, GPU: ${detection.gpu.score}, 内存: ${detection.memory.score})`,
            expectedLoadTime: '15-25秒',
            expectedInferenceTime: '20-50秒'
        };
    } else if (score >= 50) {
        // 中等硬件：轻度推荐API
        return {
            mode: 'api',
            confidence: 'medium',
            reason: '您的设备配置一般，建议使用云端AI获得更快速度和更好体验',
            technicalReason: `综合评分: ${score}/100 (GPU性能一般或内存偏低)`,
            expectedLoadTime: detection.gpu.score >= 50 ? '30-45秒' : '40-60秒',
            expectedInferenceTime: detection.gpu.score >= 50 ? '50-90秒' : '60-120秒'
        };
    } else {
        // 低性能硬件：强烈推荐API
        return {
            mode: 'api',
            confidence: 'high',
            reason: '您的设备配置较低，强烈建议使用云端AI获得流畅体验',
            technicalReason: `综合评分: ${score}/100 (硬件性能不足，本地模型会非常慢)`,
            expectedLoadTime: '60秒以上',
            expectedInferenceTime: '120秒以上'
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
