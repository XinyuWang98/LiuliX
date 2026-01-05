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
