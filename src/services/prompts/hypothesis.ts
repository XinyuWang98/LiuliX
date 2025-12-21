/**
 * 分析假设生成 Prompt 模板
 * 用于生成数据分析假设
 */

/**
 * 生成分析假设的 prompt
 * @param 数据摘要 - 当前数据集的基本统计信息
 * @returns prompt 字符串
 */
export function 生成假设Prompt(数据摘要: {
  description?: string;       // 可选：异常描述，例如"第37行数据重复"或"缺失值占比30%"
  stats?: string;             // 可选：额外统计信息
  columns?: string[];         // 可选：数据集列名
  rowCount?: number;          // 可选：行数
  sampleData?: any[];         // 可选：样本数据（前5行）
}): string {
  const 上下文描述 = 数据摘要.description
    ? `数据异常：${数据摘要.description}`
    : `数据集信息：${数据摘要.rowCount || '未知'} 行，${数据摘要.columns?.length || '未知'} 列`;

  const 字段信息 = 数据摘要.columns
    ? `\n可用字段：${数据摘要.columns.join(', ')}`
    : '';

  // 🛠️ BigInt 安全序列化：DuckDB 返回的大数字可能是 BigInt 类型
  const safeStringify = (obj: any) => {
    return JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
      , 2);
  };

  const 样本信息 = 数据摘要.sampleData && 数据摘要.sampleData.length > 0
    ? `\n样本数据（前3行）：\n${safeStringify(数据摘要.sampleData.slice(0, 3))}`
    : '';

  return `
你是一个专业的数据分析师，当前数据集情况如下：

${上下文描述}${字段信息}${样本信息}
${数据摘要.stats ? '额外统计：' + 数据摘要.stats : ''}

请生成 3 条可检验的分析假设，每条假设提出一个值得探索的数据关系或趋势。
每条假设严格遵循以下格式（不要编号，不要多余说明）：

- 假设：[简短假设描述，最多25字]
  验证方式：[如何快速验证该假设，最多20字]

要求：
- 用中文回复
- 假设必须具体、可操作
- 优先考虑变量关系、分布特征、趋势变化三类方向
- 只输出 3 条假设，不要开头结尾废话
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