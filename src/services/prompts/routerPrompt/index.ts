/**
 * Router Prompt - 语言路由加载器
 * 
 * 根据当前语言设置，动态加载对应语言版本的 Prompt 构建器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import { injectContextToPrompt } from '@/services/prompts/contextInjector'; // 🆕
import { AdoptedInsight } from '@/contexts/AnalysisContext'; // 🆕
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
 * 
 * @param columns 列名列表
 * @param sampleData 采样数据
 * @param columnTypes 列类型映射
 * @param analysisContext 🆕 已采纳的洞察 (用于 Context 回流)
 */
export function buildRouterPrompt(
    columns: string[],
    sampleData: Record<string, unknown>[],
    columnTypes?: Record<string, string>,
    analysisContext?: AdoptedInsight[]  // 🆕 新增参数
): string {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    let prompt = module.buildRouterPromptInternal(columns, sampleData, columnTypes);

    // 🆕 注入历史 Context
    if (analysisContext && analysisContext.length > 0) {
        prompt = injectContextToPrompt(prompt, analysisContext);
        logger.log('AI服务', '[RouterPrompt] Context 注入完成', {
            data: { insightCount: analysisContext.length }
        });
    }

    return prompt;
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

/**
 * 解析 L1 响应（语言无关的解析逻辑）
 */
export function parseRouterResponse(aiResponse: string): {
    promptId: string;
    params: Record<string, unknown>;
    reason: string;
    drillHint?: {
        promptId: string;
        params: Record<string, unknown>;
        label: string;
    };
}[] {
    try {
        // 提取 JSON 部分
        let jsonStr = aiResponse;

        // 移除 markdown 代码块
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        const parsed = JSON.parse(jsonStr);
        const recommendations = parsed.recommendations || parsed;

        if (!Array.isArray(recommendations)) {
            logger.warn('AI服务', '[RouterPrompt] 响应不是数组格式');
            return [];
        }

        // 验证每个推荐
        const validRecs = recommendations.filter(rec => {
            if (!rec.promptId || !rec.params) {
                logger.warn('AI服务', `[RouterPrompt] 推荐缺少必填字段`);
                return false;
            }

            // 验证 promptId 存在
            if (!promptRegistry.hasPrompt(rec.promptId)) {
                logger.warn('AI服务', `[RouterPrompt] 无效的 promptId: ${rec.promptId}`);
                return false;
            }

            // 🔍 验证日志：检查 drillHint
            if (rec.drillHint) {
                logger.log('AI服务', `[RouterPrompt] ✅ 检测到 drillHint`, {
                    data: {
                        promptId: rec.promptId,
                        drillPromptId: rec.drillHint.promptId,
                        drillLabel: rec.drillHint.label
                    }
                });
            } else {
                logger.log('AI服务', `[RouterPrompt] ⚠️ 无 drillHint`, {
                    data: { promptId: rec.promptId }
                });
            }

            return true;
        });

        // 🔍 总结日志
        const withDrill = validRecs.filter(r => r.drillHint).length;
        logger.log('AI服务', `[RouterPrompt] 解析完成: ${validRecs.length} 个推荐, ${withDrill} 个含下钻`);

        return validRecs;
    } catch (error) {
        logger.error('AI服务', `[RouterPrompt] 解析响应失败: ${error}`);
        // 🔍 错误时输出原始响应
        logger.log('AI服务', '[RouterPrompt] AI 原始响应（前500字符）', {
            data: { response: aiResponse.substring(0, 500) }
        });
        return [];
    }
}

