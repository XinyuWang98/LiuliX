/**
 * Trend Analysis - 语言路由加载器
 * 
 * 根据当前语言设置，动态加载对应语言版本的趋势分析生成器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import * as trendEn from './trend_analysis.en';
import * as trendZh from './trend_analysis.zh';

// 预加载所有语言版本模块
const promptModules = {
    'en-US': trendEn,
    'zh-CN': trendZh
} as const;

/**
 * 生成趋势Prompt
 * 自动根据当前语言选择对应版本
 */
export function 生成趋势Prompt(时间序列数据: { date: string; count: number }[]): string {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    return module.generateTrendPromptInternal(时间序列数据);
}

/**
 * 解析趋势结果
 * 自动根据当前语言选择对应版本
 */
export function 解析趋势结果(AI返回结果: string): string {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    return module.parseTrendResultInternal(AI返回结果);
}
