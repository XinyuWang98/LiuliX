/**
 * Hypothesis Generator - 语言路由加载器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import * as promptEn from './hypothesis.en';
import * as promptZh from './hypothesis.zh';

// 预加载所有语言版本模块
const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

/**
 * 生成假设Prompt（自动根据当前语言选择对应版本）
 */
export function 生成假设Prompt(
    数据摘要: {
        description?: string;
        stats?: string;
        columns?: string[];
        rowCount?: number;
        sampleData?: any[];
    }
): string {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    return module.生成假设PromptInternal(数据摘要);
}

/**
 * 解析假设结果（语言无关）
 */
export function 解析假设结果(AI返回结果: string): {
    assumption: string;
    verification: string;
}[] {
    // 解析逻辑语言无关，使用中文版本即可
    return promptZh.解析假设结果(AI返回结果);
}
