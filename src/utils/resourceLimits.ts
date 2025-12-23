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
 * 共享给memoryAssessment和文件上传使用
 */
export function getBrowserMemory(): number {
    try {
        if ('memory' in performance && (performance as any).memory) {
            const memory = (performance as any).memory;
            // jsHeapSizeLimit 是V8分配的最大内存
            return memory.jsHeapSizeLimit || RESOURCE_LIMITS.MIN_BROWSER_MEMORY;
        }
    } catch (error) {
        logger.warn('资源管理', 'performance.memory不可用', error);
    }

    // 降级：假设4GB
    return 4 * 1024 * 1024 * 1024;
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

    // 基于内存分级
    if (memoryGB >= 16) return 500 * 1024 * 1024;  // 16GB+ → 500MB
    if (memoryGB >= 8) return 200 * 1024 * 1024;  // 8GB  → 200MB
    if (memoryGB >= 4) return 100 * 1024 * 1024;  // 4GB  → 100MB

    // 低内存设备
    return 50 * 1024 * 1024;  // <4GB → 50MB
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
