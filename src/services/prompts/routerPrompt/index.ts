/**
 * Router Prompt - 语言路由加载器
 * 
 * 根据当前语言设置，动态加载对应语言版本的 Prompt 构建器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import * as promptEn from './routerPrompt.en';
import * as promptZh from './routerPrompt.zh';

// 预加载所有语言版本模块
const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

/**
 * 构建 Router Prompt
 * 自动根据当前语言选择对应版本
 */
export function buildRouterPrompt(
    columns: string[],
    sampleData: Record<string, unknown>[],
    columnTypes?: Record<string, string>
): string {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    return module.buildRouterPromptInternal(columns, sampleData, columnTypes);
}

/**
 * 构建规则层兜底推荐
 * 自动根据当前语言选择对应版本
 */
export function buildFallbackRecommendations(
    columns: string[],
    columnTypes?: Record<string, string>
): {
    promptId: string;
    params: Record<string, unknown>;
    reason: string;
}[] {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    return module.buildFallbackRecommendationsInternal(columns, columnTypes);
}

// 导出解析函数（语言无关）
export { parseRouterResponse } from '../routerPrompt';
