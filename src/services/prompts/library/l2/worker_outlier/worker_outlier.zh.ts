import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 异常值检测
 * 检测数值列的异常值/离群点，使用 IQR 或 Z-score 方法
 */
export const workerOutlierPrompt: UserPrompt = {
    id: 'worker-outlier-v1',
    name: 'worker_outlier',
    title: '异常值检测',
    description: '检测数值列中的异常值/离群点（基于IQR或Z-score方法），识别极端值',

    // 能力包配置 (v2.1)
    slug: 'worker-outlier-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas'],
    outputCharts: ['box', 'scatter'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'outlier', label: '异常检测' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    executionMode: 'TEMPLATE_FILL',

    // 🆕 v2.3 统计值注入配置
    statsInjection: {
        q1_value: 'q1',
        q3_value: 'q3',
        iqr_value: 'iqr'
    },

    codeTemplate: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

column_name = {{column_name}}
col_data = pd.to_numeric(df[column_name], errors='coerce').dropna()

# IQR 方法检测异常值（统计值从 DuckDB 注入）
Q1 = {{q1_value}}
Q3 = {{q3_value}}
IQR = {{iqr_value}}
lower_bound = Q1 - 1.5 * IQR
upper_bound = Q3 + 1.5 * IQR

outliers = col_data[(col_data < lower_bound) | (col_data > upper_bound)]
outlier_count = len(outliers)
outlier_percentage = (outlier_count / len(col_data)) * 100

# 可视化：箱线图 + 散点图
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), dpi=72)

# 箱线图
bp = ax1.boxplot(col_data, vert=False, patch_artist=True)
bp['boxes'][0].set_facecolor('#3498db')
bp['boxes'][0].set_alpha(0.7)
ax1.set_xlabel(column_name)
ax1.set_title(f'{column_name} 箱线图 (IQR 方法)', fontsize=14)
ax1.axvline(lower_bound, color='r', linestyle='--', label=f'下界 ({lower_bound:.2f})')
ax1.axvline(upper_bound, color='r', linestyle='--', label=f'上界 ({upper_bound:.2f})')
ax1.legend()
ax1.grid(alpha=0.3)

# 散点图标注异常值
indices = np.arange(len(col_data))
is_outlier = (col_data < lower_bound) | (col_data > upper_bound)
ax2.scatter(indices[~is_outlier], col_data[~is_outlier], alpha=0.6, color='#3498db', label='正常值')
ax2.scatter(indices[is_outlier], col_data[is_outlier], alpha=0.8, color='#e74c3c', s=100, label='异常值')
ax2.axhline(lower_bound, color='r', linestyle='--', linewidth=1)
ax2.axhline(upper_bound, color='r', linestyle='--', linewidth=1)
ax2.set_xlabel('索引')
ax2.set_ylabel(column_name)
ax2.set_title(f'{column_name} 异常值检测', fontsize=14)
ax2.legend()
ax2.grid(alpha=0.3)

plt.tight_layout()

# 转 Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# 生成摘要
summary = f"{column_name}: 检测到 {outlier_count} 个异常值 ({outlier_percentage:.1f}%)，正常范围=[{lower_bound:.2f}, {upper_bound:.2f}]"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

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

    inputVariables: ['column_name', 'q1_value', 'q3_value', 'iqr_value'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
