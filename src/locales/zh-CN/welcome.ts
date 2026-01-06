/**
 * 欢迎界面翻译
 */
export default {
    // Hero Section - 首屏核心信息
    hero: {
        title: '白盒式交互分析引擎',
        subtitle: '本地优先 · 严格验证 · 完全透明',
        uploadButton: '上传第一个文件', // CTA按钮文案
        trustBadges: {
            local: '本地执行',
            offline: '离线可用*',
            desktop: 'PC端优化',
        },
    },

    // Trust & Safety Cards - 信任层（消除恐惧）
    valueProps: {
        privacy: {
            title: '数据隐形衣',
            desc: '您的数据从未离开这台电脑。我们把最先进的AI模型搬进了您的浏览器，让您在断网环境下也能处理敏感财务数据。',
        },
        safety: {
            title: '先预演，再执行',
            desc: '拒绝AI瞎指挥。每一条建议都经过真实数据的沙箱预演，明确告知"将影响5行数据"，所见即所得。',
        },
        control: {
            title: '听话的超级实习生',
            desc: 'AI负责提供灵感(Router),专家规则负责写代码(Inflater)。既有AI的聪明，又有工程师的严谨。',
        },
    },

    // Feedback - 用户反馈区域
    feedback: {
        title: '💬 您的反馈',
        subtitle: '帮助我们打造更好的LiuliX',
        emailPlaceholder: '邮箱（可选，用于回复）',
        contentPlaceholder: '请分享您的想法、建议或遇到的问题...',
        typeFeature: '功能建议',
        typeBug: 'Bug报告',
        typeQuestion: '使用问题',
        typeOther: '其他',
        submitButton: '提交反馈',
        successMessage: '感谢您的反馈！我们会仔细阅读并考虑您的建议。',
        errorMessage: '请填写反馈内容',
    },

    // Feature Highlights - 价值层（展示收益）
    featureHighlights: {
        sectionTitle: 'LiuliX的独特优势',
        zeroSetup: {
            title: '零配置极速启动',
            desc: '告别繁琐配置。LiuliX内置科学计算栈(Pandas/Scikit-learn),拖入文件即刻开跑。在飞机上也能跑数据。',
            label: '内置引擎', // Built-in Engine
        },
        audit: {
            title: '秒级回溯',
            desc: '这不是Log,这是您的"分析黑匣子"。LiuliX的每一步操作都会生成不可篡改的证据记录，随时回溯，一键审计。',
            label: '审计追踪', // Audit Trail
        },
        report: {
            title: '分析即报告',
            desc: '摒弃"先分析再写PPT"的传统流程。您采纳的每一个洞察都会自动汇聚成一份交互式报告。点击导出，即刻交付。',
            label: '自动报告', // Auto Report
        },
    },

    // Roadmap - 专业背书层（提供证据）
    roadmap: {
        sectionTitle: '产品路线图',
        sectionDescription: '由社区反馈驱动的产品路线图',
        v1: {
            version: 'V1.0',
            label: '当前版本',
            subtitle: '单兵作战工具',
            feature1: '本地隐私计算引擎 (DuckDB In-Browser)',
            feature2: '智能数据清洗 (AI Data Cleaning)',
            feature3: '交互式洞察报告 (Analysis Notebook)',
        },
        v15: {
            version: 'V1.5',
            label: '即将推出',
            subtitle: '社区协作生态',
            feature1: '提示词广场 (Prompt Marketplace)',
            feature2: '分析案例库 (Case Study Library)',
            feature3: '创作者激励计划 (Creator Rewards)',
        },
        v2: {
            version: 'V2.0',
            label: '未来愿景',
            subtitle: '团队协作空间',
            feature1: '团队知识库 (Team Knowledge Base)',
            feature2: '多人实时协作 (Multiplayer Collaboration)',
            feature3: '长期指标监控 (Metric Monitoring)',
        },
    },

    // 保留原有字段（向后兼容）
    heroTitle: '白盒式交互分析引擎',
    heroSubtitle: '全流程透明可溯,快速生成可验证的深度报告',
    prefix: '欢迎使用',
    title: 'LiuliX',
    subtitle: '透明如琉璃的数据探索平台，让AI助你轻松分析数据',
    p0Completed: '核心功能已就绪',
    features: {
        typeSystem: '强类型系统',
        cssVariables: 'CSS变量',
        themes: '主题支持',
        promptLibrary: 'Prompt库',
        projectConfig: '项目配置',
        themeSwitch: '主题切换',
        fileUpload: '文件上传',
    },
    functionsTitle: '功能特性',
    functions: {
        supportFormats: '支持 CSV/Excel',
        dragUpload: '拖拽上传',
        largeFileDetection: '大文件检测',
        sampleRatio: '采样率控制',
    },
    uploadButton: '上传第一个文件',
    feature1: '本地隐私安全\n数据不离本地，在浏览器端完成全量分析，彻底杜绝隐私泄露风险。',
    feature2: '专家大脑引擎\n内置高阶分析思维链，大幅降低 AI 幻觉，提供精准可信的业务洞察。',
    feature3: '白盒化可追溯\n每一条结论均可点击回溯原始数据证据，交互式验真，告别黑盒猜测。',
};
