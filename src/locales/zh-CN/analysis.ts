// 洞察链、探索流、证据池、质量、报告模块翻译
export const insightChain = {
    title: '洞察分析',
    loading: '正在挖掘洞察...',
    loadingHypothesis: '正在生成假设...',
    noHypotheses: '暂无假设卡片',
    initializing: '正在准备分析环境...',
    waitingForData: '等待数据就绪...',
    readyHint: '点击"生成假设"开始分析',
    noInsights: '暂无洞察结果',
    generateHypothesis: '生成假设',
    customHypothesis: '自定义假设',
    customPlaceholder: '输入你的分析假设...',
    submit: '提交分析',
    adopt: '采纳',
    ignore: '忽略',
    adopted: '已采纳',
    ignored: '已忽略',
    viewCode: '查看代码',
    copyCode: '复制代码',
    codeCopied: '代码已复制',
    conclusion: '结论',
    analysisMethod: '分析方法',
    dataSource: '数据来源',
    selectHypothesis: '选择一个假设开始分析',
    or: '或',
    results: '洞察结果',
    analyzing: '正在执行洞察分析...',
    generatingInsight: '正在生成洞察分析...',
};

export const analysis = {
    readyHint: '分析准备就绪',
    waitingForData: '正在等待数据...',
    initializing: '正在初始化分析环境...',
};

export const progress = {
    generatingPrompt: '正在构建分析提示词...',
    sendingRequest: '正在请求 AI 模型...',
    analyzingResponse: '正在解析 AI 响应...',
    validating: '正在验证分析代码...',
    generatingInsight: '正在生成洞察结果...',
    generatingHypothesis: '正在生成假设...',
};

// 森林式下钻交互相关翻译
export const insight = {
    recommendedAction: 'AI 推荐',
    recommendedActions: '推荐分析',
    customAnalysis: '自选分析',
    selectMethod: '选择分析方法',
    selectColumn: '选择列',
    selectColumn2: '选择第二列',
    pleaseSelect: '请选择...',
    execute: '执行',
    analyzing: '正在分析...',
    viewCode: '查看代码',
    drillDown: '下钻分析',
    maxDepthReached: '已达到最大下钻深度',
    sampling: {
        badge: '采样',
        tooltip: '数据已采样 ({{count}}行)',
        unknown: '未知',
    },
};

