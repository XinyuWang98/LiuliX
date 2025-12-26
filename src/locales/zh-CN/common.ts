// 通用翻译模块
export const common = {
    loading: '加载中...',
    initializing: '正在初始化 Python 内核...',
    error: '错误',
    success: '成功',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    save: '保存',
    yes: '是',
    no: '否',
    search: '搜索',
    all: '全部',
    featureInDev: '功能开发中...',
    collapse: '收起',
    // 智能加载提示
    initCore: '正在初始化 Python 核心环境 ({current}/{total})...',
    loadPandas: '正在加载 Pandas 数据分析库...',
    firstTimeTip: '💡 首次运行提示：正在配置本地分析引擎（约 20MB），这可能需要一点时间。下次启动将瞬间完成。',
};

export const data = {
    unique: '唯一值',
    missing: '缺失值',
    min: '最小值',
    max: '最大值',
    mean: '平均值',
};

export const nav = {
    appName: 'LiuliX',
    noProject: '未选择项目',
    dashboard: '数据探索',
    promptLibrary: 'Prompt 库',
    settings: '设置',
    user: '用户',
    theme: '切换主题',
};

// 侧边栏
export const sidebar = {
    collapse: '收起侧边栏',
};

// 聊天/交互
export const chat = {
    askAIPlaceholder: '询问 AI 关于你的数据...',
};

// 语言选择
export const language = {
    title: '语言',
    priority: '优先级',
};

// 硬件检测
export const hardware = {
    detection: '硬件检测',
    detecting: '正在检测硬件配置...',
    detectionFailed: '硬件检测失败',
    platform: '设备平台',
    gpu: '显卡',
    memory: '内存',
    score: '综合评分',
    recommendation: '智能推荐',

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
    localMode: '本地AI模型',
    apiMode: '云端AI',
    confidence: '置信度',
    confidenceHigh: '强烈推荐',
    confidenceMedium: '建议',
    confidenceLow: '可选',

    // 推荐理由
    reason: '推荐理由',
    technicalDetails: '技术详情',
    expectedLoadTime: '预期加载时间',
    expectedInferenceTime: '预期推理时间',

    // 优缺点
    pros: '优点',
    cons: '注意事项',

    // 按钮
    useRecommended: '使用推荐配置',
    keepCurrent: '保持当前配置',
    redetect: '重新检测',
};
