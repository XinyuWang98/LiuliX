import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: Top N 排名
 * 找出某列数值最大或最小的前 N 条记录
 */
export const workerTopnPrompt: UserPrompt = {
    id: 'worker-topn-v1',
    name: 'worker_topn',
    title: 'Top N 排名',
    description: '找出某列数值最大或最小的前N条记录，展示排名榜单',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'ranking', label: '排名' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\`，找出 \`{{column_name}}\` 列数值 {{#if ascending}}最小{{else}}最大{{/if}} 的前 {{n}} 条记录。

# 数据集摘要
{{df_summary}}

# 参数
- 列名: {{column_name}}
- 数量: {{n}}
- 排序方向: {{ascending}} (true=升序/最小, false=降序/最大)

# 要求
1. 确认 {{column_name}} 为数值类型。
2. 根据 ascending 参数决定排序方向：
   - ascending=true: 找最小的 N 个
   - ascending=false: 找最大的 N 个
3. 绘制水平柱状图 (Horizontal Bar Chart)，展示排名。
4. 柱状图按排名顺序排列（最大/最小在最上方）。
5. 标题: "{{column_name}} Top {{n}} 排名"。
6. 使用 matplotlib/seaborn 绘图。
7. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
8. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "{{column_name}} 列 Top {{n}}: 第1名为 X (值)，第{{n}}名为 Y (值)",
  "columnsUsed": ["{{column_name}}"]
}
`,

    inputVariables: ['df_summary', 'column_name', 'n', 'ascending'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
