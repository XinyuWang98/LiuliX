/**
 * 硬件检测工具
 * 用于检测用户设备配置，为AI模式推荐提供依据
 */

/**
 * 平台检测结果
 */
export interface PlatformInfo {
    os: 'mac' | 'windows' | 'linux' | 'unknown';
    isMac: boolean;
    isM1Plus: boolean; // M系列Mac（无法100%准确，基于启发式）
    platform: string;   // navigator.platform原始值
}

/**
 * GPU检测结果
 */
export interface GPUInfo {
    isAvailable: boolean;
    isFallbackAdapter: boolean; // 是否软件模拟
    maxBufferSize: number;      // 单Buffer最大限制（字节）
    vendor?: string;            // 厂商（如果可用）
    architecture?: string;      // 架构（如果可用）
    score: number;              // GPU能力评分 0-100
}

/**
 * 内存检测结果
 */
export interface MemoryInfo {
    deviceMemoryGB?: number;    // 系统内存（GB，部分浏览器支持）
    storageQuotaGB: number;     // 浏览器存储配额（GB）
    score: number;              // 内存评分 0-100
}

/**
 * 硬件综合检测结果
 */
export interface HardwareDetectionResult {
    platform: PlatformInfo;
    gpu: GPUInfo;
    memory: MemoryInfo;
    overallScore: number;       // 综合评分 0-100
    detectionTime: number;      // 检测时间戳
}

/**
 * 检测平台信息
 */
export async function detectPlatform(): Promise<PlatformInfo> {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;

    const isMac = /Mac/.test(platform);
    const isWindows = /Win/.test(platform);
    const isLinux = /Linux/.test(platform);

    // M系列Mac启发式检测
    // 注意：这不是100%准确，但可以作为参考
    const isM1Plus = isMac && (
        // 检测1: User Agent中不包含Intel
        !/Intel/.test(userAgent) ||
        // 检测2: 高性能指标（navigator.hardwareConcurrency >= 8）
        (navigator.hardwareConcurrency >= 8 && /Safari/.test(userAgent))
    );

    let os: 'mac' | 'windows' | 'linux' | 'unknown';
    if (isMac) os = 'mac';
    else if (isWindows) os = 'windows';
    else if (isLinux) os = 'linux';
    else os = 'unknown';

    return {
        os,
        isMac,
        isM1Plus,
        platform
    };
}

/**
 * 检测GPU信息
 */
export async function detectGPU(): Promise<GPUInfo> {
    if (!('gpu' in navigator)) {
        return {
            isAvailable: false,
            isFallbackAdapter: true,
            maxBufferSize: 0,
            score: 0
        };
    }

    try {
        const adapter = await (navigator as any).gpu.requestAdapter();

        if (!adapter) {
            return {
                isAvailable: false,
                isFallbackAdapter: true,
                maxBufferSize: 0,
                score: 0
            };
        }

        const isFallbackAdapter = (adapter as any).isFallbackAdapter || false;
        const maxBufferSize = adapter.limits?.maxBufferSize || 0;

        // 尝试获取更多信息（部分浏览器支持）
        let vendor: string | undefined;
        let architecture: string | undefined;

        try {
            const info = (adapter as any).info;
            vendor = info?.vendor;
            architecture = info?.architecture;
        } catch {
            // 不支持adapter.info，忽略
        }

        // GPU能力评分
        let score = 0;
        if (isFallbackAdapter) {
            score = 0; // 软件模拟
        } else {
            const bufferMB = maxBufferSize / (1024 * 1024);
            if (bufferMB >= 2048) {
                score = 100; // 独立显卡（>=2GB Buffer）
            } else if (bufferMB >= 1024) {
                score = 70;  // 中等显卡
            } else if (bufferMB >= 256) {
                score = 40;  // 集成显卡
            } else {
                score = 10;  // 非常弱
            }
        }

        return {
            isAvailable: true,
            isFallbackAdapter,
            maxBufferSize,
            vendor,
            architecture,
            score
        };
    } catch (error) {
        console.warn('[硬件检测] GPU检测失败:', error);
        return {
            isAvailable: false,
            isFallbackAdapter: true,
            maxBufferSize: 0,
            score: 0
        };
    }
}

/**
 * 检测内存信息
 */
