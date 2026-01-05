/**
 * Router Prompt 生成器
 * 
 * 生成 L1 决策层 Prompt，让 AI 从可用的 L2 模板中选择最合适的分析方法
 * 取代原来的 batchInsightGenerator，实现 10 倍 Token 节省
 */

import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import { PROMPT_IDS } from '@/constants/promptIds';  // v2.1: 使用ID常量

/**
 * 构建 Router Prompt
 * 
 * @param columns 数据集列名
 * @param sampleData 采样数据 (前 3 行)
 * @param columnTypes 列类型信息
 */
export function buildRouterPrompt(
    columns: string[],
    sampleData: Record<string, unknown>[],
    columnTypes?: Record<string, string>
): string {
    // 获取所有 L2 Prompt，并过滤掉清洗类 prompt（只保留分析类）
    const l2Prompts = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' })
        .filter(p => !p.id.startsWith('cleaner-'));

    // 构建可用模板清单
    const promptList = l2Prompts.map(p => {
        const params = p.inputVariables.join(', ');
        return `- ${p.id}: ${p.title} (参数: ${params})`;
    }).join('\n');

    // 构建列信息
    const columnInfo = columns.map(col => {
        const type = columnTypes?.[col] || '未知';
        return `- ${col} (${type})`;
    }).join('\n');

    // 构建采样数据预览（处理BigInt）
    const sanitizedSampleData = sampleData.slice(0, 3).map(row => {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
            // 将BigInt转换为Number，避免JSON.stringify报错
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
- 必须严格从上述模板列表中选择（包括版本号，如 -v1）
- 禁止自创promptId或省略版本号
- 示例正确: "worker-distribution-v1"
- 示例错误: "distribution", "worker-distribution" (缺少-v1)

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
      "promptId": "worker-distribution-v1",
      "params": {"column_name": "age"},
      "reason": "查看客户年龄分布"
    },
    {
      "promptId": "worker-correlation-v1",
      "params": {"col_x": "age", "col_y": "salary"},
      "reason": "分析年龄与收入的关系",
      "drillHint": {
        "promptId": "worker-groupby-v1",
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
 * 解析 L1 响应
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

/**
 * 构建规则层兜底推荐
 * 当 AI 失败或返回为空时，基于数据特征生成确定性推荐
 */
export function buildFallbackRecommendations(
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
