/**
 * 分析假设生成 Prompt 模板
 * 用于生成数据分析假设
 */

/**
 * 生成分析假设的 prompt
 * @param 数据摘要 - 当前数据集的基本统计信息
 * @param t - i18n翻译函数
 * @returns prompt 字符串
 */
export function 生成假设Prompt(
  数据摘要: {
    description?: string;       // 可选：异常描述，例如"第37行数据重复"或"缺失值占比30%"
    stats?: string;             // 可选：额外统计信息
    columns?: string[];         // 可选：数据集列名
    rowCount?: number;          // 可选：行数
    sampleData?: any[];         // 可选：样本数据（前5行）
  },
  t: (key: string) => string   // i18n函数
): string {
  const 上下文描述 = 数据摘要.description
    ? `${t('prompt.hypothesis.dataAnomaly')}${数据摘要.description}`
    : `${t('prompt.hypothesis.datasetInfo')}${数据摘要.rowCount || '未知'}${t('prompt.hypothesis.rows')}${数据摘要.columns?.length || '未知'}${t('prompt.hypothesis.columns')}`;

  const 字段信息 = 数据摘要.columns
    ? `${t('prompt.hypothesis.availableFields')}${数据摘要.columns.join(', ')}`
    : '';

  // 🛠️ BigInt 安全序列化：DuckDB 返回的大数字可能是 BigInt 类型
  const safeStringify = (obj: any) => {
    return JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
      , 2);
  };

  const 样本信息 = 数据摘要.sampleData && 数据摘要.sampleData.length > 0
    ? `${t('prompt.hypothesis.sampleData')}\n${safeStringify(数据摘要.sampleData.slice(0, 3))}`
    : '';

  return `
${t('prompt.hypothesis.systemRole')}

${上下文描述}${字段信息}${样本信息}
${数据摘要.stats ? t('prompt.hypothesis.extraStats') + 数据摘要.stats : ''}

${t('prompt.hypothesis.generateInstruction')}
${t('prompt.hypothesis.formatInstruction')}

${t('prompt.hypothesis.formatExample')}

${t('prompt.hypothesis.requirements')}
${t('prompt.hypothesis.req1')}
${t('prompt.hypothesis.req2')}
${t('prompt.hypothesis.req3')}
${t('prompt.hypothesis.req4')}
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