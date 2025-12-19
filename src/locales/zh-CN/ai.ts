// AI成本提示模块翻译（新增）
export const aiCost = {
    title: 'AI 成本提示',
    fileCount: '您正在上传 {count} 个文件',
    estimatedCalls: '预计消耗 {calls} 次 AI 调用额度',
    quotaInsufficient: '当前免费额度不足，请配置自有 API Key',
    quotaRemaining: '剩余免费额度：{count} 次',
    configureAPI: '配置 API Key',
    confirmProceed: '确认继续',
    costSavingTip: '配置自有 API 可节约成本并提升调用速度'
};

// AI重试模块翻译（新增）
export const aiRetry = {
    title: 'AI 处理失败',
    retryButton: '重试',
    retrying: '正在重试...',
    failed: 'AI开小差了，点击重试',
    staleHint: '数据已清洗，正在重新分析...',
    noSuggestionsHint: '暂无AI清洗建议，可能是数据质量良好或AI服务暂时不可用', // 🚀 新增
};

// 采样标记翻译（新增）
export const cache = {
    basedOnSample: {
        hint: '基于采样数据分析',
        sampleSize: '采样行数：{size}',
        totalSize: '总行数：{total}',
        note: '为提升分析速度，仅使用前 {size} 行数据',
    },
};
