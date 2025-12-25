import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 交叉表分析
 * 两个分类列的共现频次分析，绘制热力图
 */
export const workerCrosstabPrompt: UserPrompt = {
    id: 'worker-crosstab-v1',
    name: 'worker_crosstab',
    title: '交叉表分析',
    description: '分析两个分类列的共现频次，绘制热力图展示交叉表',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'crosstab', label: '交叉分析' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 中的 \`{{row_col}}\` 和 \`{{col_col}}\` 两列进行交叉表分析。

# 数据集摘要
{{df_summary}}

# 要求
1. 确认 {{row_col}} 和 {{col_col}} 都是分类类型。
2. 使用 pandas.crosstab 生成交叉表。
3. 绘制热力图 (Heatmap)：
   - 行: {{row_col}} 的各类别
   - 列: {{col_col}} 的各类别
   - 颜色深浅: 频次高低
4. 在热力图上显示数值标注。
5. 标题: "{{row_col}} 与 {{col_col}} 交叉分析"。
6. 使用 matplotlib/seaborn 绘图。
7. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
8. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "{{row_col}} 与 {{col_col}} 的交叉分析显示：最常见组合是 A-B (X次)，最少见组合是 C-D (Y次)",
  "columnsUsed": ["{{row_col}}", "{{col_col}}"]
}
`,

    inputVariables: ['df_summary', 'row_col', 'col_col'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
