import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 双变量相关性分析
 * 用于绘制散点图 (数值 vs 数值) 或 箱线图 (分类 vs 数值)
 */
export const workerCorrelationPrompt: UserPrompt = {
    id: 'worker-correlation-v1',
    name: 'worker_correlation',
    title: '双变量相关性分析',
    description: '分析两个变量之间的关系（线性相关、聚类模式、分布差异）',

    layer: 'L2_EXECUTION',

    // 四维矩阵标签
    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'causal', label: '归因/关系' },
        { category: 'method', value: 'statistics', label: '相关性' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 中的列 \`{{col_x}}\` 和 \`{{col_y}}\` 进行关系分析。

# 数据集摘要
{{df_summary}}

# 要求
1. 检查两列的数据类型。
2. 场景 A: 数值 vs 数值 (Numeric vs Numeric):
   - 绘制散点图 (Scatter Plot)，带回归线 (Regression Line)。
   - 计算 Pearson 和 Spearman 相关系数。
   - 标题: "{{col_x}} vs {{col_y}} 相关性分析"。
3. 场景 B: 分类 vs 数值 (Categorical vs Numeric):
   - 绘制箱线图 (Box Plot) 或 小提琴图 (Violin Plot)。
   - 标题: "不同 {{col_x}} 下的 {{col_y}} 分布"。
4. 场景 C: 分类 vs 分类 (Categorical vs Categorical):
   - 绘制热力图 (Heatmap) 展示交叉表 (Crosstab)。
   - 标题: "{{col_x}} 与 {{col_y}} 的共现分布"。
5. 使用 matplotlib/seaborn 绘图。
6. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
7. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "对两列关系的分析结论（一句话）",
  "columnsUsed": ["{{col_x}}", "{{col_y}}"]
}
`,

    inputVariables: ['df_summary', 'col_x', 'col_y'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
