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
import { validateColumnNames } from './columnValidator'; // 🆕 Task 2.2
import { getPromptNameById } from '@/services/promptIdMap'; // 🆕 导入映射工具
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
 * 解析AI响应JSON
 * 
 * @param aiResponse AI返回的JSON字符串
 * @param availableColumns 可用列名列表（用于校验params中的列名）
 * @returns 推荐列表
 * 
 * @example
 * const recs = parseRouterResponse(aiResponse, ['age', 'income']);
 * // [
 * //   {
 * //     promptId: 'worker-distribution-v1',
 * //     params: { column_name: 'age' },
 * //     reason: '年龄分布',
 * //     drillHint: { promptId: '...', params: {...}, label: '...' }
 * //   }
 * // ]
 */
export function parseRouterResponse(
    aiResponse: string,
    availableColumns?: string[]
): {
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
        logger.log('AI服务', `🔍 [parseRouterResponse] 开始解析`, {
            data: { responseLength: aiResponse.length, timestamp: Date.now() }
        });

        // 提取 JSON 部分
        let jsonStr = aiResponse;

        // 移除 markdown 代码块
        const regexStart = performance.now();
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        const regexDuration = (performance.now() - regexStart) / 1000;
        logger.log('AI服务', `✅ [正则匹配] 耗时: ${regexDuration.toFixed(3)}s`);

        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        const jsonParseStart = performance.now();
        const parsed = JSON.parse(jsonStr);
        const jsonParseDuration = (performance.now() - jsonParseStart) / 1000;
        logger.log('AI服务', `✅ [JSON.parse] 耗时: ${jsonParseDuration.toFixed(3)}s`);

        const recommendations = parsed.recommendations || parsed;

        // 🔍 临时调试:记录AI原始响应
        logger.log('AI服务', '[RouterPrompt] AI原始响应JSON', {
            data: {
                response: jsonStr.substring(0, 1000),
                parsed: JSON.stringify(parsed).substring(0, 500)
            }
        });

        if (!Array.isArray(recommendations)) {
            logger.warn('AI服务', '[RouterPrompt] 响应不是数组格式');
            return [];
        }

        // 验证每个推荐
        const validRecs = recommendations.filter(rec => {
            // 🆕 支持数字 ID 转换为字符串 ID
            if (typeof rec.promptId === 'number') {
                const stringId = getPromptNameById(rec.promptId);
                if (!stringId) {
                    logger.warn('AI服务', `[RouterPrompt] 无效的数字ID: ${rec.promptId}`);
                    return false;
                }
                rec.promptId = stringId;  // 转换为字符串 ID
            }

            // 🆕 drillHint 也需要转换
            if (rec.drillHint?.promptId && typeof rec.drillHint.promptId === 'number') {
                const stringId = getPromptNameById(rec.drillHint.promptId);
                if (stringId) {
                    rec.drillHint.promptId = stringId;
                } else {
                    logger.warn('AI服务', `[RouterPrompt] drillHint 无效的数字ID: ${rec.drillHint.promptId}`);
                    delete rec.drillHint;  // 删除无效的 drillHint
                }
            }

            if (!rec.promptId || !rec.params) {
                logger.warn('AI服务', '[RouterPrompt] 推荐缺少必要字段');
                return false;
            }

            // 验证 promptId 存在
            if (!promptRegistry.hasPrompt(rec.promptId)) {
                logger.warn('AI服务', `[RouterPrompt] 无效的 promptId: ${rec.promptId}`);
                return false;
            }

            // 🆕 验证列名合法性(Task 2.2)
            if (availableColumns && availableColumns.length > 0) {
                const invalidColumns = validateColumnNames(rec.params, availableColumns);
                if (invalidColumns.length > 0) {
                    logger.warn('AI服务', `[RouterPrompt] 过滤非法列名推荐`, {
                        data: {
                            promptId: rec.promptId,
                            invalidColumns,
                            params: rec.params
                        }
                    });
                    return false;
                }
            }

            // 🔍 验证日志：检查 drillHint
            if (rec.drillHint) {
                logger.log('AI服务', `[RouterPrompt] ✅ 检测到 drillHint`, {
                    data: {
                        promptId: rec.promptId,
                        drillPromptId: rec.drillHint.promptId,
                        drillLabel: rec.drillHint.label,
                        drillParams: rec.drillHint.params  // 🐛 调试：输出完整 params
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

