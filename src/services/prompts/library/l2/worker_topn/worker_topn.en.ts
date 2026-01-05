/**
 * Worker Top N Prompt - English Version
 * L2 Prompt: Top N Ranking
 */

import { UserPrompt } from '@/types/prompt';

export const workerTopnPrompt: UserPrompt = {
    id: 'worker-topn-v1',
    name: 'worker_topn',
    title: 'Top N Ranking',
    description: 'Find top N records with highest or lowest values in a numeric column, display ranking chart',

    slug: 'worker-topn-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'pandas'],
    outputCharts: ['bar', 'line'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'ranking', label: 'Ranking' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    executionMode: 'TEMPLATE_FILL',

    codeTemplate: `import pandas as pd
import matplotlib.pyplot as plt
import io
import base64
import json

def analyze(df):
    try:
        # Extract parameters
        column_name = {{column_name}}
        n = int('{{n}}')
        topn = {{topn}}
        # Handle boolean string (JS true -> Python True)
        ascending_param = str({{ascending}}).lower()
        ascending = True if ascending_param == 'true' else False

        # 1. Data preparation
        df_clean = df.copy()
        
        # Convert to numeric, handle non-numeric values
        df_clean[column_name] = pd.to_numeric(df_clean[column_name], errors='coerce')
        df_clean = df_clean.dropna(subset=[column_name])
        
        if df_clean.empty:
            return json.dumps({
                "error": f"Column {column_name} has no valid numeric data"
            })

        # 2. Core calculation (Top N)
        top_n_df = df_clean.sort_values(by=column_name, ascending=ascending).head(n)
        
        # Reverse order for barh plot (largest/smallest on top)
        plot_df = top_n_df.iloc[::-1]

        # 3. Visualization
        plt.figure(figsize=(10, 6))
        # Find suitable label column (non-numeric)
        label_col = plot_df.select_dtypes(include=['object', 'category']).columns
        if len(label_col) > 0:
            y_labels = plot_df[label_col[0]]
            y_col_name = label_col[0]
        else:
            y_labels = plot_df.index
            y_col_name = "Index"

        bars = plt.barh(range(len(plot_df)), plot_df[column_name], color='#4e79a7')
        plt.yticks(range(len(plot_df)), y_labels)
        
        title_suffix = "Smallest" if ascending else "Largest"
        plt.title(f"{column_name} Top {n} ({title_suffix})")
        plt.xlabel(column_name)
        plt.ylabel(y_col_name)
        plt.grid(axis='x', linestyle='--', alpha=0.7)
        plt.tight_layout()

        # Save chart
        img_buf = io.BytesIO()
        plt.savefig(img_buf, format='png')
        img_buf.seek(0)
        img_base64 = base64.b64encode(img_buf.read()).decode('utf-8')
        plt.close()

        # 4. Generate summary
        first_val = top_n_df.iloc[0][column_name]
        last_val = top_n_df.iloc[-1][column_name]
        direction_str = "smallest" if ascending else "largest"
        summary = f"{column_name} top {n} {direction_str} records. Range from {first_val} to {last_val}."

        # 5. Return result
        result = {
            "code": "",
            "summary": summary,
            "columnsUsed": [column_name],
            "image": img_base64
        }
        return json.dumps(result)

    except Exception as e:
        return json.dumps({"error": str(e)})

# Execute analysis
print(analyze(df))
`,

    template: `
You are a professional data analyst.
Please find the top {{n}} records with {{#if ascending}}smallest{{else}}largest{{/if}} values in column \`{{column_name}}\` from DataFrame \`df\`.

# Dataset Summary
{{df_summary}}

# Parameters
- Column: {{column_name}}
- Count: {{n}}
- Sort direction: {{ascending}} (true=ascending/smallest, false=descending/largest)

# Requirements
1. Confirm {{column_name}} is numeric type
2. Sort by ascending parameter:
   - ascending=true: Find smallest N values
   - ascending=false: Find largest N values
3. Create horizontal bar chart showing ranking
4. Sort bars by rank (largest/smallest on top)
5. Title: "{{column_name}} Top {{n}} Ranking"
6. Use matplotlib/seaborn for plotting
7. **Do NOT** generate plt.show()
8. Return JSON format result

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "{{column_name}} Top {{n}}: #1 is X (value), #{{n}} is Y (value)",
  "columnsUsed": ["{{column_name}}"]
}
`,

    inputVariables: ['df_summary', 'column_name', 'n', 'ascending'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
