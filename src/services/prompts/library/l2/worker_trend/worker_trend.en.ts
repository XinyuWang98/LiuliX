/**
 * Worker Trend Prompt - English Version
 * L2 Prompt: Time Series Trend Analysis
 */

import { UserPrompt } from '@/types/prompt';

export const workerTrendPrompt: UserPrompt = {
    id: 'worker-trend-v1',
    name: 'worker_trend',
    title: 'Trend Analysis',
    description: 'Analyze how numeric values change over time, identify periodicity, seasonality and change points',

    slug: 'worker-trend-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas', 'scipy'],
    outputCharts: ['line', 'box'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'timeseries', label: 'Time Series' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    executionMode: 'TEMPLATE_FILL',

    codeTemplate: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

date_col = {{date_col}}
value_col = {{value_col}}

# Prepare data
df_copy = df.copy()
df_copy[date_col] = pd.to_datetime(df_copy[date_col], errors='coerce')
df_copy = df_copy.dropna(subset=[date_col, value_col])
df_copy = df_copy.sort_values(date_col)

x_dates = df_copy[date_col]
y_values = pd.to_numeric(df_copy[value_col], errors='coerce')

# Plot trend
fig, ax = plt.subplots(figsize=(12, 6), dpi=72)
ax.plot(x_dates, y_values, 'b-', alpha=0.6, label=value_col)

# Add moving average
window = min(7, len(y_values) // 5) if len(y_values) > 10 else 3
if window > 1:
    ma = y_values.rolling(window=window).mean()
    ax.plot(x_dates, ma, 'r-', linewidth=2, label=f'{window}-day Moving Average')

ax.set_title(f'{value_col} Trend Over Time', fontsize=14)
ax.set_xlabel(date_col)
ax.set_ylabel(value_col)
ax.legend()
plt.xticks(rotation=45, ha='right')
plt.tight_layout()

# Calculate trend direction
from scipy import stats
x_numeric = np.arange(len(y_values))
slope, _, r_value, _, _ = stats.linregress(x_numeric, y_values.values)
trend_desc = 'upward' if slope > 0.01 else ('downward' if slope < -0.01 else 'stable')

# Convert to Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

summary = f"{value_col} shows {trend_desc} trend (slope={slope:.4f}), peak={y_values.max():.2f}, trough={y_values.min():.2f}"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    template: `
You are a professional data analyst.
Please analyze the trend of \`{{value_col}}\` over time column \`{{date_col}}\` in DataFrame \`df\`.

# Dataset Summary
{{df_summary}}

# Requirements
1. Confirm {{date_col}} is date/time type and {{value_col}} is numeric
2. Sort data by {{date_col}}
3. Create line chart showing trend over time
4. Add moving average line (7-day or appropriate window) to smooth trend
5. Calculate overall trend direction:
   - Use linear regression slope to determine upward/downward/stable
6. Optionally identify:
   - Seasonal patterns
   - Outliers or anomalies
   - Change points
7. Title: "{{value_col}} Trend Over Time"
8. Use matplotlib/seaborn for plotting
9. **Do NOT** generate plt.show()
10. Return JSON format result

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "{{value_col}} shows [upward/downward/stable] trend during the period, peak at X, trough at Y",
  "columnsUsed": ["{{date_col}}", "{{value_col}}"]
}
`,

    inputVariables: ['date_col', 'value_col'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
