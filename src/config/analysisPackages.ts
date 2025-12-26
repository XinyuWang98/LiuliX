/**
 * 分析能力包配置清单
 * 定义所有可用的分析能力包及其包含的方法
 */

import { AnalysisPackage } from '../types/analysisPackage';

/**
 * 基础分析包 (内置，始终加载)
 */
const basicPackage: AnalysisPackage = {
    id: 'basic',
    name: '基础分析',
    icon: '📊',
    pyodidePackages: ['pandas', 'numpy', 'matplotlib'],
    sizeEstimate: '~8MB',
    isBuiltIn: true,
    order: 0,
    methods: [
        {
            promptId: 'worker-distribution-v1',
            name: '分布分析',
            description: '查看单一变量的数据分布情况',
            outputCharts: ['直方图', '柱状图']
        },
        {
            promptId: 'worker-correlation-v1',
            name: '相关性分析',
            description: '分析两个变量之间的关系',
            outputCharts: ['散点图', '箱线图', '热力图']
        },
        {
            promptId: 'worker-trend-v1',
            name: '趋势分析',
            description: '分析数值随时间的变化趋势',
            outputCharts: ['折线图', '移动平均线']
        },
        {
            promptId: 'worker-stats-v1',
            name: '描述性统计',
            description: '计算均值、中位数、标准差等统计指标',
            outputCharts: ['统计摘要条形图']
        },
        {
            promptId: 'worker-groupby-v1',
            name: '分组聚合',
            description: '按分类变量分组计算聚合指标',
            outputCharts: ['分组柱状图']
        },
        {
            promptId: 'worker-topn-v1',
            name: 'Top N 排行',
            description: '找出频次最高的 Top N 项',
            outputCharts: ['排行柱状图']
        },
        {
            promptId: 'worker-missing-v1',
            name: '缺失值分析',
            description: '可视化缺失值分布模式',
            outputCharts: ['缺失值矩阵图']
        },
        {
            promptId: 'worker-outlier-v1',
            name: '异常值检测',
            description: '识别数据中的异常离群点',
            outputCharts: ['箱线图', '散点标注图']
        },
        {
            promptId: 'worker-crosstab-v1',
            name: '交叉表分析',
            description: '分析两个分类变量的交叉分布',
            outputCharts: ['热力图', '堆叠柱状图']
        }
    ]
};

/**
 * 机器学习包 (scikit-learn)
 */
const sklearnPackage: AnalysisPackage = {
    id: 'sklearn',
    name: '机器学习',
    icon: '🧠',
    pyodidePackages: ['scikit-learn'],
    sizeEstimate: '~12MB',
    isBuiltIn: false,
    order: 1,
    methods: [
        {
            promptId: 'worker-cluster-v1',
            name: 'K-Means 聚类',
            description: '发现数据中的潜在群体',
            outputCharts: ['PCA 降维散点图', '群体分布图']
        },
        {
            promptId: 'worker-decision-tree-v1',
            name: '决策树分析',
            description: '挖掘影响目标变量的关键规则',
            outputCharts: ['决策树可视化图']
        }
        // 后续可扩展：随机森林、特征重要性图等
    ]
};

/**
 * 统计建模包 (statsmodels)
 */
const statsmodelsPackage: AnalysisPackage = {
    id: 'statsmodels',
    name: '统计建模',
    icon: '📈',
    pyodidePackages: ['statsmodels'],
    sizeEstimate: '~8MB',
    isBuiltIn: false,
    order: 2,
    methods: [
        {
            promptId: 'worker-regression-v1',
            name: 'OLS 回归分析',
            description: '量化各因素对目标变量的独立影响',
            outputCharts: ['系数森林图 (Coefficient Plot)']
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
    name: '文本分析',
    icon: '📝',
    pyodidePackages: ['jieba'],
    sizeEstimate: '~18MB',
    isBuiltIn: false,
    order: 3,
    methods: [
        {
            promptId: 'worker-wordcloud-v1',
            name: '中文词云',
            description: '从文本数据生成词云可视化',
            outputCharts: ['词云图']
        },
        {
            promptId: 'worker-text-freq-v1',
            name: '词频统计',
            description: '统计文本中的高频词汇',
            outputCharts: ['词频柱状图', '词频表格']
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
    name: string;
    language: string;
    fontFile: string;
    fontUrl: string;   // CDN URL
    sizeEstimate: string;
}

/**
 * 可用的图表字体列表
 */
export const chartFonts: ChartFont[] = [
    {
        id: 'simhei',
        name: '中文 (SimHei)',
        language: 'zh-CN',
        fontFile: 'SimHei.ttf',
        fontUrl: '/fonts/SimHei.ttf',
        sizeEstimate: '~10MB'
    },
    {
        id: 'msgothic',
        name: '日文 (MS Gothic)',
        language: 'ja-JP',
        fontFile: 'msgothic.ttc',
        fontUrl: '/fonts/msgothic.ttc',
        sizeEstimate: '~8MB'
    },
    {
        id: 'malgun',
        name: '韩文 (Malgun Gothic)',
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
