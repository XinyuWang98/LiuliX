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

interface ConfigResponse {
    success: boolean;
    data: {
        featureFlags: Partial<FeatureFlags>; // 后端只返回3个核心Flag
        timestamp: number;
        version: string;
    };
}

/**
 * 从后端加载核心Feature Flags配置
 * 
 * @returns 远程配置对象，失败返回null
 */
export async function fetchRemoteConfig(): Promise<Partial<FeatureFlags> | null> {
    try {
        // 后端API地址（支持环境变量配置）
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

        const response = await fetch(`${API_URL}/api/config`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(3000), // 3秒超时
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data: ConfigResponse = await response.json();

        logger.log('系统', '远程配置加载成功', {
            data: {
                version: data.data.version,
                flagsCount: Object.keys(data.data.featureFlags).length,
            }
        });

        return data.data.featureFlags;
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
    } else {
        logger.warn('系统', '配置初始化失败，将使用本地默认配置');
    }
}
