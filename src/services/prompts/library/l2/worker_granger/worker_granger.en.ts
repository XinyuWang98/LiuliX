import { UserPrompt } from '@/types/prompt';

export const workerGrangerPrompt: UserPrompt = {
    id: 'worker-granger-v1',
    name: 'worker_granger',
    title: 'Granger Causality Test',
    description: 'Test if time series X helps predict time series Y (Statistical Causality)',

    slug: 'worker-granger-v1',
    packageId: 'statsmodels',
    requiredPackages: ['statsmodels', 'pandas', 'matplotlib', 'numpy'],
    outputCharts: ['line'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'causal', label: 'Causal' },
        { category: 'method', value: 'timeseries', label: 'Time Series' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    executionMode: 'TEMPLATE_FILL',
    template: '', // Placeholder for TS compliance

    codeTemplate: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.stattools import grangercausalitytests
import io
import base64
import json

plt.switch_backend('Agg')

def analyze(df):
    try:
        x_col = {{x_col}}
        y_col = {{y_col}}
        maxlag = 5 

        # Data Prep
        cols = [y_col, x_col] # granger: [y, x]
        df_clean = df[cols].dropna()
        
        # Check size
        if len(df_clean) < maxlag + 2:
             return json.dumps({"error": f"Not enough data ({len(df_clean)} rows) for lag {maxlag} test"})
             
        # Check numeric
        try:
            df_clean = df_clean.astype(float)
        except:
            return json.dumps({"error": "Contains non-numeric data, Granger test requires numeric time series"})

        # Run Test
        test_result = grangercausalitytests(df_clean, maxlag=maxlag, verbose=False)
        
        lags = []
        p_values = []
        
        # Extract P-values
        for lag in sorted(test_result.keys()):
            res = test_result[lag]
            # res[0]['ssr_ftest'] is (F, p, df_d, df_n)
            p_val = res[0]['ssr_ftest'][1]
            lags.append(lag)
            p_values.append(p_val)
            
        # Plot
        fig, ax = plt.subplots(figsize=(10, 5), dpi=100)
        ax.plot(lags, p_values, 'o-', color='#3498db', linewidth=2, label='P-Value (F-test)')
        
        # Threshold
        ax.axhline(0.05, color='#e74c3c', linestyle='--', label='P=0.05 Threshold')
        
        ax.set_xlabel('Lag')
        ax.set_ylabel('P-Value')
        ax.set_title(f'Granger Causality: {x_col} -> {y_col}')
        ax.set_xticks(lags)
        ax.legend()
        ax.grid(alpha=0.3)
        
        plt.tight_layout()
        
        # Summary
        min_p = min(p_values)
        best_lag = lags[p_values.index(min_p)]
        is_significant = min_p < 0.05
        
        if is_significant:
            summary = f"Statistically significant causality found (Min P={min_p:.4f} @ Lag {best_lag}).\\nConclusion: \\"{x_col}\\" helps predict \\"{y_col}\\"."
        else:
            summary = f"No significant causality found (Min P={min_p:.4f} > 0.05).\\nConclusion: \\"{x_col}\\" does not Granger-cause \\"{y_col}\\"."

        # Base64
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        
        result = {
            "image": image_base64,
            "summary": summary,
            "columnsUsed": [x_col, y_col],
            "code": ""
        }
        return json.dumps(result)

    except Exception as e:
        return json.dumps({"error": str(e), "summary": "Analysis failed"})

print(analyze(df))`,

    inputVariables: ['x_col', 'y_col'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
