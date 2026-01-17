/**
 * 欢迎界面翻译
 */
export default {
    // Hero Section - 首屏核心信息
    hero: {
        title: '不仅是 AI 分析，更是您的 私有数据科学家',
        subtitle: '本地优先 · 严格验证 · 完全透明',
        uploadButton: '上传第一个文件', // CTA按钮文案
        trustBadges: {
            local: '本地执行',
            offline: '隐私零妥协',
            desktop: 'PC端优化',
        },
    },

    // Trust & Safety Cards - 信任层（消除恐惧）
    valueProps: {
        privacy: {
            title: '数据隐形衣',
            desc: '原始数据从未离开这台电脑。我们采用**自动脱敏技术**，仅将必要的统计元数据（Schema）发送给云端 AI，确保敏感明细数据永不出域。',
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

    // Community - 社区互动区域
    community: {
        title: '加入 LiuliX 社区',
        subtitle: '与开发者和数据极客一起重新定义数据分析',
        discordTitle: '实时讨论',
        discordDesc: '遇到问题？有新想法？直接来 Discord 聊聊。',
        joinDiscord: '加入服务器',
        githubTitle: '开源共建',
        githubDesc: '查看源码、提交 Issue 或贡献 PR。',
        starGithub: '去 Star',
    },

    // Feature Highlights - 价值层（展示收益）
    featureHighlights: {
        sectionTitle: '为私有化数据分析设计的全栈方案',
        zeroSetup: {
            title: '开箱即用 · 零配置',
            desc: '内置 Python 与 DuckDB 引擎。新人入职无需配置环境，点开浏览器即可工作。基于浏览器 WASM 算力，无需上传服务器即可流畅处理百万级数据。',
            label: '全栈集成',
        },
        audit: {
            title: '数据隐形衣 · 本地优先',
            desc: '默认采用**云端隐私模式**，开箱即用。需要完全离线运行本地模型 (Ollama)？敬请期待 **LiuliX Desktop** 桌面版。',
            label: '隐私安全',
        },
        report: {
            title: '白盒审计 · 透明交付',
            desc: '清洗与分析过程自动生成可读代码。一键导出 PDF 报告，老板无需安装软件，浏览器即可查看交互式结论与代码审计。',
            label: '透明交付',
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
