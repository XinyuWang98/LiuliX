/**
 * 浏览器平台配置
 */

import type { PlatformConfig } from '../types';

/**
 * 决策阈值常量
 * 所有硬编码阈值提取到此处，便于调优
 */
export const STRATEGY_THRESHOLDS = {
    /** 高性能模式：内存占比阈值
     * 依据：Chrome 96+ 测试，内存占比 < 30% 时稳定运行 */
    HIGH_PERF_MEMORY_RATIO: 0.3,

    /** 高性能模式：行数上限（浏览器版本）
     * 依据：statsmodels 时序分解在3万行以下耗时 < 30秒 */
    HIGH_PERF_ROW_LIMIT: 30000,

    /** 并行模式：最小内存要求（MB）
     * 依据：8GB 设备（实际可用约12GB）的安全线 */
    MIN_MEMORY_FOR_PARALLEL: 12000,

    /** 采样阈值（浏览器版本）
     * 依据：5万行以上采样到5000行，计算时间降低90%+ */
    SAMPLING_THRESHOLD: 50000,
} as const;

/**
 * 浏览器平台配置
 */
export const browserConfig: PlatformConfig = {
    thresholds: {
        highPerfMemoryRatio: STRATEGY_THRESHOLDS.HIGH_PERF_MEMORY_RATIO,
        highPerfRowLimit: STRATEGY_THRESHOLDS.HIGH_PERF_ROW_LIMIT,
        minMemoryForParallel: STRATEGY_THRESHOLDS.MIN_MEMORY_FOR_PARALLEL,
        samplingThreshold: STRATEGY_THRESHOLDS.SAMPLING_THRESHOLD,
    },

    worker: {
        maxConcurrency: 5,         // 最多5并发（16GB设备）
        initTimeout: 10000,        // 10秒超时
        poolSize: undefined,       // 动态决定（1/3/5）
    },

    features: {
        enableWorkerPool: true,    // ✅ 浏览器版本启用Worker Pool
        enableBackgroundPreCompute: false,  // ❌ 浏览器暂不支持后台预计算
        enableLocalCache: true,    // ✅ 使用IndexedDB缓存
    },
};
