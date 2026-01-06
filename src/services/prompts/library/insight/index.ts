/**
 * Batch Insight Generator - 语言路由加载器
 * 
 * 根据当前语言设置，动态加载对应语言版本的批量洞察生成器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import * as insightEn from './batch_insight_generator.en';
import * as insightZh from './batch_insight_generator.zh';

// 导出解析器模块（语言无关）
export { parseBatchInsightsResponse, type InsightSuggestion } from './parser';

// 预加载所有语言版本模块
const promptModules = {
    'en-US': insightEn,
    'zh-CN': insightZh
} as const;

/**
 * 生成批量洞察Prompt
 * 自动根据当前语言选择对应版本
 * 
 * @param columns - 列名数组
 * @param rowCount - 采样行数
 * @param totalRows - 总行数
 * @param sampleData - 采样数据
 * @param t - 不再使用（保留参数以兼容现有调用）
 */
export function generateBatchInsightsPrompt(
    columns: string[],
    rowCount: number,
    totalRows: number,
    sampleData: any[]
): string {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    return module.generateBatchInsightsPromptInternal(columns, rowCount, totalRows, sampleData);
}
