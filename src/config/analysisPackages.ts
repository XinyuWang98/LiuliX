/**
 * 分析能力包配置清单
 * 定义所有可用的分析能力包及其包含的方法
 * 注意：所有name/description字段都是i18n键，需要在组件中使用t()翻译
 */

import { AnalysisPackage } from '../types/analysisPackage';

/**
 * 基础分析包 (内置，始终加载)
 */
const basicPackage: AnalysisPackage = {
    id: 'basic',
    name: 'packages.basic.name',
    icon: '📊',
    pyodidePackages: ['pandas', 'numpy', 'matplotlib'],
    sizeEstimate: 'packages.basic.sizeEstimate',
    isBuiltIn: true,
    order: 0,
    methods: [
        {
            promptId: 'worker-distribution-v1',
            name: 'packages.basic.methods.distribution.name',
            description: 'packages.basic.methods.distribution.desc',
            outputCharts: ['packages.charts.histogram', 'packages.charts.bar']
        },
        {
            promptId: 'worker-correlation-v1',
            name: 'packages.basic.methods.correlation.name',
            description: 'packages.basic.methods.correlation.desc',
            outputCharts: ['packages.charts.scatter', 'packages.charts.box', 'packages.charts.heatmap']
        },
        {
            promptId: 'worker-trend-v1',
            name: 'packages.basic.methods.trend.name',
            description: 'packages.basic.methods.trend.desc',
            outputCharts: ['packages.charts.line', 'packages.charts.movingAvg']
        },
        {
            promptId: 'worker-stats-v1',
            name: 'packages.basic.methods.stats.name',
            description: 'packages.basic.methods.stats.desc',
            outputCharts: ['packages.charts.statsSummaryBar']
        },
        {
            promptId: 'worker-groupby-v1',
            name: 'packages.basic.methods.groupby.name',
            description: 'packages.basic.methods.groupby.desc',
            outputCharts: ['packages.charts.groupedBar']
        },
        {
            promptId: 'worker-topn-v1',
            name: 'packages.basic.methods.topn.name',
            description: 'packages.basic.methods.topn.desc',
            outputCharts: ['packages.charts.rankingBar']
        },
        {
            promptId: 'worker-missing-v1',
            name: 'packages.basic.methods.missing.name',
            description: 'packages.basic.methods.missing.desc',
            outputCharts: ['packages.charts.missingMatrix']
        },
        {
            promptId: 'worker-outlier-v1',
            name: 'packages.basic.methods.outlier.name',
            description: 'packages.basic.methods.outlier.desc',
            outputCharts: ['packages.charts.box', 'packages.charts.scatterAnnotated']
        },
        {
            promptId: 'worker-crosstab-v1',
            name: 'packages.basic.methods.crosstab.name',
            description: 'packages.basic.methods.crosstab.desc',
            outputCharts: ['packages.charts.heatmap', 'packages.charts.stacked']
        }
    ]
};

/**
 * 机器学习包 (scikit-learn)
 */
const sklearnPackage: AnalysisPackage = {
    id: 'sklearn',
    name: 'packages.sklearn.name',
    icon: '🧠',
    pyodidePackages: ['scikit-learn'],
    sizeEstimate: 'packages.sklearn.sizeEstimate',
    isBuiltIn: false,
    order: 1,
    methods: [
        {
            promptId: 'worker-cluster-v1',
            name: 'packages.sklearn.methods.cluster.name',
            description: 'packages.sklearn.methods.cluster.desc',
            outputCharts: ['packages.charts.pcaScatter', 'packages.charts.clusterDist']
        },
        {
            promptId: 'worker-decision-tree-v1',
            name: 'packages.sklearn.methods.decisionTree.name',
            description: 'packages.sklearn.methods.decisionTree.desc',
            outputCharts: ['packages.charts.decisionTreeVis']
        }
        // 后续可扩展：随机森林、特征重要性图等
    ]
};

/**
 * 统计建模包 (statsmodels)
 */
const statsmodelsPackage: AnalysisPackage = {
    id: 'statsmodels',
    name: 'packages.statsmodels.name',
    icon: '📈',
    pyodidePackages: ['statsmodels'],
    sizeEstimate: 'packages.statsmodels.sizeEstimate',
    isBuiltIn: false,
    order: 2,
    methods: [
        {
            promptId: 'worker-regression-v1',
            name: 'packages.statsmodels.methods.regression.name',
            description: 'packages.statsmodels.methods.regression.desc',
            outputCharts: ['packages.charts.coefficientPlot']
        }
        // 后续可扩展：时序预测 (Holt-Winters)、假设检验等
    ]
};

/**
 * 文本分析包 (NLP)
 * 中文分词、词云、文本频率分析
 * 暂时禁用：jieba 因 CORS 策略无法从 CDN 加载，需本地化部署后再启用
 */
/*
const nlpPackage: AnalysisPackage = {
    id: 'nlp',
    name: 'packages.nlp.name',
    icon: '📝',
    pyodidePackages: ['jieba'],
    sizeEstimate: 'packages.nlp.sizeEstimate',
    isBuiltIn: false,
    order: 3,
    methods: [
        {
            promptId: 'worker-wordcloud-v1',
            name: 'packages.nlp.methods.wordcloud.name',
            description: 'packages.nlp.methods.wordcloud.desc',
            outputCharts: ['packages.charts.wordcloud']
        },
        {
            promptId: 'worker-text-freq-v1',
            name: 'packages.nlp.methods.textFreq.name',
            description: 'packages.nlp.methods.textFreq.desc',
            outputCharts: ['packages.charts.wordFreqBar', 'packages.charts.wordFreqTable']
        }
    ]
};
*/

