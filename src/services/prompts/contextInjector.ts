/**
 * ContextInjector - Context 注入器
 * 
 * 职责：
 * 1. 将 adoptedInsights 格式化为 Prompt 片段
 * 2. 注入到 basePrompt 的适当位置
 * 3. 支持链式 Context 构建
 */

import { AdoptedInsight } from '@/contexts/AnalysisContext';
import { logger } from '@/utils/logger';

/**
 * 将 Context 注入到 Prompt 中
 * 
 * @param basePrompt 基础 Prompt
 * @param insights 已采纳的洞察列表
 * @returns 增强后的 Prompt
 */
export function injectContextToPrompt(
    basePrompt: string,
    insights: AdoptedInsight[]
): string {
    if (!insights || insights.length === 0) {
        return basePrompt;
    }

    // 按 depth 排序，形成链条
    const sorted = [...insights].sort((a, b) => a.depth - b.depth);

    // 构建 Context 片段
    const contextSection = buildContextSection(sorted);

    // 注入到 Prompt
    const injected = injectSection(basePrompt, contextSection);

    logger.log('AI服务', '[ContextInjector] Context 注入完成', {
        data: {
            insightCount: insights.length,
            maxDepth: Math.max(...insights.map(i => i.depth)),
            injectedLength: injected.length - basePrompt.length
        }
    });

    return injected;
}

/**
 * 构建 Context 片段
 */
function buildContextSection(insights: AdoptedInsight[]): string {
    let section = '\n\n## Previous Insights (User Verified)\n\n';
    section += '> The user has already analyzed this dataset and verified the following findings.\n';
    section += '> Please consider these insights when generating new recommendations.\n\n';

    insights.forEach((insight, idx) => {
        const prefix = insight.depth === 0 ? '🔍' : '↪️';
        const levelLabel = insight.depth === 0 ? 'Initial Finding' : `Follow-up Level ${insight.depth}`;

        section += `${idx + 1}. ${prefix} **${levelLabel}**: ${insight.description}`;

        // 添加结构化信息
        if (insight.structuredData?.column) {
            section += `\n   - Column: \`${insight.structuredData.column}\``;
        }
        if (insight.structuredData?.issues && insight.structuredData.issues.length > 0) {
            section += `\n   - Issues: ${insight.structuredData.issues.join(', ')}`;
        }

        section += '\n\n';
    });

    section += '---\n\n';
    section += '**Task**: Generate follow-up analysis recommendations based on these verified findings.\n';
    section += 'Focus on unexplored aspects or deeper investigation of the identified issues.\n';

    return section;
}

/**
 * 将 Context 片段注入到 basePrompt
 * 策略：在 "## Task" 或 "## Your Task" 之前插入
 */
function injectSection(basePrompt: string, contextSection: string): string {
    // 尝试在 Task 标题前插入
    const taskPatterns = [
        /## Task\n/i,
        /## Your Task\n/i,
        /## 任务\n/,
        /## 你的任务\n/
    ];

    for (const pattern of taskPatterns) {
        if (pattern.test(basePrompt)) {
            return basePrompt.replace(pattern, contextSection + '\n$&');
        }
    }

    // 如果没有找到 Task 标题，追加到末尾
    logger.warn('AI服务', '[ContextInjector] 未找到 Task 标题，追加到末尾');
    return basePrompt + '\n' + contextSection;
}

/**
 * 构建链式 Context (用于 L1+ 下钻)
 * 
 * @param insights 已采纳的洞察列表
 * @returns 链式 Context 字符串
 */
export function buildChainedContext(insights: AdoptedInsight[]): string {
    if (insights.length === 0) return '';

    const sorted = [...insights].sort((a, b) => a.depth - b.depth);

    let result = '## Analysis Chain\n\n';

    sorted.forEach((insight, idx) => {
        const prefix = idx === 0 ? '🔍 Initial Finding' : `↪️ Follow-up ${idx}`;
        result += `### ${prefix} (Level ${insight.depth})\n`;
        result += `- ${insight.description}\n`;

        if (insight.structuredData?.column) {
            result += `- Column: \`${insight.structuredData.column}\`\n`;
        }

        if (insight.structuredData?.issues) {
            result += `- Issues: ${insight.structuredData.issues.join(', ')}\n`;
        }

        result += '\n';
    });

    result += '---\n';
    result += '**Task**: Generate the next level of analysis based on this chain.\n';

    return result;
}
