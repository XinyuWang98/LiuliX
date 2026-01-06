export const packages = {
    basic: {
        name: '基础分析包',
        sizeEstimate: '总是加载',
        methods: {
            distribution: {
                name: '分布分析',
                desc: '查看数据分布情况 (直方图/条形图)',
            },
            correlation: {
                name: '相关性分析',
                desc: '分析变量间的相关关系',
            },
            trend: {
                name: '趋势分析',
                desc: '分析时间序列趋势',
            },
            stats: {
                name: '统计摘要',
                desc: '基础统计指标 (均值/中位数等)',
            },
            groupby: {
                name: '分组聚合',
                desc: '按类别分组统计',
            },
            topn: {
                name: 'Top-N 分析',
                desc: '查看排名靠前的数据',
            },
            missing: {
                name: '缺失值分析',
                desc: '可视化缺失数据模式',
            },
            outlier: {
                name: '异常值检测',
                desc: '识别数据中的异常点',
            },
            crosstab: {
                name: '交叉表分析',
                desc: '多维度交叉统计',
            },
        },
    },
    sklearn: {
        name: '机器学习包 (Scikit-learn)',
        sizeEstimate: '~8MB (延迟加载)',
        methods: {
            cluster: {
                name: '聚类分析',
                desc: 'K-Means 等聚类算法',
            },
            decisionTree: {
                name: '决策树分析',
                desc: '构建并可视化决策树',
            },
        },
    },
    statsmodels: {
        name: '统计建模包 (Statsmodels)',
        sizeEstimate: '~12MB (延迟加载)',
        methods: {
            regression: {
                name: '回归分析',
                desc: '线性回归/逻辑回归建模',
            },
        },
    },
    charts: {
        histogram: '直方图',
        bar: '条形图',
        scatter: '散点图',
        box: '箱线图',
        heatmap: '热力图',
        line: '折线图',
        movingAvg: '移动平均',
        statsSummaryBar: '统计图',
        groupedBar: '分组条形图',
        rankingBar: '排行榜',
        missingMatrix: '缺失矩阵',
        scatterAnnotated: '标记散点图',
        stacked: '堆叠图',
        pcaScatter: 'PCA降维图',
        clusterDist: '聚类分布图',
        decisionTreeVis: '决策树',
        coefficientPlot: '系数图',
        wordcloud: '词云',
        wordFreqBar: '词频图',
        wordFreqTable: '词频表',
    },
    fonts: {
        simhei: '中文字体 (SimHei)',
        msgothic: '日语字体 (MS Gothic)',
        malgun: '韩语字体 (Malgun Gothic)'
    },
    libraries: {
        pandas: 'Pandas 数据处理库',
        numpy: 'NumPy 数值计算库',
        matplotlib: 'Matplotlib 可视化库',
        seaborn: 'Seaborn 统计可视化库',
        scipy: 'SciPy 科学计算库',
        'scikit-learn': 'Scikit-learn 机器学习库',
        statsmodels: 'Statsmodels 统计建模库',
    }
};
