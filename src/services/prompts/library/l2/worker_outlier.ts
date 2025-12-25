import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 异常值检测
 * 检测数值列的异常值/离群点，使用 IQR 或 Z-score 方法
 */
export const workerOutlierPrompt: UserPrompt = {
    id: 'worker-outlier-v1',
    name: 'worker_outlier',
    title: '异常值检测',
    description: '检测数值列中的异常值/离群点（基于IQR或Z-score方法），识别极端值',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'outlier', label: '异常检测' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 中的列 \`{{column_name}}\` 进行异常值检测。

# 数据集摘要
{{df_summary}}

# 要求
1. 确认该列为数值类型。
2. 使用 IQR 方法检测异常值：
   - 计算 Q1 (25%) 和 Q3 (75%)
   - IQR = Q3 - Q1
   - 下界 = Q1 - 1.5 * IQR
   - 上界 = Q3 + 1.5 * IQR
   - 超出上下界的值标记为异常
3. 绘制箱线图 (Box Plot)，用不同颜色标注异常点。
4. 统计异常值的数量和占比。
5. 使用 matplotlib/seaborn 绘图。
6. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
7. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "共发现 X 个异常值，占总数据的 Y%，主要分布在... (一句话结论)",
  "columnsUsed": ["{{column_name}}"]
}
`,

    inputVariables: ['df_summary', 'column_name'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
