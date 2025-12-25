import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 缺失值分析
 * 扫描全表，统计各列缺失情况和缺失模式
 */
export const workerMissingPrompt: UserPrompt = {
    id: 'worker-missing-v1',
    name: 'worker_missing',
    title: '缺失值分析',
    description: '扫描全表，统计各列缺失数量和比例，识别缺失模式',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'cleaning', label: '清洗' },
        { category: 'method', value: 'missing', label: '缺失检测' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 进行全表缺失值分析。

# 数据集摘要
{{df_summary}}

# 要求
1. 统计每列的缺失值数量和比例。
2. 按缺失比例降序排序。
3. 筛选出缺失比例 > 0 的列。
4. 绘制水平柱状图，展示各列缺失比例。
5. 使用颜色渐变：
   - 缺失比例 < 5%: 绿色
   - 缺失比例 5%-20%: 黄色
   - 缺失比例 > 20%: 红色
6. 标题: "数据集缺失值分析"。
7. 使用 matplotlib/seaborn 绘图。
8. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
9. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "共 X 列存在缺失，缺失最严重的是 A 列 (Y%)，建议优先处理",
  "columnsUsed": []
}
`,

    inputVariables: ['df_summary'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