export const exploration = {
    title: '数据探索',
    addBlock: '添加分析模块',
    placeholder: '在此输入分析需求...',
    searchPlaceholder: '搜索对话...',
    chatPlaceholder: '输入消息与 AI 对话...',
    noContent: '暂无内容',
    actions: {
        collapse: '收起',
        expand: '展开',
        collapseNotebook: '收起 Notebook',
        expandNotebook: '展开 Notebook',
        pin: '置顶',
        unpin: '取消置顶',
        quote: '引用',
        addToEvidence: '加入证据池',
        moveUp: '上移',
        delete: '删除',
    },
    blocks: {
        upload: '数据清洗',
        cleaning: '清洗方案', // 保持与 cleaning.ts 一致
        hypothesis: '分析假设生成',
        insights: '洞察分析',
        report: '分析报告',
        chat: 'AI 助手',
    },
    sections: {
        projects: '项目选择',
        cleaning: '数据清洗', // Section Title: Just "Cleaning"
        insights: '洞察分析',
        report: '分析报告',
    },
    project: {
        grid: {
            title: '最近项目'
        },
        context: {
            rename: '重命名',
            delete: '删除'
        },
        card: {
            fileCount: '{{count}} 个文件',
            filesLabel: '个文件',
            nearLimit: '接近文件上限（最多10个）',
            uploadNew: '上传新文件'
        }
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
    adopt: '采纳',
    adopted: '✓ 已采纳',
    affectedRows: '影响 {count} 行',
    rowsChanged: '{before} 行 → {after} 行',
    type: {
        cleaning: '数据清洗',
        analysis: '数据分析',
        insight: '数据洞察',
        visualization: '可视化',
        insightChain: '洞察分析',
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
    tabs: {
        notebook: '报告笔记本',
        evidence: '证据池',
    },
    copy: '复制',
    copied: '已复制',
    download: '下载',
    copyToClipboard: '复制到剪贴板',
    downloadMarkdown: '下载 Markdown 报告',
    downloadPdf: '下载完整报告 (PDF)',
    noRecords: '暂无证据记录',
    noRecordsHint: '执行数据清洗和分析操作后，即可生成报告',
    noInsightChain: '暂无洞察链证据，请先完成数据分析并采纳证据',
    totalRecords: '证据总数',
    cleaningOps: '清洗操作',
    insights: '关键洞察',
    evidenceAdopted: '已采纳 {{count}} 条',
    previewHint: '点击上方按钮可复制或下载完整的 Markdown 报告',
    hideNotebook: '隐藏 Notebook',
    showNotebook: '显示 Notebook',
    useNewWorkbench: '使用新版工作台',
    aiAssistant: 'AI 报告小助手',
    evidenceCollected: '已收集证据 #{start} - #{end}，生成最终报告如下：',
    hypothesis: '假设',
    conclusion: '结论',
    viewCode: '查看代码',
    overallConclusion: '总体结论',
    basedOnInsights: '基于以上 {count} 条洞察链分析，建议：',
    suggestion1: '对数据进行分层清洗，重点关注高影响字段',
    suggestion2: '补充缺失值填充策略，避免偏差',
    suggestion3: '定期复查重复数据，确保数据质量',
    // Markdown 报告生成相关
    generatedAt: '生成时间',
    dataSource: '数据源',
    sampleData: '示例数据',
    recordsUnit: '条',
    cleaningSection: '数据清洗记录',
    analysisSection: '数据分析记录',
    insightsSection: '关键洞见',
    visualizationSection: '可视化建议',
    timestamp: '时间',
    operationType: '类型',
    description: '操作说明',
    tags: '标签',
    analysisResult: '分析结果',
    analysisSql: '分析 SQL',
    detailInfo: '详细信息',
    nextSteps: '后续计划',
    upgradeRoadmap: '后续升级计划',
    roadmapHtml: '升级为交互式 HTML 报告（支持点击证据展开 SQL）',
    roadmapCharts: '嵌入数据表格和图表',
    roadmapThemes: '支持主题样式切换',
    roadmapExport: '单文件 HTML 导出',
    generatedBy: '本报告由',

    // V0双角色报告新增
    notebook: {
        title: 'Notebook 模式',
        copyCell: '复制Cell',
        copyAllToColab: '复制全部到Colab',
        runDisabled: 'V0版本暂不支持执行',
        runDisabledTip: '请复制代码到Google Colab执行',
        copyCode: '复制代码',
        codeCopied: '代码已复制',
        defaultTitle: 'LiuliX 智能分析报告',
        defaultSigner: 'AI 数据分析师',
        viewMode: {
            pure: '纯净代码',
            enhanced: '增强代码',
            pureHint: '可直接复制到 Colab 运行',
            enhancedHint: '包含防护代码，用于问题排查',
        },
    },

    audit: {
        pending: '待审核',
        approved: '已通过',
        rejected: '有问题',
        markApproved: '标记为已审计',
        markRejected: '标记问题',
        addNote: '添加备注',
        progress: '审计进度',
        signReport: '签字并锁定报告',
        reportSigned: '报告已锁定',
        signedBy: '审计人',
        signedAt: '审计时间',
        reportLocked: '报告已锁定',
        unlockAndReaudit: '解锁并重新审计',
        confirmSign: '确认签字',
        signConfirmMessage: '我已审计所有Cell，确认无误',
        allCellsReviewed: '所有Cell已审核',
        issueType: '问题类型',
        issueSqlLogic: 'SQL逻辑错误',
        issueDataAnomaly: '数据异常',
        issueChartInaccurate: '图表不准确',
        issueConclusion: '结论不合理',
        note: '备注',
        submit: '提交'
    },

    export: {
        download: '下载',
        downloadIpynb: '下载 .ipynb 文件',
        successIpynb: '已下载.ipynb文件',
        uploadToColab: '请前往 colab.research.google.com 上传',
        exportDisabled: '需要签字后才能导出',
        exportPDF: '导出PDF',
        exportMarkdown: '导出 Markdown',
        downloadHTML: '下载 HTML 报告',
        successMarkdown: 'Markdown 已复制到剪贴板',
        successHTML: 'HTML 报告已下载',
        needSignFirst: '请先完成审计签字',
        colabInstructions: '请在Google Colab中上传并运行'
    },

    mode: {
        notebook: 'Notebook',
        report: 'Report',
        switchTo: '切换到'
    },

    status: {
        notSignedYet: '报告尚未签字审计',
        canPreviewNoExport: '可查看Report预览，但无法导出'
    },

    actions: {
        showCode: '显示代码',
        hideCode: '隐藏代码',
    },

    // Phase 1: 左右分栏新增
    annotation: {
        placeholder: '点击此处添加业务洞察...',
    },
    code: {
        title: '代码',
        lines: '行',
    },
    cell: {
        defaultTitle: '分析结果',
    },
    globalSetup: {
        title: '全局设置',
        collapsed: '（点击展开）',
        lines: '行 import 语句',
    }
};
