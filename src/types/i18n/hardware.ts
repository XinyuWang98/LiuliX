/**
 * 硬件检测模块类型定义
 * 包含: hardware
 */

export interface HardwareTranslations {
    // 硬件检测与推荐
    hardware: {
        detection: string;
        detecting: string;
        detectionFailed: string;
        platform: string;
        gpu: string;
        memory: string;
        score: string;
        recommendation: string;

        // 平台描述
        macM1Plus: string;
        macIntel: string;
        windows: string;
        linux: string;
        unknown: string;

        // GPU描述
        gpuNotDetected: string;
        gpuSoftware: string;
        gpuHigh: string;
        gpuMedium: string;
        gpuIntegrated: string;

        // 推荐模式
        recommendedMode: string;
        localMode: string;
        apiMode: string;
        confidence: string;
        confidenceHigh: string;
        confidenceMedium: string;
        confidenceLow: string;

        // 推荐理由
        reason: string;
        reasonMacPlus: string;
        reasonGood: string;
        reasonMedium: string;
        reasonLow: string;
        technicalDetails: string;
        expectedLoadTime: string;
        expectedInferenceTime: string;

        // 优缺点
        pros: string;
        cons: string;

        // 按钮
        useRecommended: string;
        keepCurrent: string;
        redetect: string;
    };
}
