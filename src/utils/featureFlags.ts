/**
 * 功能特性开关配置
 * 用于控制实验性功能的渐进式发布
 */

import { logger } from '@/utils/logger';

/** 功能特性枚举 */
export const FeatureFlags = {
    /** 多层级導航功能（智能折叠导航） */
    MULTI_LEVEL_NAV: import.meta.env.VITE_FEATURE_MULTI_LEVEL_NAV === 'true' || import.meta.env.DEV, // 开发环境默认启用
    // 🗑️ CUSTOM_DRILL_DOWN_TRIGGER 已于 2026-01-08 清理（从未启用）
} as const;

/** 功能特性类型 */
export type FeatureFlagKey = keyof typeof FeatureFlags;

/**
 * 检查功能特性是否启用
 * @param flag 功能特性key
 * @returns 是否启用
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
    return FeatureFlags[flag];
}

/**
 * 在控制台输出功能特性状态（仅开发环境）
 */
export function logFeatureFlags(): void {
    if (import.meta.env.DEV) {
        if (import.meta.env.DEV) {
            logger.group('系统', '🚩 Feature Flags');
            Object.entries(FeatureFlags).forEach(([key, enabled]) => {
                logger.log('系统', `${enabled ? '✅' : '❌'} ${key}: ${enabled}`);
            });
            logger.groupEnd();
        }
    }
}
