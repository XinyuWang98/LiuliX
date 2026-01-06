/**
 * 证据链生成 Prompt 模板（中文版本）
 * 用于生成异常→原因→佐证数据的树状关联路径
 */

/**
 * 证据链节点结构
 */
export interface 证据节点 {
    id: string;
    标题: string;
    描述: string;
    子节点?: 证据节点[];
}

/**
 * 生成证据链的 prompt（内部实现 - 中文）
 * @param 异常摘要 - 当前异常的基本信息（如"第37行数据重复，值 'abc' 出现两次"）
 * @param 相关数据 - 与异常相关的数据切片（可选，用于提供上下文）
 * @returns prompt 字符串
 */
export function generateEvidenceChainPromptInternal(
    异常摘要: string,
    相关数据?: any[]
): string {
    const 数据上下文 = 相关数据
        ? JSON.stringify(相关数据.slice(0, 5)) // 只取前5条防超长
        : '无额外数据切片';

    return `
你是一个专业的数据溯源分析师，现在发现以下异常：

异常描述：${异常摘要}
相关数据样本：${数据上下文}

请构建一条完整的证据链，展示异常的可能来源和下游影响。
输出必须是纯 JSON，严格符合以下结构（不要任何解释、markdown、缩进说明）：

{
  "id": "root",
  "标题": "数据异常根节点",
  "描述": "${异常摘要}",
  "子节点": [
    {
      "id": "source1",
      "标题": "上游来源1",
      "描述": "简短中文描述，例如：爬虫抓取的表A.user_id字段",
      "子节点": []  // 可继续嵌套，如果无子节点留空数组
    },
    {
      "id": "source2",
      "标题": "上游来源2",
      "描述": "简短中文描述，例如：手动上传的CSV文件第37行"
    },
    {
      "id": "impact1",
      "标题": "下游影响1",
      "描述": "简短中文描述，例如：报告页统计总数偏差+1"
    }
  ]
}

要求：
- 子节点总数 2-4 个（至少1个来源 + 1个影响）
- 每条描述不超过 30 字
- id 用 source1/source2/impact1/impact2 等简单编号
- 只输出 JSON，不要任何其他文字
`.trim();
}

/**
 * 解析 AI 返回的证据链结果（内部实现 - 中文）
 * @param AI返回结果 - Gemini API 返回的原始文本（预期为 JSON 字符串）
 * @returns 树状证据链数据，若解析失败返回 null（前端可显示"暂无证据链"）
 */
export function parseEvidenceChainResultInternal(AI返回结果: string): 证据节点 | null {
    try {
        // 先尝试直接解析 JSON
        const parsed = JSON.parse(AI返回结果.trim());

        // 基本校验：必须有 id、标题、描述
        if (
            parsed &&
            typeof parsed === 'object' &&
            parsed.id &&
            parsed.标题 &&
            parsed.描述 &&
            Array.isArray(parsed.子节点)
        ) {
            return parsed as 证据节点;
        }

        return null;
    } catch (e) {
        // 如果 JSON 解析失败，尝试从文本中提取可能残留的 JSON 块
        const jsonMatch = AI返回结果.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const fallback = JSON.parse(jsonMatch[0]);
                if (fallback && typeof fallback === 'object') {
                    return fallback as 证据节点;
                }
            } catch {
                // 完全失败
            }
        }

        console.warn('证据链解析失败，返回 null', e);
        return null;
    }
}
