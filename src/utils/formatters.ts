/**
 * 数字格式化工具
 * 将大数字简化为 K/M/B 格式
 */

/**
 * 格式化大数字
 * @param num 数字
 * @returns 格式化后的字符串 (如 1.2K, 3.5M, 1.2B)
 */
export function formatLargeNumber(num: number): string {
    if (num < 1000) {
        return num.toString();
    }

    if (num < 1000000) {
        return (num / 1000).toFixed(1) + 'K';
    }

    if (num < 1000000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }

    return (num / 1000000000).toFixed(1) + 'B';
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串 (如 1.2KB, 3.5MB, 1.2GB)
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return bytes + ' B';
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
    }

    if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

/**
 * 格式化百分比
 * @param ratio 比例 (0-1)
 * @param decimals 小数位数
 * @returns 格式化后的百分比字符串
 */
export function formatPercentage(ratio: number, decimals: number = 1): string {
    return (ratio * 100).toFixed(decimals) + '%';
}
