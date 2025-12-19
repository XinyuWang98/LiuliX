/**
 * 趋势分析 Prompt 模板
 * 用于生成时间序列趋势的一句话总结（如：本周异常量较上周上升23%，疑似受API限流影响）
 */

/**
 * 生成趋势分析的 prompt
 * @param 时间序列数据 - 按时间排序的异常数统计数据，数组格式：[{ date: string; count: number }, ...]
 * @returns prompt 字符串
 */
export function 生成趋势Prompt(时间序列数据: { date: string; count: number }[]): string {
    // 将数据转成易读的文本描述
    const dataText = 时间序列数据
        .map(item => `${item.date}: ${item.count}条异常`)
        .join('\n');

    const totalCount = 时间序列数据.reduce((sum, item) => sum + item.count, 0);

    return `
你是一个专业的数据趋势分析师，以下是最近一段时间的异常数据统计（按日期排序）：

${dataText}

总异常数：${totalCount}条

请生成一句话趋势总结，严格遵守以下要求：
- 必须包含具体变化幅度（百分比或绝对值），例如“上升23%”“下降15%”“持平”
- 必须包含一个合理的可能原因猜测（常见原因：API限流、爬虫中断、数据源变更、业务高峰等）
- 总长度控制在35字以内
- 用中文回复，直接输出一句话，不要任何前缀、后缀、解释或标点符号以外的内容

示例输出：
本周异常量较上周上升23%，疑似受API限流影响。
`.trim();
}

/**
 * 解析 AI 返回的趋势分析结果
 * @param AI返回结果 - Gemini API 返回的原始文本
 * @returns 一句话趋势总结字符串（若解析失败返回默认兜底文案）
 */
export function 解析趋势结果(AI返回结果: string): string {
    const trimmed = AI返回结果.trim();

    // 简单安全校验：长度合理、包含百分比或“上升/下降/持平”等关键词
    if (trimmed.length > 10 && trimmed.length < 60 && /[%上升下降持平]/.test(trimmed)) {
        return trimmed;
    }

    // 解析失败时返回保守兜底文案
    return '近期异常量波动平稳，无明显趋势。';
}