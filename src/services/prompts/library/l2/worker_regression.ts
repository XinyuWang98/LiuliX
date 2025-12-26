import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: OLS 多元线性回归
 * 量化各自变量对因变量的独立影响系数
 */
export const workerRegressionPrompt: UserPrompt = {
    id: 'worker-regression-v1',
    name: 'worker_regression',
    title: '多元回归分析',
    description: '使用 OLS 回归量化各因素对目标变量的独立影响幅度和显著性',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'causal', label: '归因' },
        { category: 'method', value: 'regression', label: '回归分析' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    executionMode: 'TEMPLATE_FILL',

    codeTemplate: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import statsmodels.api as sm
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

# 1. 数据准备
target_col = '{{target_col}}'
feature_cols = {{feature_cols}}

df_clean = df[feature_cols + [target_col]].dropna().copy()
y = df_clean[target_col]
X = df_clean[feature_cols]

# 处理分类变量 (One-Hot Encoding, drop_first 避免多重共线性)
X = pd.get_dummies(X, drop_first=True)
X = X.astype(float)

# 添加截距项
X = sm.add_constant(X)

# 2. 拟合 OLS 模型
model = sm.OLS(y, X).fit()

# 3. 可视化: 系数图 (Coefficient Plot)
params = model.params.drop('const', errors='ignore')
conf = model.conf_int().drop('const', errors='ignore')
conf.columns = ['Lower', 'Upper']
errors = params - conf['Lower']

fig, ax = plt.subplots(figsize=(10, max(len(params) * 0.5 + 2, 4)))
params.plot(kind='barh', xerr=errors, ax=ax, color='#3498db', alpha=0.7, capsize=4)
ax.axvline(x=0, color='red', linestyle='--', linewidth=1)
ax.set_title(f'因素对 {target_col} 的影响幅度 (95% CI)', fontsize=14)
ax.set_xlabel('系数 (Coefficient)')
ax.set_ylabel('特征')
plt.grid(axis='x', linestyle='--', alpha=0.5)
plt.tight_layout()

# 转 Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# 4. 结论生成
r_squared = model.rsquared
sig_params = model.pvalues[model.pvalues < 0.05].index.tolist()
sig_params = [p for p in sig_params if p != 'const']

if len(sig_params) > 0:
    impact_desc = '、'.join(sig_params[:3])
    summary = f"模型解释了 {r_squared:.1%} 的波动。{impact_desc} 对 {target_col} 有显著影响。"
else:
    summary = f"模型解释度为 {r_squared:.1%}，未发现统计显著的关键因素。"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
json.dumps(result)`,

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 进行多元线性回归分析。

# 数据集摘要
{{df_summary}}

# 目标变量
{{target_col}}

# 特征变量
{{feature_cols}}

# 要求
1. 使用 statsmodels 的 OLS 进行回归分析。
2. 处理分类变量 (One-Hot Encoding)。
3. 绘制系数图 (Coefficient Plot)，展示各特征的影响幅度和置信区间。
4. 计算 R-squared 并识别显著变量 (P < 0.05)。
5. **不要** 生成任何 plt.show()。
6. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "模型解释度为 X%，显著因素包括 Y、Z",
  "columnsUsed": ["{{target_col}}", ...]
}
`,

    inputVariables: ['target_col', 'feature_cols'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
