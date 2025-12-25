// 主题、智能工坊等小模块翻译
export const themes = {
    "apple-dark": "Apple 极简暗黑",
    "apple-light": "Apple 极简明亮",
    neufuture: 'Neufuture 暗夜版',
    professional: '高对比度专业版',
    minimal: '极简亮白版',
};

export const workshop = {
    title: '智能工坊',
    cleaning: '数据清洗建议',
    cleaningDesc: 'AI智能分析数据质量，生成清洗建议',
    exploration: '数据探索',
    explorationDesc: '自动生成数据分析报告和可视化',
    hypothesis: '分析假设',
    hypothesisDesc: '基于数据特征生成分析假设',
    suggestions: '分析建议',
    suggestionsDesc: 'AI推荐合适的分析方法和步骤',
    mindMap: '思维导图',
    mindMapDesc: 'AI自动生成分析思路导图',
    voiceReport: '语音报告',
    voiceReportDesc: '生成分析结果的语音解读',
    pptReport: 'PPT报告',
    pptReportDesc: '自动生成演示文稿',
    tools: {
        cleaning: {
            title: '数据清洗建议',
            desc: 'AI智能分析数据质量，生成清洗建议',
            action: '生成建议'
        },
        exploration: {
            title: '数据探索',
            desc: '自动生成数据分析报告和可视化',
            action: '开始探索'
        },
        hypothesis: {
            title: '分析假设',
            desc: '基于数据特征生成分析假设',
            action: '生成假设'
        },
        suggestions: {
            title: '分析建议',
            desc: 'AI推荐合适的分析方法和步骤',
            action: '获取建议'
        }
    }
};

export const grid = {
    loading: '加载中...',
    loadStatsFailed: '加载统计信息失败',
    loadDataFailed: '加载数据失败',
    nullRate: '缺失率: {rate}%',
    uniqueValues: '{count} 个唯一值',
    missingPercent: '{percent}% 缺失',
    selectedColumns: '已选择 {count}/{total} 列',
    selectColumns: '选择列',
    clickToExpand: '点击展开统计',
    clickToCollapse: '点击收起统计',
    distribution: '统计',
    value: '值',
    count: '数量',
    selectAll: '全选',
    deselectAll: '取消全选',
};

export const pagination = {
    prev: '上一页',
    next: '下一页',
    page: '第',
    of: '/',
    totalPages: '页',
    totalRows: '共',
    rows: '行',
};

export const workflow = {
    upload: '上传文件',
    cleaning: '数据清洗',
    hypothesis: '分析假设',
    insights: '洞察分析',
    report: '分析报告',
};
