import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 分组聚合分析
 * 按分类列分组，对数值列进行聚合，比较组间差异
 */
export const workerGroupbyPrompt: UserPrompt = {
    id: 'worker-groupby-v1',
    name: 'worker_groupby',
    title: '分组聚合分析',
    description: '按分类列分组，对数值列聚合（求和/均值/计数），比较不同组之间的差异',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'aggregation', label: '分组聚合' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\`，按 \`{{group_col}}\` 列分组，对 \`{{value_col}}\` 列进行 \`{{agg_func}}\` 聚合分析。

# 数据集摘要
{{df_summary}}

# 要求
1. 确认 {{group_col}} 为分类列，{{value_col}} 为数值列。
2. 使用 pandas groupby 进行分组聚合。
3. 聚合函数根据 {{agg_func}} 参数选择：
   - "sum": 求和
   - "mean": 均值
   - "count": 计数
   - "median": 中位数
4. 按聚合结果降序排序。
5. 绘制水平柱状图 (Horizontal Bar Chart)，展示各组的聚合值。
6. 标题: "{{group_col}} 分组下的 {{value_col}} {{agg_func}} 分析"。
7. 使用 matplotlib/seaborn 绘图。
8. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
9. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "{{group_col}} 共 X 个分组，{{value_col}} 的 {{agg_func}} 最高为 A 组 (值)，最低为 B 组 (值)",
  "columnsUsed": ["{{group_col}}", "{{value_col}}"]
}
`,

    inputVariables: ['df_summary', 'group_col', 'value_col', 'agg_func'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
