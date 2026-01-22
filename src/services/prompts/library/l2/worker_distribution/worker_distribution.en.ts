/**
 * Worker Distribution Prompt - English Version
 * L2 Prompt: Single Variable Distribution Analysis
 */

import { UserPrompt } from '@/types/prompt';

export const workerDistributionPrompt: UserPrompt = {
    id: 'worker-distribution-v1',
    name: 'worker_distribution',
    title: 'Distribution Analysis',
    description: 'Analyze single variable distribution characteristics, including histogram, density plot, and distribution metrics',

    slug: 'worker-distribution-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas', 'scipy', 'seaborn'],
    outputCharts: ['histogram', 'density', 'box'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'distribution', label: 'Distribution' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    executionMode: 'TEMPLATE_FILL',

    // 🆕 v2.3 Stats injection config
    statsInjection: {
        mean_value: 'mean',
        median_value: 'median',
        std_value: 'std'
    },

    codeTemplate: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import seaborn as sns
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

column_name = {{column_name}}
is_numeric = pd.api.types.is_numeric_dtype(df[column_name])

# Create different chart types based on data type
if is_numeric:
    col_data = pd.to_numeric(df[column_name], errors='coerce').dropna()
    
    # Dual view: Histogram + KDE
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5), dpi=72)
    
    # Histogram
    ax1.hist(col_data, bins=30, color='#3498db', alpha=0.7, edgecolor='black')
    ax1.set_title(f'{column_name} Distribution Histogram', fontsize=14)
    ax1.set_xlabel('Value')
    ax1.set_ylabel('Frequency')
    ax1.grid(axis='y', alpha=0.3)
    
    # KDE
    try:
        col_data.plot(kind='density', ax=ax2, color='#e74c3c', linewidth=2)
    except:
        ax2.text(0.5, 0.5, 'Not enough data for density plot', ha='center')
        
    ax2.set_title(f'{column_name} Density Plot', fontsize=14)
    ax2.set_xlabel('Value')
    ax2.set_ylabel('Density')
    ax2.grid(alpha=0.3)
    
    // Stats injected from DuckDB
    mean_val = {{mean_value}}
    median_val = {{median_value}}
    std_val = {{std_value}}
    skew_val = col_data.skew()
    skew_desc = 'right-skewed' if skew_val > 0.5 else ('left-skewed' if skew_val < -0.5 else 'symmetric')
    summary = f"{column_name}: mean={mean_val:.2f}, median={median_val:.2f}, std={std_val:.2f}, distribution is {skew_desc}"

else:
    # Categorical Data: Bar Chart
    top_n = df[column_name].value_counts().head(10)
    
    fig, ax = plt.subplots(figsize=(10, 6), dpi=72)
    top_n.plot(kind='bar', ax=ax, color='#3498db', alpha=0.8)
    
    ax.set_title(f'{column_name} Top 10 Distribution', fontsize=14)
    ax.set_xlabel('Category')
    ax.set_ylabel('Count')
    ax.grid(axis='y', alpha=0.3)
    plt.xticks(rotation=45)
    
    summary = f"{column_name}: {df[column_name].nunique()} unique categories, Top 1 accounts for {top_n.iloc[0]/len(df):.1%}"

plt.tight_layout()

# Convert to Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    template: `
You are a professional data analyst.
Please analyze the distribution characteristics of column \`{{column_name}}\` in DataFrame \`df\`.

# Dataset Summary
{{df_summary}}

# Requirements
1. Confirm {{column_name}} is numeric type
2. Create visualizations:
   - Histogram (with 20-30 bins)
   - Density plot (KDE)
   - Optional: Box plot showing outliers
3. Calculate distribution metrics:
   - Mean, Median, Mode
   - Standard deviation, Variance
   - Skewness, Kurtosis
   - Range (min to max)
4. Interpret distribution shape:
   - Normal/Symmetric
   - Right-skewed/Left-skewed
   - Presence of outliers
5. Use matplotlib/seaborn for plotting
6. **Do NOT** generate plt.show()
7. Return JSON format result

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "{{column_name}} column shows [normal/skewed] distribution, mean X, outliers detected: [yes/no]",
  "columnsUsed": ["{{column_name}}"]
}
`,

    inputVariables: ['column_name', 'mean_value', 'median_value', 'std_value'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
