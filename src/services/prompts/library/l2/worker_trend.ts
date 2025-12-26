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

date_col = '{{date_col}}'
value_col = '{{value_col}}'

# 准备数据
df_copy = df.copy()
df_copy[date_col] = pd.to_datetime(df_copy[date_col], errors='coerce')
df_copy = df_copy.dropna(subset=[date_col, value_col])
df_copy = df_copy.sort_values(date_col)

x_dates = df_copy[date_col]
y_values = pd.to_numeric(df_copy[value_col], errors='coerce')

# 绘制趋势图
fig, ax = plt.subplots(figsize=(12, 6), dpi=72)
ax.plot(x_dates, y_values, 'b-', alpha=0.6, label=value_col)

# 添加移动平均
window = min(7, len(y_values) // 5) if len(y_values) > 10 else 3
if window > 1:
    ma = y_values.rolling(window=window).mean()
    ax.plot(x_dates, ma, 'r-', linewidth=2, label=f'{window}日移动平均')

ax.set_title(f'{value_col} 随时间的变化趋势', fontsize=14)
ax.set_xlabel(date_col)
ax.set_ylabel(value_col)
ax.legend()
plt.xticks(rotation=45, ha='right')
plt.tight_layout()

# 计算趋势方向
from scipy import stats
x_numeric = np.arange(len(y_values))
slope, _, r_value, _, _ = stats.linregress(x_numeric, y_values.values)
trend_desc = '上升' if slope > 0.01 else ('下降' if slope < -0.01 else '平稳')

# 转 Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

summary = f"{value_col} 呈{trend_desc}趋势 (斜率={slope:.4f}), 最高值={y_values.max():.2f}, 最低值={y_values.min():.2f}"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
json.dumps(result)`,

    // 旧版 AI Prompt (保留兼容)
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

    inputVariables: ['date_col', 'value_col'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
