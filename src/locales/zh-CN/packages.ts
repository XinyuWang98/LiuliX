// 分析能力包中文翻译
export const packages = {
    // 基础分析包
    basic: {
        name: '基础分析',
        sizeEstimate: '~8MB',
        methods: {
            distribution: { name: '分布分析', desc: '查看单一变量的数据分布情况' },
            correlation: { name: '相关性分析', desc: '分析两个变量之间的关系' },
            trend: { name: '趋势分析', desc: '分析数值随时间的变化趋势' },
            stats: { name: '描述性统计', desc: '计算均值、中位数、标准差等统计指标' },
            groupby: { name: '分组聚合', desc: '按分类变量分组计算聚合指标' },
            topn: { name: 'Top N 排行', desc: '找出频次最高的 Top N 项' },
            missing: { name: '缺失值分析', desc: '可视化缺失值分布模式' },
            outlier: { name: '异常值检测', desc: '识别数据中的异常离群点' },
            crosstab: { name: '交叉表分析', desc: '分析两个分类变量的交叉分布' },
        }
    },

    // 机器学习包
    sklearn: {
        name: '机器学习',
        sizeEstimate: '~12MB',
        methods: {
            cluster: { name: 'K-Means 聚类', desc: '发现数据中的潜在群体' },
            decisionTree: { name: '决策树分析', desc: '挖掘影响目标变量的关键规则' },
        }
    },

    // 统计建模包
    statsmodels: {
        name: '统计建模',
        sizeEstimate: '~8MB',
        methods: {
            regression: { name: 'OLS 回归分析', desc: '量化各因素对目标变量的独立影响' },
        }
    },

    // 图表类型
    charts: {
        histogram: '直方图',
        bar: '柱状图',
        scatter: '散点图',
        box: '箱线图',
        heatmap: '热力图',
        line: '折线图',
        movingAvg: '移动平均线',
        statsSummaryBar: '统计摘要条形图',
        groupedBar: '分组柱状图',
        rankingBar: '排行柱状图',
        missingMatrix: '缺失值矩阵图',
        scatterAnnotated: '散点标注图',
        stacked: '堆叠柱状图',
        pcaScatter: 'PCA 降维散点图',
        clusterDist: '群体分布图',
        decisionTreeVis: '决策树可视化图',
        coefficientPlot: '系数森林图 (Coefficient Plot)',
    },

    // 字体
    fonts: {
        simhei: '中文 (SimHei)',
        msgothic: '日文 (MS Gothic)',
        malgun: '韩文 (Malgun Gothic)',
    }
};
