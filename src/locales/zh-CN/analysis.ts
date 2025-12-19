// 洞察链、探索流、证据池、质量、报告模块翻译
export const insightChain = {
    title: '洞察链分析',
    loading: '正在挖掘洞察...',
    loadingHypothesis: '正在生成假设...',
    noHypotheses: '暂无假设卡片',
    noInsights: '暂无洞察结果',
    generateHypothesis: '生成假设',
    customHypothesis: '自定义假设',
    customPlaceholder: '输入你的分析假设...',
    submit: '提交分析',
    adopt: '采纳',
    ignore: '忽略',
    adopted: '已采纳',
    viewCode: '查看代码',
    copyCode: '复制代码',
    codeCopied: '代码已复制',
    conclusion: '结论',
    analysisMethod: '分析方法',
    dataSource: '数据来源',
    selectHypothesis: '选择一个假设开始分析',
    or: '或',
};

export const exploration = {
    title: '数据探索',
    addBlock: '添加分析模块',
    placeholder: '在此输入分析需求...',
    searchPlaceholder: '搜索对话...',
    chatPlaceholder: '输入消息与 AI 对话...',
    actions: {
        collapse: '收起',
        expand: '展开',
        pin: '置顶',
        unpin: '取消置顶',
        quote: '引用',
        addToEvidence: '加入证据池',
        moveUp: '上移',
        delete: '删除',
    },
    blocks: {
        upload: '数据清洗',
        cleaning: '数据清洗建议',
        hypothesis: '分析假设生成',
        insights: '关键数据洞察',
        report: '分析报告',
        chat: 'AI 助手',
    }
};

export const evidence = {
    title: '证据池',
    noRecords: '暂无证据记录',
    noRecordsHint: '数据清洗和分析操作会自动记录在此',
    clearAll: '清空全部',
    pin: '置顶',
    unpin: '取消置顶',
    delete: '删除',
    affectedRows: '影响 {count} 行',
    rowsChanged: '{before} 行 → {after} 行',
    type: {
        cleaning: '数据清洗',
        analysis: '数据分析',
        insight: '数据洞察',
        visualization: '可视化',
        insightChain: '洞察链',
    },
};

export const quality = {
    title: '数据质量',
    score: '质量得分',
    issues: '发现问题',
    noData: '暂无数据',
    missingValues: '缺失值',
    duplicates: '重复行',
    good: '良好',
    needsReviews: '需要检查',
    criticalIssues: '严重问题',
    clickToImprove: '点击优化',
    healthScore: '健康度',
};

export const report = {
    title: '分析报告',
    copy: '复制',
    copied: '已复制',
    download: '下载',
    copyToClipboard: '复制到剪贴板',
    downloadMarkdown: '下载 Markdown 报告',
    noRecords: '暂无证据记录',
    noRecordsHint: '执行数据清洗和分析操作后，即可生成报告',
    totalRecords: '证据总数',
    cleaningOps: '清洗操作',
    insights: '关键洞察',
    previewHint: '点击上方按钮可复制或下载完整的 Markdown 报告',
};
