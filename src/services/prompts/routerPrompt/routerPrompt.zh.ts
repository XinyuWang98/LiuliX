/**
 * Router Prompt 构建器 - 中文版本
 * 
 * 生成 L1 决策层 Prompt，用于洞察分析
 */

import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import { PROMPT_IDS } from '@/constants/promptIds';
import { formatSchemaForPrompt, type ColumnSchema } from '@/services/schemaService';  // 🆕 使用SchemaService
import { getPromptIdByName } from '@/services/promptIdMap';  // 🆕 导入映射工具

/**
 * 构建 Router Prompt（中文）
 */
export function buildRouterPromptInternal(
    columns: string[],
    sampleData: Record<string, unknown>[],
    columnTypes?: Record<string, string>
): string {
    // 获取所有 L2 Prompt，并过滤掉清洗类 prompt（只保留分析类）
    const l2Prompts = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' })
        .filter(p => !p.id.startsWith('cleaner-'));

    // 🆕 构建可用模板清单（使用数字 ID + outputColumns）
    const promptList = l2Prompts.map(p => {
        const numId = getPromptIdByName(p.id) || 0;  // 获取数字 ID
        const params = p.inputVariables.join(', ');
        // 🆕 如果有 outputColumns，显示生成的列名（方案D：让AI知道会生成哪些列）
        const outputs = p.outputColumns && p.outputColumns.length > 0
            ? ` → 生成列: ${p.outputColumns.join(', ')}`
            : '';
        return `- ${numId}: ${p.title} (参数: ${params}${outputs})`;
    }).join('\n');

    // 🆕 使用 SchemaService 构建列信息 (带约束说明)
    const schema: ColumnSchema[] = columns.map(col => ({
        name: col,
        type: columnTypes?.[col] || '未知'
    }));

    const columnInfo = formatSchemaForPrompt(schema, {
        includeConstraints: true,  // ✅ 添加约束说明
        format: 'markdown',
        language: 'zh-CN',
        includeTypes: true
    });

    // 构建采样数据预览（处理BigInt）
    const sanitizedSampleData = sampleData.slice(0, 3).map(row => {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
            sanitized[key] = typeof value === 'bigint' ? Number(value) : value;
        }
        return sanitized;
    });
    const samplePreview = JSON.stringify(sanitizedSampleData, null, 2);

    logger.log('AI服务', `[RouterPrompt] 构建 Prompt, ${l2Prompts.length} 个可用模板`);

    return `你是一位资深数据分析专家。请根据数据集特征，从【可用分析模板】中选择 3-5 个最有价值的分析视角。

## 数据集信息
### 列信息
${columnInfo}

### 采样数据
\`\`\`json
${samplePreview}
\`\`\`

## 可用分析模板
${promptList}

## 任务要求
1. 从上述模板中选择 **3-5 个**最适合当前数据的分析
2. 为每个推荐填写具体的列名参数
3. (可选) 预测用户下一步可能的下钻分析

## 输出格式 (严格 JSON)
\`\`\`json
{
  "recommendations": [
    {
      "promptId": "worker-distribution-v1",
      "params": { "column_name": "实际列名" },
      "reason": "推荐理由（简短）",
      "drillHint": {
        "promptId": "worker-correlation-v1",
        "params": { "col_x": "列1", "col_y": "列2" },
        "label": "下钻按钮文案"
      }
    }
  ]
}
\`\`\`

## 重要约束（3B模型优化）
⚠️ **promptId约束**:
- 必须使用数字ID（如 1, 2, 3），不要使用字符串ID
- 数字ID必须严格从上述模板列表中选择
- 禁止自创ID或使用不存在的数字

⚠️ **params约束**:
- **必须填写真实列名**: params中的列名必须从【列信息】中选择
- **禁止使用占位符**: 严禁使用'value', 'date', 'category'等通用名称
- **完全匹配**: 列名必须与数据集中的列名完全一致（大小写敏感）
- **示例**:
  - ❌ 错误: {"column_name": "value"}
  - ✅ 正确: {"column_name": "median_income"}
- 示例正确: "promptId": 1
- 示例错误: "promptId": "worker-distribution-v1", "promptId": 999

⚠️ **params约束**:
- column_name 必须是实际存在的列名
- 数值参数必须是数字类型（不要加引号）
- 示例正确: {"column_name": "age", "threshold": 100}
- 示例错误: {"column_name": "不存在的列", "threshold": "100"}

⚠️ **JSON约束**:
- 只返回JSON，不要其他markdown说明
- 确保JSON格式正确（双引号、逗号）

## Few-shot示例
假设数据列: customer_id (INTEGER), age (INTEGER), salary (DOUBLE), purchase_date (DATE)

正确输出:
\`\`\`json
{
  "recommendations": [
    {
      "promptId": 1,
      "params": {"column_name": "age"},
      "reason": "查看客户年龄分布"
    },
    {
      "promptId": 2,
      "params": {"col_x": "age", "col_y": "salary"},
      "reason": "分析年龄与收入的关系",
      "drillHint": {
        "promptId": 3,
        "params": {"group_col": "age", "agg_col": "salary"},
        "label": "按年龄段分组"
      }
    }
  ]
}
\`\`\`

**现在请分析实际数据并生成推荐。**`;
}

/**
 * 构建规则层兜底推荐（中文）
 */
export function buildFallbackRecommendationsInternal(
    columns: string[],
    columnTypes?: Record<string, string>
): {
    promptId: string;
    params: Record<string, unknown>;
    reason: string;
}[] {
    const recommendations: {
        promptId: string;
        params: Record<string, unknown>;
        reason: string;
    }[] = [];

    // 找到第一个数值列
    const numericCol = columns.find(col => {
        const type = columnTypes?.[col]?.toLowerCase() || '';
        return type.includes('int') || type.includes('float') || type.includes('numeric');
    });

    // 找到第一个日期列
    const dateCol = columns.find(col => {
        const type = columnTypes?.[col]?.toLowerCase() || '';
        return type.includes('date') || type.includes('time');
    });

    // 规则 1: 数值列存在 → 分布分析
    if (numericCol) {
        recommendations.push({
            promptId: PROMPT_IDS.DISTRIBUTION,
            params: { column_name: numericCol },
            reason: `查看 ${numericCol} 的数据分布`
        });

        recommendations.push({
            promptId: PROMPT_IDS.STATS,
            params: { column_name: numericCol },
            reason: `${numericCol} 的描述性统计`
        });
    }

    // 规则 2: 两个数值列 → 相关性
    const numericCols = columns.filter(col => {
        const type = columnTypes?.[col]?.toLowerCase() || '';
        return type.includes('int') || type.includes('float') || type.includes('numeric');
    });
    if (numericCols.length >= 2) {
        recommendations.push({
            promptId: PROMPT_IDS.CORRELATION,
            params: { col_x: numericCols[0], col_y: numericCols[1] },
            reason: `分析 ${numericCols[0]} 与 ${numericCols[1]} 的关系`
        });
    }

    // 规则 3: 日期列 + 数值列 → 趋势分析
    if (dateCol && numericCol) {
        recommendations.push({
            promptId: PROMPT_IDS.TREND,
            params: { date_col: dateCol, value_col: numericCol },
            reason: `${numericCol} 随时间的变化趋势`
        });
    }

    logger.log('AI服务', `[RouterPrompt] 规则层生成 ${recommendations.length} 个兜底推荐`);
    return recommendations;
}
