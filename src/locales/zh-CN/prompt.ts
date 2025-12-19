// Prompt库模块翻译
export const prompt = {
    library: {
        title: 'Prompt 库',
        description: '高质量分析策略与 Prompt 集合',
    },
    category: {
        analysis: '数据分析',
        cleaning: '数据清洗',
        visualization: '可视化',
    },
    action: {
        copy: '复制 Prompt',
        use: '使用此 Prompt',
        copied: 'Prompt 已复制到剪贴板',
    },
    examples: {
        dataCleaningExpert: {
            title: '数据清洗专家',
            description: '专业的 CSV 数据清洗助手,可以处理缺失值、异常值和格式转换。',
            content: '你是一位资深数据分析师。请帮我清洗这份数据,主要关注以下几点:\\n1. 检查并处理缺失值\\n2. 识别异常值\\n3. 统一日期格式\\n请输出清洗后的 CSV 格式数据以及清洗报告。',
            tags: ['清洗', '预处理', 'CSV'],
        },
        salesTrend: {
            title: '销售趋势分析',
            description: '根据时间序列数据分析销售趋势,识别季节性和增长点。',
            content: '请根据提供的销售数据进行趋势分析:\\n1. 计算月度增长率\\n2. 识别销售旺季和淡季\\n3. 预测未来 3 个月的销售趋势\\n请使用折线图展示结果。',
            tags: ['分析', '趋势', '销售'],
        },
        userPersona: {
            title: '用户画像生成',
            description: '基于用户行为数据生成详细的用户画像和分群建议。',
            content: '根据用户的购买记录和浏览行为,请帮我:\\n1. 将用户分为高价值、潜力、流失风险三类\\n2. 生成每一类用户的典型画像\\n3. 针对不同群体提出营销建议',
            tags: ['分析', '用户', '聚类'],
        },
        complexChart: {
            title: '复杂图表生成',
            description: '生成组合图表,如帕累托图、双轴图等。',
            content: '请帮我用 Plotly.js 生成一个帕累托图,展示影响销售额的主要因素。左轴为销售额(柱状图),右轴为累计百分比(折线图)。',
            tags: ['可视化', '图表', 'Plotly'],
        },
    },
};
