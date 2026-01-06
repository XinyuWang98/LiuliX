// 批量洞察生成 Prompt（中文版本）

/**
 * 生成批量洞察建议的 AI Prompt（内部实现 - 中文）
 */
export function generateBatchInsightsPromptInternal(
    columns: string[],
    rowCount: number,
    totalRows: number,
    sampleData: any[]
): string {
    const columnList = columns.join(', ');

    // 🔧 处理BigInt序列化问题
    const sampleDataCleaned = sampleData.slice(0, 5).map(row => {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(row)) {
            cleaned[key] = typeof value === 'bigint' ? value.toString() : value;
        }
        return cleaned;
    });

    const sampleJson = JSON.stringify(sampleDataCleaned);

    return `你是一位资深数据分析师，请分析以下数据集并生成洞察建议。

## 数据集信息
- 列名: ${columnList}
- 采样行数: ${rowCount} 行
- 总行数: ${totalRows} 行
- 样本数据:
${sampleJson}

## 要求
请生成3-5个数据洞察建议，每个建议包含：
1. title: 洞察标题
2. description: 洞察描述
3. columns_used: 使用的列名数组
4. full_mode.code: 完整的Python分析代码
5. aggregated_mode.sql: DuckDB预聚合SQL
6. aggregated_mode.viz_code: 可视化代码

## 代码规范
- 使用 df 作为数据变量名
- 使用 matplotlib 生成图表
- 输出格式为 JSON，包含 image(base64) 和 summary
- **重要：在执行数值聚合操作前，必须确保列是数值类型（使用 pd.to_numeric(df['column'], errors='coerce')）**
- **字符串中的换行必须使用 \\\\n 转义，禁止在单引号或双引号内直接换行**
- **示例：ax.text(0.5, 0.5, '第一行\\\\n第二行') 而不是 ax.text(0.5, 0.5, '第一行 换行 第二行')**


## 输出格式
[
    {
        "title": "洞察标题",
        "description": "洞察描述",
        "columns_used": ["列名1", "列名2"],
        "full_mode": {
            "code": "完整Python代码"
        },
        "aggregated_mode": {
            "sql": "DuckDB SQL",
            "viz_code": "可视化代码"
        }
    }
]

请直接返回JSON数组，不要包含其他内容。`;
}
