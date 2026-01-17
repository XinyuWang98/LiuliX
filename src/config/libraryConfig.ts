/**
 * Python库配置模块
 * 从所有Prompt自动汇总所需的Python库列表（扁平化，取代能力包）
 */

import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import type { PyodideLibraryConfig } from '@/types/analysisPackage';

/**
 * 库大小配置（可选，提供更好的用户体验）
 */
const LIBRARY_SIZE_MAP: Record<string, { size: string; loadTime: string }> = {
    pandas: { size: '~2MB', loadTime: '~1s' },
    numpy: { size: '~1MB', loadTime: '~0.5s' },
    matplotlib: { size: '~1.5MB', loadTime: '~1.5s' },
    seaborn: { size: '~2MB', loadTime: '~2s' },
    scipy: { size: '~3MB', loadTime: '~2.5s' },
    'scikit-learn': { size: '~15MB', loadTime: '~5s' },
    statsmodels: { size: '~8MB', loadTime: '~3s' }
};

/**
 * 从所有Prompt自动汇总库列表
 */
export function generateLibraryConfigs(): PyodideLibraryConfig[] {
    const allPrompts = promptRegistry.listPrompts();
    const libraryMap = new Map<string, Set<string>>(); // libName -> Set<promptId>

    // 调试日志
    logger.debug('Python库配置', '总Prompt数:', { count: allPrompts.length });
    logger.debug('Python库配置', '前3个Prompt:', {
        prompts: allPrompts.slice(0, 3).map(p => ({
            id: p.id,
            title: p.title,
            requiredPackages: p.requiredPackages
        }))
    });

    // 汇总所有Prompt的requiredPackages
    for (const prompt of allPrompts) {
        const packages = prompt.requiredPackages || [];
        for (const pkgName of packages) {
            if (!libraryMap.has(pkgName)) {
                libraryMap.set(pkgName, new Set());
            }
            libraryMap.get(pkgName)!.add(prompt.id);
        }
    }

    // 生成库配置列表
    const configs: PyodideLibraryConfig[] = [];

    for (const [libName, promptIds] of libraryMap.entries()) {
        const isRequired = ['pandas', 'numpy'].includes(libName);
        const sizeInfo = LIBRARY_SIZE_MAP[libName];

        configs.push({
            name: libName,
            displayName: `packages.libraries.${libName}`, // i18n key
            isRequired,
            enabledByDefault: isRequired, // 必需库默认启用
            sizeEstimate: sizeInfo?.size,
            loadTime: sizeInfo?.loadTime,
            usedByPrompts: Array.from(promptIds)
        });
    }

    // 排序：必需库在前，然后按字母排序
    const sorted = configs.sort((a, b) => {
        if (a.isRequired !== b.isRequired) {
            return a.isRequired ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    // 调试日志
    logger.debug('Python库配置', '生成的库配置数:', { count: sorted.length });
    logger.debug('Python库配置', '库列表:', { names: sorted.map(c => c.name) });

    return sorted;
}

/**
 * 获取库配置列表（动态生成）
 * 改为函数以解决初始化时序问题：确保在 PromptRegistry 完成数据填充后才生成配置
 */
export function getLibraryConfigs(): PyodideLibraryConfig[] {
    return generateLibraryConfigs();
}
