/**
 * 分析假设生成 Prompt 模板
 * 用于生成数据分析假设
 */

/**
 * 生成分析假设的 prompt（中文版本）
 */
export function 生成假设PromptInternal(
  数据摘要: {
    description?: string;
    stats?: string;
    columns?: string[];
    rowCount?: number;
    sampleData?: any[];
  }
): string {
  const 上下文描述 = 数据摘要.description
    ? `【数据异常】${数据摘要.description}`
    : `【数据集信息】共 ${数据摘要.rowCount || '未知'} 行，${数据摘要.columns?.length || '未知'} 列`;

  const 字段信息 = 数据摘要.columns
    ? `【可用字段】${数据摘要.columns.join(', ')}`
    : '';

  // 🛠️ BigInt 安全序列化
  const safeStringify = (obj: any) => {
    return JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
      , 2);
  };

  const 样本信息 = 数据摘要.sampleData && 数据摘要.sampleData.length > 0
    ? `【样本数据（前3行）】\n${safeStringify(数据摘要.sampleData.slice(0, 3))}`
    : '';

  return `
你是一个专业的数据分析专家。

${上下文描述}${字段信息}${样本信息}
${数据摘要.stats ? '【额外统计信息】' + 数据摘要.stats : ''}

请生成 3 条分析假设，每条包含「假设」和「验证方式」。
输出格式（纯文本，不要JSON）：

- 假设：XXX
  验证方式：YYY
- 假设：XXX
  验证方式：YYY
- 假设：XXX
  验证方式：YYY

【要求】
1. 假设要具体、可验证
2. 验证方式要明确引用字段名
3. 3条假设不重复
4. 输出格式严格按照上述示例
`.trim();
}

/**
 * 解析 AI 返回的假设结果
 * @param AI返回结果 - Gemini API 返回的原始文本
 * @returns 结构化的假设数组，每项包含 assumption 和 verification
 */
export function 解析假设结果(AI返回结果: string): {
  assumption: string;
  verification: string;
}[] {
  const lines = AI返回结果.trim().split('\n').filter(line => line.trim());
  const results: { assumption: string; verification: string }[] = [];

  let current: { assumption?: string; verification?: string } = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('- 假设：')) {
      if (current.assumption && current.verification) {
        results.push({ assumption: current.assumption, verification: current.verification });
      }
      current = { assumption: trimmed.replace('- 假设：', '').trim() };
    } else if (trimmed.startsWith('验证方式：')) {
      current.verification = trimmed.replace('验证方式：', '').trim();
    }
  }

  // 推入最后一条
  if (current.assumption && current.verification) {
    results.push({ assumption: current.assumption, verification: current.verification });
  }

  // 如果解析失败，返回空数组而不是 null
  return results.length > 0 ? results : [];
}