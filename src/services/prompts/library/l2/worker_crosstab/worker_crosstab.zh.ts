import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 交叉表分析
 * 两个分类列的共现频次分析，绘制热力图
 */
export const workerCrosstabPrompt: UserPrompt = {
    id: 'worker-crosstab-v1',
    name: 'worker_crosstab',
    title: '交叉表分析',
    description: '分析两个分类列的共现频次，绘制热力图展示交叉表',



    // 能力包配置 (v2.1)
    slug: 'worker-crosstab-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas'],
    outputCharts: ['bar', 'line', 'box'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'crosstab', label: '交叉分析' },
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

row_col = {{row_col}}
col_col = {{col_col}}

# 准备数据
df_copy = df.copy()
df_copy = df_copy.dropna(subset=[row_col, col_col])

# 生成交叉表
try:
    crosstab = pd.crosstab(df_copy[row_col], df_copy[col_col])

    # 绘制热力图
    fig, ax = plt.subplots(figsize=(10, 8), dpi=72)
    im = ax.imshow(crosstab, cmap='Blues', aspect='auto')

    # 设置轴标签
    ax.set_xticks(range(len(crosstab.columns)))
    ax.set_xticklabels([str(c) for c in crosstab.columns], rotation=45, ha='right')
    ax.set_yticks(range(len(crosstab.index)))
    ax.set_yticklabels([str(i) for i in crosstab.index])

    # 添加数值标注 (如果格子不太密)
    if len(crosstab.index) * len(crosstab.columns) < 100:
        for i in range(len(crosstab.index)):
            for j in range(len(crosstab.columns)):
                text = ax.text(j, i, crosstab.iloc[i, j],
                               ha="center", va="center", color="black" if crosstab.iloc[i, j] < crosstab.values.max()/2 else "white")

    ax.set_title(f'{row_col} vs {col_col} 交叉分析', fontsize=14)
    plt.colorbar(im, ax=ax)
    plt.tight_layout()

    # 转 Base64
    buffer = BytesIO()
    fig.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close(fig)

    # 生成摘要
    if not crosstab.empty:
        max_val = crosstab.values.max()
        max_idx = np.unravel_index(crosstab.values.argmax(), crosstab.shape)
        max_row = crosstab.index[max_idx[0]]
        max_col = crosstab.columns[max_idx[1]]
        summary = f"{row_col} 与 {col_col} 的交叉分析显示：最常见组合是 {max_row}-{max_col} (共 {max_val} 次)"
    else:
        summary = "交叉表为空"

    result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
except Exception as e:
    result = {"image": "", "summary": f"交叉分析失败: {str(e)}"}

print(json.dumps(result))`,

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 中的 \`{{row_col}}\` 和 \`{{col_col}}\` 两列进行交叉表分析。

# 数据集摘要
{{df_summary}}

# 要求
1. 确认 {{row_col}} 和 {{col_col}} 都是分类类型。
2. 使用 pandas.crosstab 生成交叉表。
3. 绘制热力图 (Heatmap)：
   - 行: {{row_col}} 的各类别
   - 列: {{col_col}} 的各类别
   - 颜色深浅: 频次高低
4. 在热力图上显示数值标注。
5. 标题: "{{row_col}} 与 {{col_col}} 交叉分析"。
6. 使用 matplotlib/seaborn 绘图。
7. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
8. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "{{row_col}} 与 {{col_col}} 的交叉分析显示：最常见组合是 A-B (X次)，最少见组合是 C-D (Y次)",
  "columnsUsed": ["{{row_col}}", "{{col_col}}"]
}
`,

    inputVariables: ['df_summary', 'row_col', 'col_col'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
