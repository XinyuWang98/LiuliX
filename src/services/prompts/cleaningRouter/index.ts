/**
 * Cleaning Router Prompt - 语言路由加载器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import * as promptEn from './cleaningRouterPrompt.en';
import * as promptZh from './cleaningRouterPrompt.zh';

// 预加载所有语言版本模块
const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

/**
 * 构建清洗 Router Prompt
 * 自动根据当前语言选择对应版本
 */
export function buildCleaningRouterPrompt(columns: any[], stats: any[]): string {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    return module.buildCleaningRouterPromptInternal(columns, stats);
}
