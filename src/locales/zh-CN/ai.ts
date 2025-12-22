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

// 本地模型模块翻译（新增）
export const localModel = {
    init: '初始化本地模型...',
    downloadHint: '⏳ 首次下载 4.3GB 模型，约需 10-30 分钟，完成后永久离线可用',
    status: {
        loading: '正在加载模型...',
        fetching: '正在下载模型参数 ({progress})',
        processing: '正在处理模型权重...',
        ready: '本地模型已就绪',
        unknown: '正在处理...',
    }
};

/** 分析配置翻译（新增） */
export const config = {
    performanceQuality: '性能与质量',
    maxColumns: '最大分析列数',
    maxColumnsDesc: '更多列 = 更全面分析，但速度更慢',
    timeout: '分析超时时间',
    timeoutDesc: '愿意等待的最长时间（秒）'
};
