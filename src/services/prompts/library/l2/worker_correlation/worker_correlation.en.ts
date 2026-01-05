/**
 * Worker Correlation Prompt - English Version
 * L2 Prompt: Correlation Analysis
 */

import { UserPrompt } from '@/types/prompt';

export const workerCorrelationPrompt: UserPrompt = {
    id: 'worker-correlation-v1',
    name: 'worker_correlation',
    title: 'Correlation Analysis',
    description: 'Analyze correlation between two numeric variables, create scatter plot and calculate correlation coefficient',

    slug: 'worker-correlation-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas', 'seaborn'],
    outputCharts: ['scatter', 'heatmap'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'correlation', label: 'Correlation' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    executionMode: 'TEMPLATE_FILL',

    codeTemplate: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import seaborn as sns
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

x_col = {{x_column}}
y_col = {{y_column}}

# Extract numeric data
x_data = pd.to_numeric(df[x_col], errors='coerce')
y_data = pd.to_numeric(df[y_col], errors='coerce')

# Remove missing values
valid_mask = x_data.notna() & y_data.notna()
x_clean = x_data[valid_mask]
y_clean = y_data[valid_mask]

# Calculate correlation coefficient
corr_coef = x_clean.corr(y_clean)

# Create scatter plot
fig, ax = plt.subplots(figsize=(10, 6), dpi=72)
ax.scatter(x_clean, y_clean, alpha=0.6, color='#3498db')
ax.set_xlabel(x_col, fontsize=12)
ax.set_ylabel(y_col, fontsize=12)
ax.set_title(f'Correlation Analysis: {x_col} vs {y_col}\\n(r = {corr_coef:.3f})', fontsize=14)
ax.grid(alpha=0.3)

# Add regression line
z = np.polyfit(x_clean, y_clean, 1)
p = np.poly1d(z)
ax.plot(x_clean, p(x_clean), "r--", alpha=0.8, linewidth=2, label=f'Regression Line')
ax.legend()

plt.tight_layout()

# Convert to Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# Interpretation
if abs(corr_coef) > 0.7:
    strength = 'strong'
elif abs(corr_coef) > 0.4:
    strength = 'moderate'
else:
    strength = 'weak'

direction = 'positive' if corr_coef > 0 else 'negative'
summary = f"{x_col} and {y_col}: {strength} {direction} correlation (r={corr_coef:.3f})"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    template: `
You are a professional data analyst.
Please analyze the correlation between columns \`{{x_column}}\` and \`{{y_column}}\` in DataFrame \`df\`.

# Dataset Summary
{{df_summary}}

# Requirements
1. Confirm both columns are numeric type
2. Create visualizations:
   - Scatter plot showing relationship
   - Add regression line (best fit line)
   - Display correlation coefficient in title
3. Calculate metrics:
   - Pearson correlation coefficient
   - Spearman rank correlation (optional)
   - R-squared value (optional)
4. Interpret correlation strength:
   - Strong: |r| > 0.7
   - Moderate: 0.4 < |r| ≤ 0.7
   - Weak: |r| ≤ 0.4
5. Identify outliers if present
6. Use matplotlib/seaborn for plotting
7. **Do NOT** generate plt.show()
8. Return JSON format result

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "{{x_column}} and {{y_column}} show [strong/moderate/weak] [positive/negative] correlation (r=X.XX)",
  "columnsUsed": ["{{x_column}}", "{{y_column}}"]
}
`,

    inputVariables: ['x_column', 'y_column'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
