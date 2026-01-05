import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 描述性统计
 * 计算数值列的基础统计指标
 */
export const workerStatsPrompt: UserPrompt = {
    id: 'worker-stats-v1',
    name: 'worker_stats',
    title: '描述性统计',
    description: '计算数值列的均值、中位数、标准差、最大最小值、四分位数等统计指标',



    // 能力包配置 (v2.1)
    slug: 'worker-stats-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas'],
    outputCharts: ['bar', 'line', 'box'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'statistics', label: '描述统计' },
        { category: 'output', value: 'table', label: '表格' }
    ],

    // ✅ Router 模式
    executionMode: 'TEMPLATE_FILL',

    // 预置 Python 代码模板
    codeTemplate: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

column_name = {{column_name}}
col_data = pd.to_numeric(df[column_name], errors='coerce').dropna()

# 计算统计指标
stats_dict = {
    '计数': len(col_data),
    '均值': col_data.mean(),
    '标准差': col_data.std(),
    '最小值': col_data.min(),
    'Q1': col_data.quantile(0.25),
    '中位数': col_data.median(),
    'Q3': col_data.quantile(0.75),
    '最大值': col_data.max(),
    '偏度': col_data.skew(),
    '峰度': col_data.kurtosis()
}

# 可视化统计指标
fig, ax = plt.subplots(figsize=(10, 6), dpi=72)
keys = ['均值', '中位数', '标准差', 'Q1', 'Q3']
values = [stats_dict[k] for k in keys]
ax.bar(keys, values, color='#3498db')
ax.set_title(f'{column_name} 统计摘要', fontsize=14)
ax.set_ylabel('数值')

# 添加数值标签
for i, v in enumerate(values):
    ax.text(i, v + 0.05 * max(values), f'{v:.2f}', ha='center', fontsize=10)

plt.tight_layout()

# 转 Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# 生成摘要
skew_desc = '右偏' if stats_dict['偏度'] > 0.5 else ('左偏' if stats_dict['偏度'] < -0.5 else '对称')
summary = f"{column_name}: 均值={stats_dict['均值']:.2f}, 中位数={stats_dict['中位数']:.2f}, 标准差={stats_dict['标准差']:.2f}, 分布{skew_desc}"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    // 旧版 AI Prompt (保留兼容)
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

    inputVariables: ['column_name'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
