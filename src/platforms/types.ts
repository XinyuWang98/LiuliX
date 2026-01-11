/**
 * 平台适配接口定义
 * 支持浏览器和离线版本（Electron/Tauri）的统一抽象
 */

import type { InsightNode } from '@/types/insightTree';

/**
 * 平台适配器接口
 * 浏览器和离线版本分别实现此接口
 */
export interface PlatformAdapter {
    /**
     * Worker管理：执行Python代码
     */
    executeCode(code: string, context: ExecutionContext): Promise<any>;

    /**
     * 并发配置：获取最优并发数
     */
    getOptimalConcurrency(nodes: InsightNode[]): number;

    /**
     * 内存评估：获取可用内存（MB）
     */
    getAvailableMemory(): number;

    /**
     * 内存测量：实际测量数据内存占用（可选）
     */
    measureActualMemory?(tableName: string): Promise<number>;

    /**
     * 缓存管理（可选）
     */
    saveCache?(key: string, data: any): Promise<void>;
    loadCache?(key: string): Promise<any>;
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
    tableName: string;
    totalRows?: number;
    enableQualityGate?: boolean;
    logPrefix?: string;
}

/**
 * 平台配置
 */
export interface PlatformConfig {
    /** 决策阈值 */
    thresholds: {
        /** 高性能模式：内存占比阈值 */
        highPerfMemoryRatio: number;
        /** 高性能模式：行数上限 */
        highPerfRowLimit: number;
        /** 并行模式：最小内存要求（MB） */
        minMemoryForParallel: number;
        /** 采样触发阈值 */
        samplingThreshold: number;
    };

    /** Worker配置 */
    worker: {
        /** 最大并发数 */
        maxConcurrency: number;
        /** 初始化超时（ms） */
        initTimeout: number;
        /** Worker池大小（可选，离线版本独有） */
        poolSize?: number;
    };

    /** 功能开关 */
    features: {
        /** 是否启用Worker Pool */
        enableWorkerPool: boolean;
        /** 是否启用后台预计算（离线版本） */
        enableBackgroundPreCompute: boolean;
        /** 是否启用本地缓存 */
        enableLocalCache: boolean;
    };
}

/**
 * 平台类型
 */
export type PlatformType = 'browser' | 'electron' | 'tauri';
