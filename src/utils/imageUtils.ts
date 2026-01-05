/**
 * 图片处理工具
 * 用于统一处理 Base64 图片数据的格式化
 */

/**
 * 格式化 Base64 图片字符串为完整的 Data URI
 * 智能判断是否已包含 data URI 前缀，如果没有则自动补全
 * 
 * @param base64 - Base64 编码字符串或完整的 data URI
 * @returns 完整的 data URI 字符串，如果输入为空则返回空字符串
 * 
 * @example
 * formatChartBase64('iVBORw0K...') // 返回 'data:image/png;base64,iVBORw0K...'
 * formatChartBase64('data:image/png;base64,iVBORw0K...') // 返回原字符串
 * formatChartBase64('') // 返回 ''
 */
export function formatChartBase64(base64?: string): string {
    // 空值检查
    if (!base64) return '';

    // 如果已包含 data URI 前缀，直接返回
    if (base64.startsWith('data:image')) return base64;

    // 补全前缀
    return `data:image/png;base64,${base64}`;
}

/**
 * 将 base64 字符串转换为 Blob 对象
 * @param base64 - Base64 编码字符串或完整的 data URI
 * @param mimeType - MIME 类型
 * @returns Blob 对象
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
    // 移除 data URI 前缀（如果有）
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');

    // 解码 base64
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

/**
 * 将 base64 转换为 Blob URL
 * 用于解决超长 base64 data URI 导致的 431 错误
 * @param base64 - Base64 编码字符串或完整的 data URI
 * @returns Blob URL (blob://...)
 * 
 * @example
 * const blobUrl = base64ToBlobUrl(base64Image);
 * // 使用后需要清理：URL.revokeObjectURL(blobUrl)
 */
export function base64ToBlobUrl(base64: string): string {
    if (!base64) return '';

    // 确保有 data URI 前缀
    if (!base64.startsWith('data:image')) {
        base64 = `data:image/png;base64,${base64}`;
    }

    const blob = base64ToBlob(base64);
    return URL.createObjectURL(blob);
}
