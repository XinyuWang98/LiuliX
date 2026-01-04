/**
 * 清洗Router
 * 实现AI选择清洗模板 → SQL模板填充的工作流程
 */

import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import type { CleaningSuggestion } from '@/services/aiService';
import { SEED_CLEANING_PROMPTS } from './seedCleaningPrompts';

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

            // Step 4: SQL Inflater填充模板
            const suggestions = this.inflateSQLTemplates(
                recommendations,
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
     * 构建Router Prompt
     * 
     * @param columns 列信息
     * @param stats 统计信息
     */
    private buildRouterPrompt(columns: any[], stats: any[]): string {
        // 获取所有清洗模板
        let templates = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' })
            .filter(p => p.id.startsWith('cleaner-'));

        // 🛡️ 防御性编程：如果未找到模板，尝试重新注册种子模板
        if (templates.length === 0) {
            logger.warn('AI清洗', '未找到清洗模板，尝试重新注册种子模板');
            promptRegistry.registerBatch(SEED_CLEANING_PROMPTS);
            templates = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' })
                .filter(p => p.id.startsWith('cleaner-'));
        }

        // 再次检查
        if (templates.length === 0) {
            logger.error('AI清洗', 'CRITICAL: 重新注册后仍未找到清洗模板');
            return ''; // Early exit or handle gracefully
        }

        // 构建模板清单
        const sortedTemplates = templates.sort((a, b) => a.id.localeCompare(b.id));

        // 🐛 DEBUG: 打印可用模板列表
        logger.log('AI清洗', '可用的Router模板', {
            data: sortedTemplates.map(t => t.id)
        });

        const templateList = sortedTemplates.map(t => {
            const params = t.inputVariables.length > 0
                ? `(参数: ${t.inputVariables.join(', ')})`
                : '(无参数)';
            return `- ${t.id}: ${t.title} ${params}\n  ${t.description}`;
        }).join('\n\n');

        // 分析数据质量问题
        const qualityIssues = this.summarizeQualityIssues(columns, stats);

        // 列信息摘要
        const columnSummary = columns.slice(0, 10).map(c => {
            const colStat = stats.find(s => s.name === c.name);
            const nullRate = colStat ? ((colStat.nullCount / colStat.total) * 100).toFixed(1) : '0.0';
            return `- ${c.name} (${c.type}), 缺失率: ${nullRate}%`;
        }).join('\n');

        return `你是数据清洗专家。请根据数据质量问题，从【可用清洗模板】中选择2-5个最合适的。

## 数据质量问题
${qualityIssues}

## 列信息（前10列）
${columnSummary}

## 可用清洗模板
${templateList}

## 任务要求
1. 从上述模板中选择 **2-5 个**最有价值的清洗操作
2. 为每个推荐填写具体的参数（如列名、填充值等）
3. 给出简短的推荐理由

## 输出格式 (严格JSON)
\`\`\`json
{
  "recommendations": [
    {
      "promptId": "cleaner-remove-duplicates-v1",
      "params": {},
      "reason": "推荐理由"
    },
    {
      "promptId": "cleaner-fill-null-median-v1",
      "params": {
        "column_name": "实际列名",
        "median_value": 30
      },
      "reason": "推荐理由"
    }
  ]
}
\`\`\`

**重要约束**：
- promptId 必须严格从上述模板列表中选择（包括版本号）
- params 中的列名必须是实际存在的列
- 只返回JSON，不要其他内容`;
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

        for (const rec of recommendations) {
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

            // 构建建议对象
            suggestions.push({
                id: `router-${rec.promptId}`,
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

    /**
     * 分析数据质量问题（简化版）
     */
    private summarizeQualityIssues(_columns: any[], stats: any[]): string {
        const issues: string[] = [];

        // 检测缺失值
        stats.forEach(stat => {
            if (stat.nullCount > 0 && stat.total > 0) {
                const nullRate = (stat.nullCount / stat.total) * 100;
                if (nullRate > 1) {
                    issues.push(`- 列"${stat.name}"缺失率${nullRate.toFixed(1)}%`);
                }
            }
        });

        // 默认提示（简化）
        if (issues.length === 0) {
            issues.push('- 可能存在重复行');
            issues.push('- 部分列可能需要格式标准化');
        }

        return issues.join('\n');
    }
}
