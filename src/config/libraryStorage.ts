/**
 * Python库持久化存储模块
 * 管理用户启用的库列表和全局策略（localStorage）
 */

import { LibraryMissingStrategy } from '@/types/analysisPackage';
import { logger } from '@/utils/logger';

const LIBRARY_STORAGE_KEY = 'enabled_python_libraries'; // 扁平化
const STRATEGY_STORAGE_KEY = 'library_missing_strategy';

/**
 * 获取用户启用的库列表（扁平化）
 */
export function getEnabledLibraries(): string[] {
    try {
        const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        logger.warn('Python库配置', 'localStorage读取失败', error);
    }

    // 默认：仅必需库
    return ['pandas', 'numpy'];
}

/**
 * 保存用户启用的库列表
 */
export function setEnabledLibraries(libraries: string[]): void {
    try {
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(libraries));
        logger.log('Python库配置', '已保存库列表', {
            count: libraries.length,
            data: { libraries: libraries.join(', ') }
        });
    } catch (error) {
        logger.error('Python库配置', 'localStorage保存失败', error);
    }
}

/**
 * 检查某个库是否已启用
 */
export function isLibraryEnabled(libraryName: string): boolean {
    return getEnabledLibraries().includes(libraryName);
}

/**
 * 切换库的启用状态
 */
export function toggleLibrary(libraryName: string): void {
    const current = getEnabledLibraries();
    const updated = current.includes(libraryName)
        ? current.filter(name => name !== libraryName)
        : [...current, libraryName];

    setEnabledLibraries(updated);
}

/**
 * 获取全局策略
 */
export function getLibraryMissingStrategy(): LibraryMissingStrategy {
    try {
        const stored = localStorage.getItem(STRATEGY_STORAGE_KEY);
        if (stored) {
            return stored as LibraryMissingStrategy;
        }
    } catch (error) {
        logger.warn('Python库配置', '策略读取失败', error);
    }

    // 默认：自动加载
    return LibraryMissingStrategy.AUTO_LOAD;
}

/**
 * 保存全局策略
 */
export function setLibraryMissingStrategy(strategy: LibraryMissingStrategy): void {
    try {
        localStorage.setItem(STRATEGY_STORAGE_KEY, strategy);
        logger.log('Python库配置', '已保存全局策略', { data: { strategy } });
    } catch (error) {
        logger.error('Python库配置', '策略保存失败', error);
    }
}
