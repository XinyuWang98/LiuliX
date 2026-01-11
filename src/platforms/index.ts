/**
 * 平台检测与切换
 * 自动识别运行环境（浏览器/Electron/Tauri）
 */

import type { PlatformAdapter, PlatformConfig, PlatformType } from './types';
import { BrowserAdapter } from './browser/index';
import { browserConfig } from './browser/config';

/**
 * 自动检测运行平台
 */
export function detectPlatform(): PlatformType {
    // 检测Electron
    // @ts-ignore
    if (typeof window !== 'undefined' && window.electron) {
        return 'electron';
    }

    // 检测Tauri
    // @ts-ignore
    if (typeof window !== 'undefined' && window.__TAURI__) {
        return 'tauri';
    }

    // 默认浏览器
    return 'browser';
}

/**
 * 平台适配器单例缓存
 */
let adapterInstance: PlatformAdapter | null = null;

/**
 * 获取当前平台适配器（单例）
 */
export function getPlatformAdapter(): PlatformAdapter {
    if (adapterInstance) {
        return adapterInstance;
    }

    const platform = detectPlatform();

    switch (platform) {
        case 'electron':
            // TODO: 实现Electron适配器
            throw new Error('Electron adapter not implemented yet');

        case 'tauri':
            // TODO: 实现Tauri适配器
            throw new Error('Tauri adapter not implemented yet');

        case 'browser':
        default:
            adapterInstance = new BrowserAdapter();
            return adapterInstance;
    }
}

/**
 * 获取当前平台配置
 */
export function getPlatformConfig(): PlatformConfig {
    const platform = detectPlatform();

    switch (platform) {
        case 'electron':
            // TODO: 导入Electron配置
            throw new Error('Electron config not implemented yet');

        case 'tauri':
            // TODO: 导入Tauri配置
            throw new Error('Tauri config not implemented yet');

        case 'browser':
        default:
            return browserConfig;
    }
}