/**
 * 所有可用的分析能力包
 */
export const analysisPackages: AnalysisPackage[] = [
    basicPackage,
    sklearnPackage,
    statsmodelsPackage,
    // nlpPackage // 暂时禁用：jieba 因 CORS 策略无法从 CDN 加载，需本地化部署后再启用
];

/**
 * 根据 ID 获取能力包
 */
export const getPackageById = (id: string): AnalysisPackage | undefined => {
    return analysisPackages.find(pkg => pkg.id === id);
};

/**
 * 获取所有内置包 ID
 */
export const getBuiltInPackageIds = (): string[] => {
    return analysisPackages.filter(pkg => pkg.isBuiltIn).map(pkg => pkg.id);
};

/**
 * 获取可选包 (非内置)
 */
export const getOptionalPackages = (): AnalysisPackage[] => {
    return analysisPackages.filter(pkg => !pkg.isBuiltIn);
};

/**
 * 根据已启用的能力包 ID 列表，获取需要加载的 Pyodide 包名
 */
export const getPyodidePackagesToLoad = (enabledPackageIds: string[]): string[] => {
    const packages = new Set<string>();

    // 始终加载内置包
    analysisPackages
        .filter(pkg => pkg.isBuiltIn)
        .forEach(pkg => pkg.pyodidePackages.forEach(p => packages.add(p)));

    // 加载用户选择的包
    enabledPackageIds.forEach(id => {
        const pkg = getPackageById(id);
        if (pkg) {
            pkg.pyodidePackages.forEach(p => packages.add(p));
        }
    });

    return Array.from(packages);
};

/**
 * 检查某个 Prompt 是否可用 (对应的能力包已启用)
 */
export const isPromptAvailable = (promptId: string, enabledPackageIds: string[]): boolean => {
    for (const pkg of analysisPackages) {
        if (pkg.methods.some(m => m.promptId === promptId)) {
            // 如果是内置包，始终可用
            if (pkg.isBuiltIn) return true;
            // 否则检查是否已启用
            return enabledPackageIds.includes(pkg.id);
        }
    }
    // 未找到对应方法，默认可用 (可能是新增的未注册的 Prompt)
    return true;
};

/**
 * 获取 Prompt 所需的能力包信息 (用于提示用户启用)
 */
/**
 * 获取 Prompt 所需的能力包信息 (用于提示用户启用)
 */
export const getRequiredPackageForPrompt = (promptId: string): AnalysisPackage | null => {
    for (const pkg of analysisPackages) {
        if (pkg.methods.some(m => m.promptId === promptId)) {
            return pkg.isBuiltIn ? null : pkg;
        }
    }
    return null;
};

// --- 图表字体配置 ---

export interface ChartFont {
    id: string;
    name: string; // i18n key
    language: string;
    fontFile: string;
    fontUrl: string;   // CDN URL
    sizeEstimate: string;
}

/**
 * 可用的图表字体列表
 * 注意：name字段是i18n键，需要在组件中使用t()翻译
 */
export const chartFonts: ChartFont[] = [
    {
        id: 'simhei',
        name: 'packages.fonts.simhei',
        language: 'zh-CN',
        fontFile: 'SimHei.ttf',
        fontUrl: '/fonts/SimHei.ttf',
        sizeEstimate: '~10MB'
    },
    {
        id: 'msgothic',
        name: 'packages.fonts.msgothic',
        language: 'ja-JP',
        fontFile: 'msgothic.ttc',
        fontUrl: '/fonts/msgothic.ttc',
        sizeEstimate: '~8MB'
    },
    {
        id: 'malgun',
        name: 'packages.fonts.malgun',
        language: 'ko-KR',
        fontFile: 'malgun.ttf',
        fontUrl: '/fonts/malgun.ttf',
        sizeEstimate: '~6MB'
    }
];

// --- 持久化存储 ---

const PACKAGES_STORAGE_KEY = 'analysis_packages_enabled';
const FONT_STORAGE_KEY = 'chart_fonts_enabled';

/**
 * 根据语言代码获取默认字体 ID
 */
export const getDefaultFontByLanguage = (langCode: string): string[] => {
    if (langCode.startsWith('zh')) return ['simhei'];
    if (langCode.startsWith('ja')) return ['msgothic'];
    if (langCode.startsWith('ko')) return ['malgun'];
    return []; // 英文不需要额外字体
};

/**
 * 获取用户已启用的能力包 ID
 */
export const getEnabledPackages = (): string[] => {
    try {
        const stored = localStorage.getItem(PACKAGES_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // 解析失败，返回默认
    }
    // 默认只启用内置包
    return getBuiltInPackageIds();
};

/**
 * 保存用户启用的能力包 ID
 */
export const setEnabledPackages = (ids: string[]): void => {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(ids));
};

/**
 * 获取用户已启用的字体 ID
 * @param langCode - 当前语言代码，用于首次访问时的默认值
 * @returns {fonts: string[], isDefault: boolean}
 */
export const getEnabledFonts = (langCode?: string): { fonts: string[], isDefault: boolean } => {
    try {
        const stored = localStorage.getItem(FONT_STORAGE_KEY);
        if (stored) {
            return { fonts: JSON.parse(stored), isDefault: false };
        }
    } catch {
        // 解析失败，返回默认
    }
    // 根据语言设置默认字体
    const defaultFonts = langCode ? getDefaultFontByLanguage(langCode) : ['simhei'];
    return { fonts: defaultFonts, isDefault: true };
};

/**
 * 保存用户启用的字体 ID
 */
export const setEnabledFonts = (ids: string[]): void => {
    localStorage.setItem(FONT_STORAGE_KEY, JSON.stringify(ids));
};
