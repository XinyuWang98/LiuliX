/**
 * Report Generator - 语言路由加载器
 * 
 * 根据当前语言设置，动态加载对应语言版本的报告生成器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import * as reportEn from './report_generator.en';
import * as reportZh from './report_generator.zh';

// 报告数据接口定义（语言无关）
export interface 报告数据 {
    异常清单: Array<{
        序号: number;
        异常描述: string;
        严重程度: '高' | '中' | '低';
        影响范围: string;
    }>;
    优化建议: Array<{
        序号: number;
        建议标题: string;
        建议内容: string;
        优先级: '高' | '中' | '低';
    }>;
}

// 预加载所有语言版本模块
const promptModules = {
    'en-US': reportEn,
    'zh-CN': reportZh
} as const;

/**
 * 生成报告Prompt
 * 自动根据当前语言选择对应版本
 */
export function 生成报告Prompt(分析结果: any): string {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    return module.generateReportPromptInternal(分析结果);
}

/**
 * 解析 AI 返回的报告结果
 * @param AI返回结果 - Gemini API 返回的原始文本
 * @returns 结构化的报告数据，解析失败返回 null
 */
export function 解析报告结果(AI返回结果: string): 报告数据 | null {
    try {
        const trimmed = AI返回结果.trim();

        // 尝试直接解析
        let jsonStr = trimmed;

        // 如果带了代码块标记，去掉
        if (trimmed.startsWith('```json')) {
            jsonStr = trimmed.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        } else if (trimmed.startsWith('```')) {
            jsonStr = trimmed.replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonStr);

        // 基本校验
        if (
            parsed &&
            Array.isArray(parsed.异常清单) &&
            Array.isArray(parsed.优化建议) &&
            parsed.异常清单.length > 0
        ) {
            return parsed as 报告数据;
        }

        return null;
    } catch (e) {
        console.warn('报告解析失败', e);
        return null;
    }
}