export async function detectMemory(): Promise<MemoryInfo> {
    // 检测系统内存（部分浏览器支持）
    let deviceMemoryGB: number | undefined;
    if ('deviceMemory' in navigator) {
        deviceMemoryGB = (navigator as any).deviceMemory;
    }

    // 检测浏览器存储配额（间接反映）
    let storageQuotaGB = 0;
    try {
        const estimate = await navigator.storage.estimate();
        storageQuotaGB = (estimate.quota || 0) / (1024 * 1024 * 1024);
    } catch {
        // 浏览器不支持，忽略
    }

    // 内存评分
    let score = 50; // 默认中等

    if (deviceMemoryGB !== undefined) {
        // 优先使用deviceMemory
        if (deviceMemoryGB >= 16) {
            score = 100;
        } else if (deviceMemoryGB >= 8) {
            score = 60;
        } else if (deviceMemoryGB >= 4) {
            score = 30;
        } else {
            score = 10;
        }
    } else {
        // 降级：使用storageQuota推测
        if (storageQuotaGB >= 200) {
            score = 80; // 可能是16GB+系统
        } else if (storageQuotaGB >= 100) {
            score = 60; // 可能是8GB系统
        } else {
            score = 40; // 可能是低内存
        }
    }

    return {
        deviceMemoryGB,
        storageQuotaGB,
        score
    };
}

/**
 * 综合硬件检测
 * 执行所有检测并计算综合评分
 */
export async function detectHardware(): Promise<HardwareDetectionResult> {
    const [platform, gpu, memory] = await Promise.all([
        detectPlatform(),
        detectGPU(),
        detectMemory()
    ]);

    // 计算综合评分（加权平均）
    const platformWeight = 0.4;
    const gpuWeight = 0.4;
    const memoryWeight = 0.2;

    // 平台评分
    let platformScore = 30; // 默认
    if (platform.isMac && platform.isM1Plus) {
        platformScore = 100; // M系列Mac
    } else if (platform.isMac) {
        platformScore = 60;  // Intel Mac
    } else if (platform.os === 'windows') {
        // Windows下，GPU更重要，这里给基础分
        platformScore = 50;
    }

    const overallScore = Math.round(
        platformScore * platformWeight +
        gpu.score * gpuWeight +
        memory.score * memoryWeight
    );

    return {
        platform,
        gpu,
        memory,
        overallScore,
        detectionTime: Date.now()
    };
}

/**
 * 获取硬件描述（用于UI展示）
 */
export function getHardwareDescription(detection: HardwareDetectionResult): {
    platform: string;
    gpu: string;
    memory: string;
} {
    // 平台描述
    let platformDesc = '未知设备';
    if (detection.platform.isMac) {
        if (detection.platform.isM1Plus) {
            platformDesc = 'MacBook (M系列)';
        } else {
            platformDesc = 'MacBook (Intel)';
        }
    } else if (detection.platform.os === 'windows') {
        platformDesc = 'Windows PC';
    } else if (detection.platform.os === 'linux') {
        platformDesc = 'Linux';
    }

    // GPU描述
    let gpuDesc = '未检测到GPU';
    if (!detection.gpu.isAvailable) {
        gpuDesc = '未检测到GPU';
    } else if (detection.gpu.isFallbackAdapter) {
        gpuDesc = '软件模拟（无硬件加速）';
    } else {
        const bufferMB = Math.round(detection.gpu.maxBufferSize / (1024 * 1024));
        if (bufferMB >= 2048) {
            gpuDesc = '独立显卡（高性能）';
        } else if (bufferMB >= 1024) {
            gpuDesc = '独立显卡（中等性能）';
        } else {
            gpuDesc = '集成显卡';
        }

        if (detection.gpu.vendor) {
            gpuDesc += ` - ${detection.gpu.vendor}`;
        }
    }

    // 内存描述
    let memoryDesc = '未知';
    if (detection.memory.deviceMemoryGB !== undefined) {
        memoryDesc = `${detection.memory.deviceMemoryGB} GB`;
    } else {
        // 降级：显示存储配额作为参考
        memoryDesc = `约 ${Math.round(detection.memory.storageQuotaGB)} GB 配额`;
    }

    return {
        platform: platformDesc,
        gpu: gpuDesc,
        memory: memoryDesc
    };
}
