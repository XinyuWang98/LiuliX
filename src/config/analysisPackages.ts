/**
 * 分析能力包配置（v2.1 自动派生版本）
 * 
 * 变更说明：
 * - ❌ 移除所有硬编码的 promptId
 * - ✅ 从 PromptRegistry 自动派生能力包配置
 * - ✅ 保持导出API完全兼容
 * 
 * 核心原理：
 * 1. Prompt模板包含 `packageId` 和 `requiredPackages` 字段
 * 2. 本文件从注册表读取所有Prompt，按 packageId 分组
 * 3. 自动汇总每个包的 `requiredPackages`
 * 4. 生成 `AnalysisPackage[]` 数组
 */

import { promptRegistry } from '@/services/promptRegistry';
import type { AnalysisPackage } from '@/types/analysisPackage';

// ========== 包元数据配置 ==========
// 这是唯一需要手动维护的部分（UI展示信息）

interface PackageMetadata {
    name: string;      // i18n key
    icon: string;
    isBuiltIn: boolean;
    order: number;
    sizeEstimate: string;
}

const PACKAGE_METADATA: Record<string, PackageMetadata> = {
    basic: {
        name: 'packages.basic.name',
        icon: '📊',
        isBuiltIn: true,
        order: 0,
        sizeEstimate: '~5MB'
    },
    sklearn: {
        name: 'packages.sklearn.name',
        icon: '🧠',
        isBuiltIn: false,
        order: 1,
        sizeEstimate: '~15MB'
    },
    statsmodels: {
        name: 'packages.statsmodels.name',
        icon: '📈',
        isBuiltIn: false,
        order: 2,
        sizeEstimate: '~8MB'
    },
    nlp: {
        name: 'packages.nlp.name',
        icon: '📝',
        isBuiltIn: false,
        order: 3,
        sizeEstimate: '~12MB'
    }
};

// ========== 自动生成能力包配置 ==========

/**
 * 从 Prompt Registry 自动生成能力包配置
 */
export function generateAnalysisPackages(): AnalysisPackage[] {
    // 获取所有 L2 执行层 Prompt（不包括清洗类）
    const allPrompts = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' })
        .filter(p => !p.id.startsWith('cleaner-'));  // 排除清洗Prompt

    // 按 packageId 分组
    const packageMap = new Map<string, typeof allPrompts>();

    for (const prompt of allPrompts) {
        const pkgId = prompt.packageId || 'basic';  // 默认归入basic

        if (!packageMap.has(pkgId)) {
            packageMap.set(pkgId, []);
        }
        packageMap.get(pkgId)!.push(prompt);
    }

    // 生成能力包配置数组
    const packages: AnalysisPackage[] = [];

    for (const [pkgId, prompts] of packageMap.entries()) {
        const metadata = PACKAGE_METADATA[pkgId];

        if (!metadata) {
            console.warn(`[AnalysisPackages] 未知的 packageId: ${pkgId}，跳过`);
            continue;
        }

        // 汇总所有需要的 Python 包（自动去重）
        const pyodidePackagesSet = new Set<string>();
        for (const prompt of prompts) {
            if (prompt.requiredPackages) {
                prompt.requiredPackages.forEach(pkg => pyodidePackagesSet.add(pkg));
            }
        }
        const pyodidePackages = Array.from(pyodidePackagesSet).sort();

        // 构建能力包对象
        packages.push({
            id: pkgId,
            name: metadata.name,
            icon: metadata.icon,
            pyodidePackages,
            sizeEstimate: metadata.sizeEstimate,
            isBuiltIn: metadata.isBuiltIn,
            order: metadata.order,
            methods: prompts.map(p => ({
                promptId: p.id,
                name: `packages.${pkgId}.methods.${p.name}.name`,
                description: p.description,
                outputCharts: p.outputCharts || ['chart']
            }))
        });
    }

    // 按 order 排序
    return packages.sort((a, b) => a.order - b.order);
}

/**
 * 导出的能力包配置（惰性生成）
 */
export const analysisPackages: AnalysisPackage[] = generateAnalysisPackages();

// ========== 导出函数（保持API兼容） ==========

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
export const getRequiredPackageForPrompt = (promptId: string): AnalysisPackage | null => {
    for (const pkg of analysisPackages) {
        if (pkg.methods.some(m => m.promptId === promptId)) {
            return pkg.isBuiltIn ? null : pkg;
        }
    }
    return null;
};

// ========== 图表字体配置 ==========

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

// ========== 持久化存储 ==========

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
