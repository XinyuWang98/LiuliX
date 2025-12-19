/**
 * 报告生成 Prompt 模板
 * 用于生成结构化报告内容（异常清单 + 优化建议）
 */

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

/**
 * 生成报告的 prompt
 * @param 分析结果 - 当前分析的所有结果汇总（异常列表、证据链、趋势等）
 * @returns prompt 字符串
 */
export function 生成报告Prompt(分析结果: any): string {
    const 异常文本 = JSON.stringify(分析结果, null, 2);

    return `
你是一个专业的数据分析顾问，请根据以下分析结果生成一份简洁有力的数据质量报告。

分析结果（JSON）：
${异常文本}

请直接输出纯 JSON，严格符合以下结构（不要任何说明、markdown、\`\`\`json 标记）：

{
  "异常清单": [
    {
      "序号": 1,
      "异常描述": "简短中文描述，例如：第37行数据重复",
      "严重程度": "高|中|低",
      "影响范围": "例如：影响用户ID统计，导致报表总数偏差+1"
    }
  ],
  "优化建议": [
    {
      "序号": 1,
      "建议标题": "去重清洗",
      "建议内容": "在上传后增加基于user_id的drop_duplicates步骤",
      "优先级": "高|中|低"
    }
  ]
}

要求：
- 异常清单 3-6 条，优化建议 3-5 条
- 严重程度和优先级必须是 高/中/低 三选一
- 描述和内容不超过 40 字
- 只输出纯 JSON，不要任何其他文字
`.trim();
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