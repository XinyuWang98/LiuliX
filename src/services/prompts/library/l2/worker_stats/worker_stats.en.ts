/**
 * Worker Stats Prompt - English Version
 * L2 Prompt: Descriptive Statistics
 */

import { UserPrompt } from '@/types/prompt';

export const workerStatsPrompt: UserPrompt = {
    id: 'worker-stats-v1',
    name: 'worker_stats',
    title: 'Descriptive Statistics',
    description: 'Calculate mean, median, std, min, max, quartiles and other statistical metrics for numeric columns',

    // Package configuration (v2.1)
    slug: 'worker-stats-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas'],
    outputCharts: ['bar', 'line', 'box'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'statistics', label: 'Descriptive Stats' },
        { category: 'output', value: 'table', label: 'Table' }
    ],

    // Router mode
    executionMode: 'TEMPLATE_FILL',

    // Preset Python code template
    codeTemplate: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

column_name = {{column_name}}
col_data = pd.to_numeric(df[column_name], errors='coerce').dropna()

# Calculate statistics
stats_dict = {
    'Count': len(col_data),
    'Mean': col_data.mean(),
    'Std': col_data.std(),
    'Min': col_data.min(),
    'Q1': col_data.quantile(0.25),
    'Median': col_data.median(),
    'Q3': col_data.quantile(0.75),
    'Max': col_data.max(),
    'Skewness': col_data.skew(),
    'Kurtosis': col_data.kurtosis()
}

# Visualize statistics
fig, ax = plt.subplots(figsize=(10, 6), dpi=72)
keys = ['Mean', 'Median', 'Std', 'Q1', 'Q3']
values = [stats_dict[k] for k in keys]
ax.bar(keys, values, color='#3498db')
ax.set_title(f'{column_name} Statistical Summary', fontsize=14)
ax.set_ylabel('Value')

# Add value labels
for i, v in enumerate(values):
    ax.text(i, v + 0.05 * max(values), f'{v:.2f}', ha='center', fontsize=10)

plt.tight_layout()

# Convert to Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# Generate summary
skew_desc = 'right-skewed' if stats_dict['Skewness'] > 0.5 else ('left-skewed' if stats_dict['Skewness'] < -0.5 else 'symmetric')
summary = f"{column_name}: mean={stats_dict['Mean']:.2f}, median={stats_dict['Median']:.2f}, std={stats_dict['Std']:.2f}, distribution is {skew_desc}"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    // Legacy AI Prompt (compatibility)
    template: `
You are a professional Python data analyst.
Please perform descriptive statistical analysis on column \`{{column_name}}\` in DataFrame \`df\`.

# Dataset Summary
{{df_summary}}

# Requirements
1. Confirm {{column_name}} is numeric type.
2. Calculate the following metrics:
   - count
   - mean
   - std (standard deviation)
   - min
   - Q1 (25th percentile)
   - median (50th percentile)
   - Q3 (75th percentile)
   - max
   - skewness
   - kurtosis
3. Format results as a DataFrame table.
4. Create a simple visualization (e.g., bar chart showing metrics).
5. Use matplotlib/seaborn for plotting.
6. **Do NOT** generate any plt.show(), keep figure object in memory.
7. Return JSON format result.

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "{{column_name}} column: mean X, median Y, std Z, distribution is [normal/left-skewed/right-skewed]",
  "columnsUsed": ["{{column_name}}"]
}
`,

    inputVariables: ['column_name'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
