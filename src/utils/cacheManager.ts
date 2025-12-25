/**
 * 缓存管理工具类
 * 负责统一管理AI建议缓存的失效、新鲜度判断等逻辑
 */

import { ProjectFile } from './projectUtils';

export class CacheManager {
    /**
     * 最大缓存有效期（24小时）
     */
    static readonly MAX_CACHE_AGE = 24 * 60 * 60 * 1000;

    /**
     * 使洞察缓存失效
     * 用于：清洗应用后、数据变化后
     */
    static invalidateInsightCache(file: ProjectFile): void {
        if (!file.analysisCache) {
            file.analysisCache = {};
        }

        if (!file.analysisCache.insight) {
            file.analysisCache.insight = {
                hypotheses: [],
                status: 'pending',
                isStale: true
            };
        } else {
            file.analysisCache.insight.isStale = true;
            file.analysisCache.insight.status = 'pending';
        }

        // 同时清空Prompt缓存
        if (file.analysisCache.promptCache) {
            file.analysisCache.promptCache.insight = undefined;
            file.analysisCache.promptCache.insightTimestamp = undefined;
        }
    }

    /**
     * 使清洗缓存失效
     * 用于：数据变化后
     */
    static invalidateCleaningCache(file: ProjectFile): void {
        if (!file.analysisCache) {
            file.analysisCache = {};
        }

        if (!file.analysisCache.cleaning) {
            file.analysisCache.cleaning = {
                suggestions: [],
                status: 'pending',
                isStale: true
            };
        } else {
            file.analysisCache.cleaning.isStale = true;
            file.analysisCache.cleaning.status = 'pending';
        }

        // 同时清空Prompt缓存
        if (file.analysisCache.promptCache) {
            file.analysisCache.promptCache.cleaning = undefined;
            file.analysisCache.promptCache.cleaningTimestamp = undefined;
        }
    }

    /**
     * 检查缓存是否新鲜
     * @param timestamp 缓存时间戳
     * @param maxAge 最大有效期（毫秒），默认24小时
     * @returns true 如果缓存新鲜，false 如果过期
     */
    static isCacheFresh(timestamp: number | undefined, maxAge: number = CacheManager.MAX_CACHE_AGE): boolean {
        if (!timestamp) return false;
        return Date.now() - timestamp < maxAge;
    }

    /**
     * 更新清洗缓存时间戳
     */
    static updateCleaningTimestamp(file: ProjectFile): void {
        if (!file.analysisCache) {
            file.analysisCache = {};
        }
        if (!file.analysisCache.cleaning) {
            file.analysisCache.cleaning = {
                suggestions: [],
                status: 'pending'
            };
        }
        file.analysisCache.cleaning.timestamp = Date.now();
    }

    /**
     * 更新洞察缓存时间戳
     */
    static updateInsightTimestamp(file: ProjectFile): void {
        if (!file.analysisCache) {
            file.analysisCache = {};
        }
        if (!file.analysisCache.insight) {
            file.analysisCache.insight = {
                hypotheses: [],
                status: 'pending'
            };
        }
        file.analysisCache.insight.timestamp = Date.now();
    }
}
