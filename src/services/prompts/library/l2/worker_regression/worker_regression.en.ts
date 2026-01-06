/**
 * Worker Regression Prompt - English Version
 * L2 Prompt: OLS Multiple Linear Regression
 */

import { UserPrompt } from '@/types/prompt';

export const workerRegressionPrompt: UserPrompt = {
    id: 'worker-regression-v1',
    name: 'worker_regression',
    title: 'Regression Analysis',
    description: 'Use OLS regression to quantify independent effects of each factor on target variable',

    // Capability package config (v2.1)
    slug: 'worker-regression-v1',
    packageId: 'statsmodels',
    requiredPackages: ['matplotlib', 'numpy', 'pandas', 'statsmodels'],
    outputCharts: ['bar'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'causal', label: 'Causal' },
        { category: 'method', value: 'regression', label: 'Regression' },
        { category: 'output', value: 'chart', label: 'Chart' }
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

# 1. Data preparation
target_col = {{target_col}}
feature_cols = {{feature_cols}}

df_clean = df[feature_cols + [target_col]].dropna().copy()
y = df_clean[target_col]
X = df_clean[feature_cols]

# Handle categorical variables (One-Hot Encoding, drop_first to avoid multicollinearity)
X = pd.get_dummies(X, drop_first=True)
X = X.astype(float)

# Add intercept
X = sm.add_constant(X)

# 2. Fit OLS model
model = sm.OLS(y, X).fit()

# 3. Visualization: Coefficient Plot
params = model.params.drop('const', errors='ignore')
conf = model.conf_int().drop('const', errors='ignore')
conf.columns = ['Lower', 'Upper']
errors = params - conf['Lower']

fig, ax = plt.subplots(figsize=(10, max(len(params) * 0.5 + 2, 4)))
params.plot(kind='barh', xerr=errors, ax=ax, color='#3498db', alpha=0.7, capsize=4)
ax.axvline(x=0, color='red', linestyle='--', linewidth=1)
ax.set_title(f'Factor Impact on {target_col} (95% CI)', fontsize=14)
ax.set_xlabel('Coefficient')
ax.set_ylabel('Feature')
plt.grid(axis='x', linestyle='--', alpha=0.5)
plt.tight_layout()

# Convert to Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# 4. Generate summary
r_squared = model.rsquared
sig_params = model.pvalues[model.pvalues < 0.05].index.tolist()
sig_params = [p for p in sig_params if p != 'const']

if len(sig_params) > 0:
    impact_desc = ', '.join(sig_params[:3])
    summary = f"Model explains {r_squared:.1%} of variance. {impact_desc} significantly affect {target_col}."
else:
    summary = f"Model R-squared is {r_squared:.1%}, no statistically significant factors found."

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    template: `
You are a professional Python data analyst.
Please perform multiple linear regression analysis on DataFrame \`df\`.

# Dataset Summary
{{df_summary}}

# Target Variable
{{target_col}}

# Feature Variables
{{feature_cols}}

# Requirements
1. Use statsmodels OLS for regression analysis.
2. Handle categorical variables (One-Hot Encoding).
3. Draw coefficient plot showing impact magnitude and confidence intervals.
4. Calculate R-squared and identify significant variables (P < 0.05).
5. **Do NOT** generate plt.show().
6. Return JSON format result.

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "Model explains X% variance, significant factors include Y, Z",
  "columnsUsed": ["{{target_col}}", ...]
}
`,

    inputVariables: ['target_col', 'feature_cols'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
