import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 单变量分布分析
 * 用于绘制数值列直方图或分类列柱状图
 */
export const workerDistributionPrompt: UserPrompt = {
    id: 'worker-distribution-v1',
    name: 'worker_distribution',
    title: '单变量分布分析',
    description: '查看单一变量的数据分布情况（偏态、峰度、异常值）',

    layer: 'L2_EXECUTION',

    // 四维矩阵标签
    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'statistics', label: '统计分布' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 中的列 \`{{column_name}}\` 进行分布分析。

# 数据集摘要
{{df_summary}}

# 要求
1. 检查列的数据类型。
2. 如果是数值型 (Numeric)：
   - 绘制直方图 (Histogram) + 核密度估计 (KDE)。
   - 计算偏度 (Skewness) 和峰度 (Kurtosis)。
   - 标题: "{{column_name}} 分布分析"。
3. 如果是分类型 (Categorical/String)：
   - 绘制柱状图 (Bar Chart)，显示 Top 10 类别。
   - 标题: "{{column_name}} 类别分布 (Top 10)"。
4. 使用 matplotlib/seaborn 绘图。
5. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
6. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "对该列分布的分析结论（一句话）",
  "columnsUsed": ["{{column_name}}"]
}
`,

    inputVariables: ['df_summary', 'column_name'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
