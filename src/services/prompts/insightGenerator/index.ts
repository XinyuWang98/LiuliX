/**
 * Insight Generator - 语言路由加载器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import { CodeLanguage } from '@/types/insightChain';
import type { 洞察结果 } from './insightGenerator.zh';
import * as promptEn from './insightGenerator.en';
import * as promptZh from './insightGenerator.zh';

// 预加载所有语言版本模块
const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

/**
 * 生成洞察Prompt（自动根据当前语言选择对应版本）
 */
export function 生成洞察Prompt(
    假设描述: string,
    数据字段列表: string[],
    用户指令: string,
    代码语言: CodeLanguage = 'python'
): string {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    return module.生成洞察PromptInternal(假设描述, 数据字段列表, 用户指令, 代码语言);
}

/**
 * 解析洞察结果（语言无关）
 */
export function 解析洞察结果(AI返回结果: string): 洞察结果 | null {
    // 解析逻辑语言无关，使用中文版本即可
    return promptZh.解析洞察结果(AI返回结果);
}

// 导出类型定义
export type { 洞察结果 } from './insightGenerator.zh';
