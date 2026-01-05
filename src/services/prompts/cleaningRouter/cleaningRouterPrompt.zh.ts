/**
 * Cleaning Router Prompt 构建器 - 中文版本
 */

import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import { SEED_CLEANING_PROMPTS } from '../seedCleaningPrompts';

/**
 * 构建清洗 Router Prompt（中文）
 */
export function buildCleaningRouterPromptInternal(columns: any[], stats: any[]): string {
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
        return '';
    }

    // 构建模板清单
    const sortedTemplates = templates.sort((a, b) => a.id.localeCompare(b.id));

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
    const qualityIssues = summarizeQualityIssuesInternal(columns, stats);

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
 * 分析数据质量问题（中文）
 */
function summarizeQualityIssuesInternal(_columns: any[], stats: any[]): string {
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
