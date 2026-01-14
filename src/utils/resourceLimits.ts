/**
 * 资源管理与限制工具（统一配置）
 * 
 * 作用：
 * 1. 统一管理文件大小、内存阈值、安全限制
 * 2. 基于浏览器内存动态调整上传限制
 * 3. 为fileParser、memoryAssessment、FileUploader提供共享工具
 */

import { logger } from './logger';

/**
 * 资源限制配置（所有阈值的唯一来源）
 */
export const RESOURCE_LIMITS = {
    /** 文件大小阈值（静态基准） */
    FILE_SIZE_THRESHOLDS: {
        SMALL: 5 * 1024 * 1024,      // 5MB - 完整缓存
        MEDIUM: 50 * 1024 * 1024,    // 50MB - 抽样缓存
        SAMPLE_ROWS_MEDIUM: 5000,     // 中等文件抽样行数
        SAMPLE_ROWS_LARGE: 1000,      // 大文件抽样行数
    },

    /** 内存阈值（用于内存评估） */
    MEMORY_THRESHOLDS: {
        FULL_MODE_MAX: 0.3,      // 30%以下使用full模式
        SAMPLED_MODE_MAX: 0.6,   // 60%以下使用sampled模式
        AGGREGATED_MODE: 0.6,    // 超过60%强制aggregated
    },

    /** 安全上限（极端场景防护）⚠️ */
    SAFETY_LIMITS: {
        MAX_INSIGHTS_PER_RUN: 5,           // 每次最多执行5个洞察
        MAX_SAMPLE_ROWS_PRECISE: 10000,    // 精确模式最多1万行
        MEMORY_HARD_LIMIT: 0.7,            // 70%内存强制降级
        MEMORY_CRITICAL_LIMIT: 0.85,       // 85%显示警告
        MEMORY_EMERGENCY_LIMIT: 0.9,       // 90%停止所有任务
        MIN_FREE_MEMORY: 500 * 1024 * 1024, // 至少保留500MB
    },

    /** 浏览器内存要求 */
    MIN_BROWSER_MEMORY: 2 * 1024 * 1024 * 1024, // 最低2GB
};

/**
 * 获取浏览器可用内存（字节）
 * 使用多重检测策略应对 navigator.deviceMemory 的隐私保护机制
 * 
 * 已知问题：navigator.deviceMemory 返回 2 的幂次方近似值
 * - 12GB 设备 → 返回 8GB ❌
 * - 24GB 设备 → 返回 8GB 或 16GB ❌
 */
export function getBrowserMemory(): number {
    let detectedMemoryGB = 4; // 默认降级值
    let detectionMethod = '降级假设';

    try {
        // 方法 1: navigator.deviceMemory (主要方法，但有隐私保护限制)
        if ('deviceMemory' in navigator) {
            const deviceMemoryGB = (navigator as any).deviceMemory;
            if (deviceMemoryGB && typeof deviceMemoryGB === 'number') {
                detectedMemoryGB = deviceMemoryGB;
                detectionMethod = 'navigator.deviceMemory';

                // 🛠️ 修正策略：使用 jsHeapSizeLimit 作为辅助判断
                // 如果堆限制 > 2GB，但 deviceMemory 只有 4/8GB，可能是低估了
                if ('memory' in performance && (performance as any).memory) {
                    const heapLimitGB = (performance as any).memory.jsHeapSizeLimit / (1024 ** 3);

                    // Chrome 在高内存设备上会分配更大的堆
                    // 如果堆限制接近 4GB，但 deviceMemory 只有 8GB，实际可能是 16GB+
                    if (heapLimitGB >= 3.5 && deviceMemoryGB === 8) {
                        logger.warn('资源管理', `检测到堆限制${heapLimitGB.toFixed(1)}GB，但 deviceMemory=8GB，可能低估了，尝试修正为16GB`);
                        detectedMemoryGB = 16; // 修正为更高档位
                        detectionMethod += ' (修正)';
                    }
                }
            }
        }

        // 方法 2: 降级使用 performance.memory.jsHeapSizeLimit
        if (detectedMemoryGB === 4 && 'memory' in performance && (performance as any).memory) {
            const heapLimitBytes = (performance as any).memory.jsHeapSizeLimit;
            if (heapLimitBytes) {
                const heapLimitGB = heapLimitBytes / (1024 ** 3);
                logger.warn('资源管理', `仅检测到V8堆限制: ${heapLimitGB.toFixed(2)}GB (可能不准确)`);
                // 堆限制通常是实际内存的 1/2 到 1/4，但至少不低于此
                detectedMemoryGB = Math.max(4, heapLimitGB);
                detectionMethod = 'jsHeapSizeLimit (降级)';
            }
        }
    } catch (error) {
        logger.warn('资源管理', 'memory检测失败', error);
    }

    const finalMemoryBytes = detectedMemoryGB * 1024 * 1024 * 1024;
    logger.log('资源管理', `内存检测完成: ${detectedMemoryGB}GB (${detectionMethod})`);

    return finalMemoryBytes;
}


