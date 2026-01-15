/**
 * Feature Flags 配置加载服务
 * 
 * 从后端API加载核心Feature Flags配置并缓存到localStorage
 * 
 * @author Antigravity Agent
 * @date 2026-01-08
 */

import { logger } from '@/utils/logger';
import type { FeatureFlags } from '@/config/featureFlags';

/**
 * 从静态 JSON 文件加载 Feature Flags 配置
 * 
 * @returns 远程配置对象，失败返回null
 */
export async function fetchRemoteConfig(): Promise<Partial<FeatureFlags> | null> {
    try {
        logger.log('系统', '开始加载远程 Feature Flags 配置');

        // 从静态 JSON 文件加载（Vite 开发服务器和生产环境都支持）
        const response = await fetch('/config/feature-flags.json', {
            method: 'GET',
            cache: 'no-cache', // 禁用浏览器缓存，确保获取最新配置
            signal: AbortSignal.timeout(3000), // 3秒超时
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const flags: Partial<FeatureFlags> = await response.json();

        // 验证响应格式
        if (typeof flags !== 'object' || flags === null) {
            throw new Error('配置文件格式错误：非对象');
        }

        logger.log('系统', '远程配置加载成功', {
            data: {
                flagsCount: Object.keys(flags).length,
                ENABLE_EDA_CONTEXT_LOOP: flags.ENABLE_EDA_CONTEXT_LOOP,
                ENABLE_UPLOAD_ROW_LIMIT: flags.ENABLE_UPLOAD_ROW_LIMIT,
            }
        });

        return flags;
    } catch (error: any) {
        logger.warn('系统', '远程配置加载失败，使用本地默认值', {
            error: error.message
        });
        return null;
    }
}

/**
 * 初始化配置系统
 * 
 * 在应用启动时调用，加载远程配置并缓存
 */
export async function initializeConfig(): Promise<void> {
    const remoteFlags = await fetchRemoteConfig();

    if (remoteFlags) {
        // 将远程配置保存到 localStorage（作为缓存）
        localStorage.setItem('feature_flags_remote', JSON.stringify(remoteFlags));
        localStorage.setItem('feature_flags_remote_timestamp', Date.now().toString());

        logger.log('系统', '配置初始化完成', {
            data: {
                flags: Object.keys(remoteFlags),
            }
        });

        // 🆕 上报当前所有 Feature Flags 状态（用于问题追踪）
        const { getFeatureFlags } = await import('@/config/featureFlags');
        logger.group('系统', 'Feature Flags 状态快照');

        const currentFlags = getFeatureFlags();
        const enabledFlags = Object.entries(currentFlags)
            .filter(([_, value]) => value === true)
            .map(([key]) => key);
        const disabledFlags = Object.entries(currentFlags)
            .filter(([_, value]) => value === false)
            .map(([key]) => key);

        logger.log('系统', `✅ 已启用 (${enabledFlags.length}/${Object.keys(currentFlags).length})`, {
            data: enabledFlags.length > 0 ? enabledFlags : ['无']
        });
        logger.log('系统', `❌ 已禁用 (${disabledFlags.length}/${Object.keys(currentFlags).length})`, {
            data: disabledFlags.length > 0 ? disabledFlags : ['无']
        });
        logger.groupEnd();
    } else {
        logger.warn('系统', '配置初始化失败，将使用本地默认配置');
    }
}
