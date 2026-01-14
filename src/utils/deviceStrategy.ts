import { getBrowserMemory, getFileSizeLimit } from './resourceLimits';
import { formatFileSize } from './formatters';

/**
 * 设备内存档位信息
 */
export interface DeviceStrategyInfo {
    /** 内存档位 */
    memoryTier: 'low' | 'standard' | 'mainstream' | 'highPerf' | 'flagship' | 'ultimate';
    /** 设备内存 (MB) */
    memoryMB: number;
    /** 文件大小限制（格式化字符串） */
    fileSizeLimit: string;
    /** Pyodide 最大行数 */
    maxRows: number;
    /** 最大并发数（根据内存动态计算） */
    maxConcurrency: number;
    /** 预估推理时间 */
    estimatedInferenceTime: string;
}

/**
 * 获取当前设备的内存档位标识
 */
function getMemoryTier(memoryGB: number): DeviceStrategyInfo['memoryTier'] {
    if (memoryGB >= 32) return 'ultimate';
    if (memoryGB >= 24) return 'flagship';
    if (memoryGB >= 16) return 'highPerf';
    if (memoryGB >= 8) return 'mainstream';
    if (memoryGB >= 4) return 'standard';
    return 'low';
}

/**
 * 计算最大并发数（基于内存动态计算）
 */
function calculateMaxConcurrency(memoryGB: number): number {
    if (memoryGB >= 16) return 5;
    if (memoryGB >= 8) return 3;
    return 1;
}

/**
 * 获取预估推理时间
 */
function getEstimatedInferenceTime(memoryTier: DeviceStrategyInfo['memoryTier']): string {
    if (memoryTier === 'ultimate' || memoryTier === 'flagship') return '3s';
    if (memoryTier === 'highPerf') return '5s';
    if (memoryTier === 'mainstream') return '8s';
    if (memoryTier === 'standard') return '12s';
    return '15s';
}

/**
 * 获取档位对应的最大行数（用于UI展示）
 */
function getTierMaxRows(memoryGB: number): number {
    if (memoryGB >= 32) return 800000;  // 🟣 极致 80万
    if (memoryGB >= 24) return 500000;  // 🔵 旗舰 50万
    if (memoryGB >= 16) return 300000;  // 🟢 高性能 30万
    if (memoryGB >= 8) return 100000;   // 🟡 主流 10万
    if (memoryGB >= 4) return 50000;    // 🟠 标准 5万
    return 30000;                       // 🔴 低配 3万
}

/**
 * 获取当前设备的策略信息
 * 用于在上传界面展示给用户
 */
export function getDeviceStrategyInfo(): DeviceStrategyInfo {
    const browserMemory = getBrowserMemory();
    const memoryGB = browserMemory / (1024 * 1024 * 1024);

    // 🐛 调试日志
    console.log('[设备策略] 浏览器内存:', {
        原始字节: browserMemory,
        内存GB: memoryGB.toFixed(2),
        档位计算: memoryGB >= 32 ? '极致' : memoryGB >= 24 ? '旗舰' : memoryGB >= 16 ? '高性能' : memoryGB >= 8 ? '主流' : memoryGB >= 4 ? '标准' : '低配'
    });

    const memoryTier = getMemoryTier(memoryGB);
    const fileSizeLimitBytes = getFileSizeLimit();
    const maxRows = getTierMaxRows(memoryGB); // 使用档位最大值，而非动态计算
    const maxConcurrency = calculateMaxConcurrency(memoryGB);
    const estimatedInferenceTime = getEstimatedInferenceTime(memoryTier);

    console.log('[设备策略] 计算结果:', { memoryTier, maxRows, fileSizeLimit: formatFileSize(fileSizeLimitBytes) });

    return {
        memoryTier,
        memoryMB: browserMemory / (1024 * 1024),
        fileSizeLimit: formatFileSize(fileSizeLimitBytes),
        maxRows,
        maxConcurrency,
        estimatedInferenceTime,
    };
}

/**
 * 格式化行数显示（支持国际化）
 * @param rows 行数
 * @param language 语言代码（'zh-CN' 或 'en-US'）
 */
export function formatRowCount(rows: number, language: string = 'zh-CN'): string {
    if (rows >= 10000) {
        const value = (rows / 10000).toFixed(0);
        // 中文用"万"，英文用"k"
        return language === 'zh-CN' ? `${value}万` : `${rows / 1000}k`;
    }
    return rows.toLocaleString();
}
