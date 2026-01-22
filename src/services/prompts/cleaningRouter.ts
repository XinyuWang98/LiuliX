/**
 * 清洗Router
 * 实现AI选择清洗模板 → SQL模板填充的工作流程
 */

import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import type { CleaningSuggestion } from '@/services/aiService';
import { buildCleaningRouterPrompt } from './cleaningRouter/index';  // 🆕 导入语言路由函数

/**
 * Router响应接口
 */
interface RouterRecommendation {
    promptId: string;
    params: Record<string, unknown>;
    reason: string;
}

/**
 * 清洗Router类
 * 
 * 工作流程：
 * 1. 构建Router Prompt（附清洗模板清单）
 * 2. AI选择模板并填充参数
 * 3. SQL Inflater填充模板
 * 4. 返回CleaningSuggestion[]
 */
export class CleaningRouter {
    /**
     * 主入口：生成清洗建议
     */
    async generate(
        tableName: string,
        columns: any[],
        stats: any[],
        aiService: (prompt: string) => Promise<string>
    ): Promise<CleaningSuggestion[]> {

        logger.group('AI清洗', 'Router模式流程');

        try {
            // Step 1: 构建Router Prompt
            const prompt = this.buildRouterPrompt(columns, stats);
            // 🐛 DEBUG: 打印构建的Prompt
            logger.log('AI清洗', 'Router Prompt构建详情', {
                data: {
                    promptLength: prompt.length
                }
            });
            logger.log('AI清洗', 'Router Prompt构建完成', {
                data: `${prompt.length}字符`
            });

            // Step 2: 调用AI
            const aiResponse = await aiService(prompt);
            logger.log('AI清洗', 'AI响应收到', {
                data: `${aiResponse.length}字符`
            });

            // Step 3: 解析AI响应
            const recommendations = this.parseRouterResponse(aiResponse);
            logger.log('AI清洗', 'Router解析完成', {
                count: recommendations.length
            });

            // Step 3.5: 🆕 注入精确统计参数（v2.3）
            const { injectStatsParams } = await import('./paramInjector');
            const injectedRecommendations = injectStatsParams(recommendations, stats);

            // Step 4: SQL Inflater填充模板
            const suggestions = this.inflateSQLTemplates(
                injectedRecommendations,  // 使用注入后的推荐
                tableName,
                stats
            );

            logger.groupEnd();
            return suggestions;

        } catch (error) {
            logger.groupEnd();
            logger.error('AI清洗', `Router失败: ${error}`);
            return [];
        }
    }

    /**
     * 构建Router Prompt（使用语言路由）
     * 
     * @param columns 列信息
     * @param stats 统计信息
     */
    private buildRouterPrompt(columns: any[], stats: any[]): string {
        // 🆕 使用语言路由函数，自动根据当前语言选择对应版本
        return buildCleaningRouterPrompt(columns, stats);
    }

    /**
     * 解析AI Router响应
     */
    private parseRouterResponse(aiResponse: string): RouterRecommendation[] {
        try {
            // 提取JSON部分
            let jsonStr = aiResponse;
            const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            const parsed = JSON.parse(jsonStr);
            const recommendations = parsed.recommendations || parsed;

            if (!Array.isArray(recommendations)) {
                logger.warn('AI清洗', 'Router响应不是数组格式');
                return [];
            }

            // 验证每个推荐
            const validRecs = recommendations.filter(rec => {
                if (!rec.promptId || !rec.params) {
                    logger.warn('AI清洗', 'Router推荐缺少必填字段');
                    return false;
                }

                // 验证promptId存在
                if (!promptRegistry.hasPrompt(rec.promptId)) {
                    logger.warn('AI清洗', `无效的promptId: ${rec.promptId}`);
                    return false;
                }

                return true;
            });

            return validRecs;

        } catch (error) {
            logger.error('AI清洗', `Router响应解析失败: ${error}`);
            logger.log('AI清洗', 'AI原始响应（前500字符）', {
                data: aiResponse.substring(0, 500)
            });
            return [];
        }
    }

    /**
     * SQL模板填充
     */
    private inflateSQLTemplates(
        recommendations: RouterRecommendation[],
        tableName: string,
        _stats: any[]
    ): CleaningSuggestion[] {

        const suggestions: CleaningSuggestion[] = [];

        for (let i = 0; i < recommendations.length; i++) {
            const rec = recommendations[i];
            const template = promptRegistry.getPrompt(rec.promptId);
            if (!template || !template.sqlTemplate) {
                logger.warn('AI清洗', `模板${rec.promptId}无SQL模板`);
                continue;
            }

            // 记录清洗模板使用
            promptRegistry.recordUsage(rec.promptId);

            // 填充SQL模板
            let sql = template.sqlTemplate;

            // 替换表名占位符
            sql = sql.replace(/__TABLE_NAME__/g, tableName);

            // 替换参数占位符
            for (const [key, value] of Object.entries(rec.params)) {
                const placeholder = `{${key}}`;
                sql = sql.replace(new RegExp(placeholder, 'g'), String(value));
            }

            // 构建建议对象，添加索引后缀确保ID唯一性
            suggestions.push({
                id: `router-${rec.promptId}-${i}`,
                type: this.inferType(rec.promptId) as any,
                label: template.title,
                reason: rec.reason,
                sql: sql,
                confidence: 0.90,
            });
        }

        logger.log('AI清洗', 'SQL模板填充完成', {
            count: suggestions.length
        });

        return suggestions;
    }

    /**
     * 根据promptId推断建议类型
     */
    private inferType(promptId: string): string {
        if (promptId.includes('dedup')) return 'dedup';
        if (promptId.includes('fill')) return 'fill';
        if (promptId.includes('standardize')) return 'normalize';
        if (promptId.includes('drop')) return 'filter';
        return 'other';
    }
}
