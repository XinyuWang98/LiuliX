import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 双变量相关性分析
 * 用于绘制散点图 (数值 vs 数值) 或 箱线图 (分类 vs 数值)
 */
export const workerCorrelationPrompt: UserPrompt = {
    id: 'worker-correlation-v1',
    name: 'worker_correlation',
    title: '双变量相关性分析',
    description: '分析两个变量之间的关系（线性相关、聚类模式、分布差异）',

    // 能力包配置 (v2.1)
    slug: 'worker-correlation-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas', 'seaborn'],
    outputCharts: ['scatter', 'box', 'heatmap'],

    layer: 'L2_EXECUTION',

    // 四维矩阵标签
    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'causal', label: '归因/关系' },
        { category: 'method', value: 'statistics', label: '相关性' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    // ✅ Router 模式
    executionMode: 'TEMPLATE_FILL',

    // 预置 Python 代码模板（与英文版一致，使用 seaborn）
    codeTemplate: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import seaborn as sns
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

col_x = {{col_x}}
col_y = {{col_y}}

# 提取数据并转换为数值类型
x_data = pd.to_numeric(df[col_x], errors='coerce')
y_data = pd.to_numeric(df[col_y], errors='coerce')

# 移除缺失值
valid_mask = x_data.notna() & y_data.notna()
x_clean = x_data[valid_mask]
y_clean = y_data[valid_mask]

# 计算相关系数
corr_coef = x_clean.corr(y_clean)

# 创建散点图
fig, ax = plt.subplots(figsize=(10, 6), dpi=72)
ax.scatter(x_clean, y_clean, alpha=0.6, color='#3498db')
ax.set_xlabel(col_x, fontsize=12)
ax.set_ylabel(col_y, fontsize=12)
ax.set_title(f'相关性分析: {col_x} vs {col_y}\\n(r = {corr_coef:.3f})', fontsize=14)
ax.grid(alpha=0.3)

# 添加回归线
z = np.polyfit(x_clean, y_clean, 1)
p = np.poly1d(z)
ax.plot(x_clean, p(x_clean), "r--", alpha=0.8, linewidth=2, label='回归线')
ax.legend()

plt.tight_layout()

# 转 Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# 相关性强度解释
if abs(corr_coef) > 0.7:
    strength = '强'
elif abs(corr_coef) > 0.4:
    strength = '中等'
else:
    strength = '弱'

direction = '正' if corr_coef > 0 else '负'
summary = f"{col_x} 与 {col_y}: {strength}{direction}相关 (r={corr_coef:.3f})"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    // 旧版 AI Prompt (保留兼容)
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

    inputVariables: ['col_x', 'col_y'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
