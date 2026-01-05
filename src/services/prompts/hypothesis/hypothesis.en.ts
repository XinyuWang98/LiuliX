/**
 * 分析假设生成 Prompt 模板 - 英文版本
 */

/**
 * Generate Analysis Hypothesis Prompt (English Version)
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
        ? `【Data Anomaly】${数据摘要.description}`
        : `【Dataset Info】${数据摘要.rowCount || 'Unknown'} rows, ${数据摘要.columns?.length || 'Unknown'} columns`;

    const 字段信息 = 数据摘要.columns
        ? `【Available Fields】${数据摘要.columns.join(', ')}`
        : '';

    // 🛠️ BigInt safe serialization
    const safeStringify = (obj: any) => {
        return JSON.stringify(obj, (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value
            , 2);
    };

    const 样本信息 = 数据摘要.sampleData && 数据摘要.sampleData.length > 0
        ? `【Sample Data (first 3 rows)】\n${safeStringify(数据摘要.sampleData.slice(0, 3))}`
        : '';

    return `
You are a professional data analysis expert.

${上下文描述}${字段信息}${样本信息}
${数据摘要.stats ? '【Extra Statistics】' + 数据摘要.stats : ''}

Please generate 3 analysis hypotheses, each including "Hypothesis" and "Verification Method".
Output format (plain text, no JSON):

- 假设：XXX
  验证方式：YYY
- 假设：XXX
  验证方式：YYY
- 假设：XXX
  验证方式：YYY

【Requirements】
1. Hypotheses must be specific and verifiable
2. Verification methods must explicitly reference field names
3. All 3 hypotheses must be unique
4. Strictly follow the output format above
`.trim();
}

/**
 * Parse AI Hypothesis Response
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

    // Push last item
    if (current.assumption && current.verification) {
        results.push({ assumption: current.assumption, verification: current.verification });
    }

    return results.length > 0 ? results : [];
}
