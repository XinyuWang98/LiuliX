/**
 * Python库依赖检查工具
 * 根据用户配置和全局策略检查库依赖、过滤Prompt
 */

import { getEnabledLibraries, getLibraryMissingStrategy } from '@/config/libraryStorage';
import { LibraryMissingStrategy } from '@/types/analysisPackage';
import { logger } from './logger';

/**
 * 检查库依赖并返回缺失的库列表
 * @param requiredPackages - Prompt需要的库列表
 * @returns 缺失的库列表
 */
export function getMissingLibraries(requiredPackages: string[]): string[] {
    const enabled = getEnabledLibraries();
    return requiredPackages.filter(pkg => !enabled.includes(pkg));
}

/**
 * 检查是否允许执行（根据策略）
 * @param requiredPackages - Prompt需要的库列表
 * @returns 检查结果
 */
export function canExecuteWithLibraries(requiredPackages: string[]): {
    canExecute: boolean;
    missingLibraries: string[];
    strategy: LibraryMissingStrategy;
} {
    const strategy = getLibraryMissingStrategy();
    const missing = getMissingLibraries(requiredPackages);

    if (missing.length === 0) {
        return { canExecute: true, missingLibraries: [], strategy };
    }

    // AUTO_LOAD: 总是允许（会自动安装）
    // FILTER_SUGGESTIONS: 不允许（需要过滤）
    const canExecute = strategy === LibraryMissingStrategy.AUTO_LOAD;

    return { canExecute, missingLibraries: missing, strategy };
}

/**
 * 根据策略过滤Prompt列表
 * @param prompts - 候选Prompt列表
 * @returns 过滤后的Prompt列表
 */
export function filterPromptsByLibraryPolicy<T extends { requiredPackages?: string[] }>(
    prompts: T[]
): T[] {
    const strategy = getLibraryMissingStrategy();

    if (strategy === LibraryMissingStrategy.AUTO_LOAD) {
        return prompts; // 不过滤
    }

    const enabled = getEnabledLibraries();
    const filtered = prompts.filter(p => {
        const required = p.requiredPackages || [];
        // 只保留所有依赖都已启用的Prompt
        return required.every(pkg => enabled.includes(pkg));
    });

    const removedCount = prompts.length - filtered.length;
    if (removedCount > 0) {
        logger.log('Python库配置', `已过滤${removedCount}个Prompt（库未启用）`, {
            data: { 
                total: prompts.length,
                filtered: filtered.length,
                removed: removedCount
            }
        });
    }

    return filtered;
}
