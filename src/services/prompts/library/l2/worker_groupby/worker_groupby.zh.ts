import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 分组聚合分析
 * 按分类列分组，对数值列进行聚合，比较组间差异
 */
export const workerGroupbyPrompt: UserPrompt = {
    id: 'worker-groupby-v1',
    name: 'worker_groupby',
    title: '分组聚合分析',
    description: '按分类列分组，对数值列聚合（求和/均值/计数），比较不同组之间的差异',



    // 能力包配置 (v2.1)
    slug: 'worker-groupby-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas'],
    outputCharts: ['bar', 'line', 'box'],
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

    inputVariables: ['group_col', 'value_col', 'agg_func'],

    // 🆕 Router 模式
    executionMode: 'TEMPLATE_FILL',
    codeTemplate: `
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
import numpy as np
import io
import base64
import json

# 参数
group_col = {{group_col}}
value_col = {{value_col}}
agg_func = {{agg_func}}

# 检查列是否存在
if group_col not in df.columns or value_col not in df.columns:
    raise ValueError(f"列不存在: {group_col} 或 {value_col}")

# 分组聚合
agg_map = {
    'sum': 'sum',
    'mean': 'mean',
    'count': 'count',
    'median': 'median'
}
agg_method = agg_map.get(agg_func, 'sum')

grouped = df.groupby(group_col)[value_col].agg(agg_method).sort_values(ascending=False)

# 限制显示 Top 20，避免图表过大
TOP_N = 20
if len(grouped) > TOP_N:
    grouped_display = grouped.head(TOP_N)
    is_truncated = True
else:
    grouped_display = grouped
    is_truncated = False

# 绘制水平柱状图
fig_height = max(6, min(len(grouped_display) * 0.4, 20))  # 限制最大高度 20
fig, ax = plt.subplots(figsize=(10, fig_height), dpi=72)
grouped_display.plot(kind='barh', ax=ax, color='#3498db')
ax.set_xlabel(f'{value_col} ({agg_func})')
ax.set_ylabel(group_col)
title_suffix = f' (Top {TOP_N})' if is_truncated else ''
ax.set_title(f'{group_col} 分组下的 {value_col} {agg_func} 分析{title_suffix}', fontsize=14)
ax.invert_yaxis()  # 最大值在上
plt.tight_layout()

# 生成摘要
top_group = grouped.index[0]
top_value = grouped.iloc[0]
bottom_group = grouped.index[-1]
bottom_value = grouped.iloc[-1]
truncate_note = f'（共 {len(grouped)} 个分组，仅展示 Top {TOP_N}）' if is_truncated else ''
summary = f"{group_col} 共 {len(grouped)} 个分组，{value_col} 的 {agg_func} 最高为 {top_group} ({top_value:.2f})，最低为 {bottom_group} ({bottom_value:.2f}){truncate_note}"

# 输出结果（符合 modeExecutor 期望的格式）
buf = io.BytesIO()
fig.savefig(buf, format='png', bbox_inches='tight')
buf.seek(0)
image_base64 = base64.b64encode(buf.read()).decode('utf-8')
plt.close(fig)

result = {
    "image": image_base64,  # 只返回纯 Base64，不含前缀
    "summary": summary,
    "columnsUsed": [group_col, value_col]
}
print(json.dumps(result), flush=True)

`,

    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