/**
 * 获取当前内存使用率（0-1）
 */
export function getMemoryUsage(): number {
    try {
        if ('memory' in performance && (performance as any).memory) {
            const memory = (performance as any).memory;
            return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        }
    } catch {
        // 降级
    }
    return 0.5; // 假设50%
}

/**
 * 基于浏览器内存动态获取文件大小限制
 * 
 * @returns 文件大小限制（字节）
 */
export function getFileSizeLimit(): number {
    const browserMemory = getBrowserMemory();
    const memoryGB = browserMemory / (1024 ** 3);

    logger.log('资源管理', '动态文件限制计算', {
        data: { memoryGB: memoryGB.toFixed(1) }
    });

    // 6档精细化分级（严格遵循55-专题-内存评估与采样策略规范）
    if (memoryGB >= 32) return 1200 * 1024 * 1024; // 🟣 极致 32GB+   → 1.2GB
    if (memoryGB >= 24) return 800 * 1024 * 1024;  // 🔵 旗舰 24-32GB → 800MB
    if (memoryGB >= 16) return 500 * 1024 * 1024;  // 🟢 高性能 16-24GB → 500MB
    if (memoryGB >= 8) return 200 * 1024 * 1024;  // 🟡 主流 8-16GB  → 200MB
    if (memoryGB >= 4) return 100 * 1024 * 1024;  // 🟠 标准 4-8GB   → 100MB

    // 🔴 低配 <4GB → 50MB
    return 50 * 1024 * 1024;
}

/**
 * 判断文件是否可以上传（综合判断）
 * 
 * @param fileSize 文件大小（字节）
 * @param rowCount 行数（可选，CSV预分析后提供）
 * @returns 判断结果
 */
export function canUploadFile(
    fileSize: number,
    rowCount?: number
): {
    canUpload: boolean;
    strategy: 'full' | 'warn' | 'force_sample';
    reason?: string;
    maxSize?: number;
} {
    // 保留rowCount供未来基于行数的精确判断
    void rowCount;

    const browserMemory = getBrowserMemory();
    const maxFileSize = getFileSizeLimit();
    const availableMemory = browserMemory * 0.6; // 60%可用
    const estimatedMemory = fileSize * 5; // 假设5倍膨胀（CSV→DataFrame）

    // 1. 检查文件大小是否超过动态限制
    if (fileSize > maxFileSize * 1.5) {
        return {
            canUpload: false,
            strategy: 'force_sample',
            reason: `文件大小${(fileSize / 1024 / 1024).toFixed(0)}MB超过限制${(maxFileSize / 1024 / 1024).toFixed(0)}MB`,
            maxSize: maxFileSize
        };
    }

    // 2. 估算内存占用
    if (estimatedMemory < availableMemory * 0.3) {
        // 内存充足，完整加载
        return {
            canUpload: true,
            strategy: 'full',
            maxSize: maxFileSize
        };
    }

    if (estimatedMemory < availableMemory * 0.6) {
        // 内存紧张，警告用户
        return {
            canUpload: true,
            strategy: 'warn',
            reason: `文件较大，建议采样（估算内存${(estimatedMemory / 1024 / 1024).toFixed(0)}MB）`,
            maxSize: maxFileSize
        };
    }

    // 3. 内存不足，强制采样
    return {
        canUpload: true,
        strategy: 'force_sample',
        reason: `内存不足，强制采样（估算${(estimatedMemory / 1024 / 1024).toFixed(0)}MB）`,
        maxSize: maxFileSize
    };
}

/**
 * 检查当前可用内存是否足够
 * 用于执行中动态检查
 */
export function checkAvailableMemory(): number {
    try {
        if ('memory' in performance && (performance as any).memory) {
            const memory = (performance as any).memory;
            return memory.jsHeapSizeLimit - memory.usedJSHeapSize;
        }
    } catch {
        // 降级
    }
    return 1 * 1024 * 1024 * 1024; // 假设1GB可用
}

/**
 * 判断是否应该显示内存警告
 */
export function shouldShowMemoryWarning(): boolean {
    const usage = getMemoryUsage();
    return usage > RESOURCE_LIMITS.SAFETY_LIMITS.MEMORY_CRITICAL_LIMIT;
}

/**
 * 判断是否应该停止所有后台任务
 */
export function shouldStopBackgroundTasks(): boolean {
    const usage = getMemoryUsage();
    return usage > RESOURCE_LIMITS.SAFETY_LIMITS.MEMORY_EMERGENCY_LIMIT;
}
