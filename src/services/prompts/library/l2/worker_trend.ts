import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 时序趋势分析
 * 分析数值随时间的变化趋势，识别周期性和突变点
 */
export const workerTrendPrompt: UserPrompt = {
    id: 'worker-trend-v1',
    name: 'worker_trend',
    title: '时序趋势分析',
    description: '分析数值随时间的变化趋势，识别周期性、季节性和突变点',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'timeseries', label: '时序分析' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\`，分析 \`{{value_col}}\` 列随 \`{{date_col}}\` 时间的变化趋势。

# 数据集摘要
{{df_summary}}

# 要求
1. 确认 {{date_col}} 为日期/时间类型，{{value_col}} 为数值类型。
2. 将数据按 {{date_col}} 排序。
3. 绘制折线图 (Line Chart) 展示趋势。
4. 添加移动平均线 (7日或适当周期) 平滑趋势。
5. 计算整体趋势方向：
   - 使用线性回归斜率判断上升/下降/平稳
6. 标题: "{{value_col}} 随时间的变化趋势"。
7. 使用 matplotlib/seaborn 绘图。
8. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
9. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "{{value_col}} 在时间段内呈现 [上升/下降/平稳] 趋势，最高点出现在 X，最低点出现在 Y",
  "columnsUsed": ["{{date_col}}", "{{value_col}}"]
}
`,

    inputVariables: ['df_summary', 'date_col', 'value_col'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
