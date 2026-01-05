/**
 * Worker Group By Prompt - English Version
 * L2 Prompt: Group Aggregation Analysis
 */

import { UserPrompt } from '@/types/prompt';

export const workerGroupbyPrompt: UserPrompt = {
    id: 'worker-groupby-v1',
    name: 'worker_groupby',
    title: 'Group Aggregation',
    description: 'Group by categorical column and aggregate numeric column (sum/mean/count), compare differences between groups',

    slug: 'worker-groupby-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas'],
    outputCharts: ['bar', 'line', 'box'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'aggregation', label: 'Aggregation' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    executionMode: 'TEMPLATE_FILL',

    codeTemplate: `import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
import numpy as np
import io
import base64
import json

# Parameters
group_col = {{group_col}}
value_col = {{value_col}}
agg_func = {{agg_func}}

# Check if columns exist
if group_col not in df.columns or value_col not in df.columns:
    raise ValueError(f"Column not found: {group_col} or {value_col}")

# Group and aggregate
agg_map = {
    'sum': 'sum',
    'mean': 'mean',
    'count': 'count',
    'median': 'median'
}
agg_method = agg_map.get(agg_func, 'sum')

grouped = df.groupby(group_col)[value_col].agg(agg_method).sort_values(ascending=False)

# Limit to Top 20 to avoid oversized charts
TOP_N = 20
if len(grouped) > TOP_N:
    grouped_display = grouped.head(TOP_N)
    is_truncated = True
else:
    grouped_display = grouped
    is_truncated = False

# Plot horizontal bar chart
fig_height = max(6, min(len(grouped_display) * 0.4, 20))
fig, ax = plt.subplots(figsize=(10, fig_height), dpi=72)
grouped_display.plot(kind='barh', ax=ax, color='#3498db')
ax.set_xlabel(f'{value_col} ({agg_func})')
ax.set_ylabel(group_col)
title_suffix = f' (Top {TOP_N})' if is_truncated else ''
ax.set_title(f'{value_col} by {group_col} ({agg_func}){title_suffix}', fontsize=14)
ax.invert_yaxis()  # Highest on top
plt.tight_layout()

# Generate summary
top_group = grouped.index[0]
top_value = grouped.iloc[0]
bottom_group = grouped.index[-1]
bottom_value = grouped.iloc[-1]
truncate_note = f' ({len(grouped)} groups total, showing Top {TOP_N})' if is_truncated else ''
summary = f"{group_col}: {len(grouped)} groups, {value_col} {agg_func} highest={top_group} ({top_value:.2f}), lowest={bottom_group} ({bottom_value:.2f}){truncate_note}"

# Output result
buf = io.BytesIO()
fig.savefig(buf, format='png', bbox_inches='tight')
buf.seek(0)
image_base64 = base64.b64encode(buf.read()).decode('utf-8')
plt.close(fig)

result = {
    "image": image_base64,
    "summary": summary,
    "columnsUsed": [group_col, value_col]
}
print(json.dumps(result), flush=True)
`,

    template: `
You are a professional data analyst.
Please group DataFrame \`df\` by \`{{group_col}}\` and aggregate \`{{value_col}}\` using \`{{agg_func}}\`.

# Dataset Summary
{{df_summary}}

# Requirements
1. Confirm {{group_col}} is categorical and {{value_col}} is numeric
2. Use pandas groupby for aggregation
3. Aggregation function based on {{agg_func}}:
   - "sum": Sum
   - "mean": Average
   - "count": Count
   - "median": Median
4. Sort results by aggregated values (descending)
5. Create horizontal bar chart showing aggregated values per group
6. If more than 20 groups, show Top 20 only
7. Title: "{{value_col}} by {{group_col}} ({{agg_func}})"
8. Use matplotlib/seaborn for plotting
9. **Do NOT** generate plt.show()
10. Return JSON format result

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "{{group_col}}: X groups total, {{value_col}} {{agg_func}} highest=Group A (value), lowest=Group B (value)",
  "columnsUsed": ["{{group_col}}", "{{value_col}}"]
}
`,

    inputVariables: ['group_col', 'value_col', 'agg_func'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
