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
    downloadHint: '⏳ 首次下载 4.3GB 模型，约需 10-30 分钟，完成后永久本地可用',
    status: {
        loading: '正在加载模型...',
        fetching: '正在下载模型参数 ({progress})',
        processing: '正在处理模型权重...',
        ready: '本地模型已就绪',
        unknown: '正在处理...',
        loadingFromCache: '正在从本地缓存读取模型...',
        downloading: '正在下载模型文件...',
        finish: '加载完成',
    }
};

/** 分析配置翻译（新增） */
export const config = {
    performanceQuality: '性能与质量',
    maxColumns: '最大分析列数',
    maxColumnsDesc: '更多列 = 更全面分析，但速度更慢',
    timeout: '分析超时时间',
    timeoutDesc: '愿意等待的最长时间（秒）',
    samplingRows: '采样行数',
    samplingRowsDesc: '用于AI分析的最大数据行数（超出将采样）'
};

/** 硬件检测与推荐翻译（新增） */
export const hardware = {
    detection: '硬件检测',
    detecting: '正在检测硬件配置...',
    detectionFailed: '硬件检测失败',
    platform: '平台',
    gpu: '显卡',
    memory: '内存',
    score: '综合评分',
    recommendation: 'AI 模式推荐',

    // 平台描述
    macM1Plus: 'MacBook (M系列)',
    macIntel: 'MacBook (Intel)',
    windows: 'Windows PC',
    linux: 'Linux',
    unknown: '未知设备',

    // GPU描述
    gpuNotDetected: '未检测到GPU',
    gpuSoftware: '软件模拟（无硬件加速）',
    gpuHigh: '独立显卡（高性能）',
    gpuMedium: '独立显卡（中等性能）',
    gpuIntegrated: '集成显卡',

    // 推荐模式
    recommendedMode: '推荐模式',
    localMode: '本地模型 (本地)',
    apiMode: '云端模型 (API)',
    confidence: '推荐置信度',
    confidenceHigh: '高',
    confidenceMedium: '中',
    confidenceLow: '低',

    // 推荐理由
    reason: '推荐理由',
    technicalDetails: '技术评分',
    expectedLoadTime: '首次加载耗时',
    expectedInferenceTime: '预计推理耗时',

    // 优缺点
    pros: '优点',
    cons: '不足',

    // 按钮
    useRecommended: '使用推荐配置',
    keepCurrent: '保持当前配置',
    redetect: '重新检测',

    // 推荐理由
    reasonMacPlus: 'MacBook Pro M系列，硬件性能优秀，本地AI体验流畅',
    reasonGood: '您的设备配置优秀，本地AI模型性能出色',
    reasonMedium: '您的设备配置一般，建议使用云端AI获得更快速度和更好体验',
    reasonLow: '您的设备配置较低，强烈建议使用云端AI获得流畅体验'
};
