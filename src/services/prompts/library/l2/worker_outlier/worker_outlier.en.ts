/**
 * Worker Outlier Prompt - English Version
 * L2 Prompt: Outlier Detection
 */

import { UserPrompt } from '@/types/prompt';

export const workerOutlierPrompt: UserPrompt = {
    id: 'worker-outlier-v1',
    name: 'worker_outlier',
    title: 'Outlier Detection',
    description: 'Detect and visualize outliers in numeric columns using statistical methods (IQR, Z-score)',

    slug: 'worker-outlier-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas'],
    outputCharts: ['box', 'scatter'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'statistics', label: 'Outlier Detection' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    executionMode: 'TEMPLATE_FILL',

    // 🆕 v2.3 Stats injection config
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

# IQR method (stats from DuckDB)
Q1 = {{q1_value}}
Q3 = {{q3_value}}
IQR = {{iqr_value}}
lower_bound = Q1 - 1.5 * IQR
upper_bound = Q3 + 1.5 * IQR

outliers = col_data[(col_data < lower_bound) | (col_data > upper_bound)]
outlier_count = len(outliers)
outlier_percentage = (outlier_count / len(col_data)) * 100

# Create visualization: box plot + scatter plot
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), dpi=72)

# Box plot
bp = ax1.boxplot(col_data, vert=False, patch_artist=True)
bp['boxes'][0].set_facecolor('#3498db')
bp['boxes'][0].set_alpha(0.7)
ax1.set_xlabel(column_name)
ax1.set_title(f'{column_name} Box Plot (IQR Method)', fontsize=14)
ax1.axvline(lower_bound, color='r', linestyle='--', label=f'Lower Bound ({lower_bound:.2f})')
ax1.axvline(upper_bound, color='r', linestyle='--', label=f'Upper Bound ({upper_bound:.2f})')
ax1.legend()
ax1.grid(alpha=0.3)

# Scatter plot with outliers highlighted
indices = np.arange(len(col_data))
is_outlier = (col_data < lower_bound) | (col_data > upper_bound)
ax2.scatter(indices[~is_outlier], col_data[~is_outlier], alpha=0.6, color='#3498db', label='Normal')
ax2.scatter(indices[is_outlier], col_data[is_outlier], alpha=0.8, color='#e74c3c', s=100, label='Outliers')
ax2.axhline(lower_bound, color='r', linestyle='--', linewidth=1)
ax2.axhline(upper_bound, color='r', linestyle='--', linewidth=1)
ax2.set_xlabel('Index')
ax2.set_ylabel(column_name)
ax2.set_title(f'{column_name} Outlier Detection', fontsize=14)
ax2.legend()
ax2.grid(alpha=0.3)

plt.tight_layout()

# Convert to Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# Generate summary
summary = f"{column_name}: detected {outlier_count} outliers ({outlier_percentage:.1f}%), range=[{lower_bound:.2f}, {upper_bound:.2f}]"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    template: `
You are a professional data analyst.
Please detect outliers in column \`{{column_name}}\` in DataFrame \`df\`.

# Dataset Summary
{{df_summary}}

# Requirements
1. Confirm {{column_name}} is numeric type
2. Use IQR (Interquartile Range) method:
   - Calculate Q1 (25th percentile) and Q3 (75th percentile)
   - IQR = Q3 - Q1
   - Lower bound = Q1 - 1.5*IQR
   - Upper bound = Q3 + 1.5*IQR
   - Values outside [lower_bound, upper_bound] are outliers
3. Optional: Also use Z-score method (|z| > 3)
4. Create visualizations:
   - Box plot showing IQR and outliers
   - Scatter plot highlighting outliers in red
5. Report:
   - Number of outliers detected
   - Percentage of outliers
   - Outlier values (if count < 20)
6. Title: "{{column_name}} Outlier Detection (IQR Method)"
7. Use matplotlib/seaborn for plotting
8. **Do NOT** generate plt.show()
9. Return JSON format result

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "{{column_name}}: detected X outliers (Y%), outside range [A, B]",
  "columnsUsed": ["{{column_name}}"]
}
`,

    inputVariables: ['column_name', 'q1_value', 'q3_value', 'iqr_value'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
