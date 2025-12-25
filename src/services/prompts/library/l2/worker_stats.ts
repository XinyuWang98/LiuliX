import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 描述性统计
 * 计算数值列的基础统计指标
 */
export const workerStatsPrompt: UserPrompt = {
    id: 'worker-stats-v1',
    name: 'worker_stats',
    title: '描述性统计',
    description: '计算数值列的均值、中位数、标准差、最大最小值、四分位数等统计指标',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'statistics', label: '描述统计' },
        { category: 'output', value: 'table', label: '表格' }
    ],

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 中的列 \`{{column_name}}\` 进行描述性统计分析。

# 数据集摘要
{{df_summary}}

# 要求
1. 确认 {{column_name}} 为数值类型。
2. 计算以下统计指标：
   - 计数 (count)
   - 均值 (mean)
   - 标准差 (std)
   - 最小值 (min)
   - 25% 分位数 (Q1)
   - 中位数 (median / 50%)
   - 75% 分位数 (Q3)
   - 最大值 (max)
   - 偏度 (skewness)
   - 峰度 (kurtosis)
3. 将结果整理为 DataFrame 表格形式。
4. 同时绘制一个简单的数值摘要可视化（如条形图展示各指标）。
5. 使用 matplotlib/seaborn 绘图。
6. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
7. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "{{column_name}} 列：均值 X，中位数 Y，标准差 Z，数据呈 [正态/左偏/右偏] 分布",
  "columnsUsed": ["{{column_name}}"]
}
`,

    inputVariables: ['df_summary', 'column_name'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
