/**
 * 格式化日期值为易读字符串 (yyyy-MM-dd HH:mm:ss 或 yyyy-MM-dd)
 * @param value 日期值 (可能是时间戳数字、时间戳字符串、Date对象或日期字符串)
 * @param includeTime 是否包含时间部分
 * @returns 格式化后的日期字符串，无法解析则返回原值
 */
/**
 * 格式化时间戳或日期值为易读字符串
 * @param value 日期值 (可能是时间戳数字/浮点数、时间戳字符串、Date对象或日期字符串)
 * @param includeTime 是否包含时间部分 (默认 true)
 * @returns 格式化后的日期字符串，无法解析则返回原值
 */
/**
 * 解析各种格式的时间戳为 Date 对象
 * 特别处理 DuckDB 返回的浮点型时间戳
 */
export function parseTimestamp(value: any): Date | null {
    if (value === null || value === undefined) return null;
    let date: Date;

    // 预处理：如果是字符串但内容纯数字（可能是浮点数字符串 '1730527156391.819'）
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
        value = Number(value);
    }

    if (typeof value === 'number') {
        // 处理浮点数时间戳 (例如 1730527156391.819 毫秒)
        // 取整处理
        let ts = Math.floor(value);

        if (ts > 1000000000000000) { // 微秒
            date = new Date(ts / 1000);
        } else if (ts > 1000000000000) { // 毫秒
            date = new Date(ts);
        } else { // 秒
            date = new Date(ts * 1000);
        }
    } else {
        date = new Date(value);
    }

    // 检查是否有效
    if (isNaN(date.getTime())) {
        return null;
    }
    return date;
}

export function formatTimestamp(value: any, includeTime: boolean = true): string {
    const date = parseTimestamp(value);
    if (!date) return String(value ?? '-'); // Fallback to string representation

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (!includeTime) {
        return `${year}-${month}-${day}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 兼容旧API: 格式化日期 (默认不带时间，除非 formatTimestamp 的默认是有意的?)
 * 保持原有 formatDate 语义：默认 includeTime=false 吗？
 * 查看原代码: export function formatDate(value: any, includeTime: boolean = false)
 * 为保持兼容，这里保留 formatDate，并在内部调用 formatTimestamp
 */
export function formatDate(value: any, includeTime: boolean = false): string {
    return formatTimestamp(value, includeTime);
}
