/**
 * Worker Crosstab Prompt - English Version
 * L2 Prompt: Crosstab Analysis
 */

import { UserPrompt } from '@/types/prompt';

export const workerCrosstabPrompt: UserPrompt = {
    id: 'worker-crosstab-v1',
    name: 'worker_crosstab',
    title: 'Crosstab Analysis',
    description: 'Analyze co-occurrence frequency of two categorical columns, display with heatmap',

    // Capability package config (v2.1)
    slug: 'worker-crosstab-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas'],
    outputCharts: ['heatmap'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'crosstab', label: 'Crosstab' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    // ✅ Router mode
    executionMode: 'TEMPLATE_FILL',

    // Python code template
    codeTemplate: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

row_col = {{row_col}}
col_col = {{col_col}}

# Prepare data
df_copy = df.copy()
df_copy = df_copy.dropna(subset=[row_col, col_col])

# Generate crosstab
try:
    crosstab = pd.crosstab(df_copy[row_col], df_copy[col_col])

    # Draw heatmap
    fig, ax = plt.subplots(figsize=(10, 8), dpi=72)
    im = ax.imshow(crosstab, cmap='Blues', aspect='auto')

    # Set axis labels
    ax.set_xticks(range(len(crosstab.columns)))
    ax.set_xticklabels([str(c) for c in crosstab.columns], rotation=45, ha='right')
    ax.set_yticks(range(len(crosstab.index)))
    ax.set_yticklabels([str(i) for i in crosstab.index])

    # Add value annotations (if grid is not too dense)
    if len(crosstab.index) * len(crosstab.columns) < 100:
        for i in range(len(crosstab.index)):
            for j in range(len(crosstab.columns)):
                text = ax.text(j, i, crosstab.iloc[i, j],
                               ha="center", va="center", color="black" if crosstab.iloc[i, j] < crosstab.values.max()/2 else "white")

    ax.set_title(f'{row_col} vs {col_col} Crosstab Analysis', fontsize=14)
    plt.colorbar(im, ax=ax)
    plt.tight_layout()

    # Convert to Base64
    buffer = BytesIO()
    fig.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close(fig)

    # Generate summary
    if not crosstab.empty:
        max_val = crosstab.values.max()
        max_idx = np.unravel_index(crosstab.values.argmax(), crosstab.shape)
        max_row = crosstab.index[max_idx[0]]
        max_col = crosstab.columns[max_idx[1]]
        summary = f"Crosstab analysis of {row_col} and {col_col}: most frequent combination is {max_row}-{max_col} ({max_val} occurrences)"
    else:
        summary = "Crosstab is empty"

    result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
except Exception as e:
    result = {"image": "", "summary": f"Crosstab analysis failed: {str(e)}"}

print(json.dumps(result))`,

    template: `
You are a professional Python data analyst.
Please perform crosstab analysis on columns \`{{row_col}}\` and \`{{col_col}}\` in DataFrame \`df\`.

# Dataset Summary
{{df_summary}}

# Requirements
1. Confirm {{row_col}} and {{col_col}} are categorical types.
2. Use pandas.crosstab to generate cross-tabulation.
3. Draw a heatmap:
   - Rows: categories of {{row_col}}
   - Columns: categories of {{col_col}}
   - Color intensity: frequency
4. Add value annotations on the heatmap.
5. Title: "{{row_col}} vs {{col_col}} Crosstab Analysis".
6. Use matplotlib/seaborn for plotting.
7. **Do NOT** generate plt.show().
8. Return JSON format result.

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "Crosstab analysis shows: most frequent combination is A-B (X times), least frequent is C-D (Y times)",
  "columnsUsed": ["{{row_col}}", "{{col_col}}"]
}
`,

    inputVariables: ['df_summary', 'row_col', 'col_col'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
