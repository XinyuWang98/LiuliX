import { UserPrompt } from '@/types/prompt';

export const workerTimeDecompositionPrompt: UserPrompt = {
    id: 'worker-time-decomposition-v1',
    name: 'worker_time_decomposition',
    title: 'Time Series Decomposition (Seasonal)',
    description: 'Decompose time series into Trend, Seasonal, and Residual components to identify cyclic patterns',

    slug: 'worker-time-decomposition-v1',
    packageId: 'statsmodels',
    requiredPackages: ['statsmodels', 'pandas', 'matplotlib', 'numpy'],
    outputCharts: ['line'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'timeseries', label: 'Time Series' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    executionMode: 'TEMPLATE_FILL',
    template: '', // Placeholder for TS compliance

    codeTemplate: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.seasonal import seasonal_decompose
import io
import base64
import json

plt.switch_backend('Agg')

def analyze(df):
    try:
        date_col = {{date_col}}
        value_col = {{value_col}}
        period = {{period}} # optional, default 0 (auto)

        # 1. Data Prep
        df_clean = df[[date_col, value_col]].dropna().copy()
        
        # Convert to datetime
        try:
            df_clean[date_col] = pd.to_datetime(df_clean[date_col])
        except:
             return json.dumps({"error": f"Column {date_col} cannot be converted to datetime"})

        df_clean = df_clean.sort_values(date_col).set_index(date_col)
        
        # Fill missing to ensure continuity
        df_clean[value_col] = df_clean[value_col].interpolate(method='linear')

        # 2. Decompose
        # Auto-infer period if 0
        if period == 0:
            n = len(df_clean)
            if n > 14: period = 7 # Weekly assumption
            elif n > 24: period = 12 # Monthly assumption
            else: period = 2 # Min
        
        # Check size
        if len(df_clean) < 2 * period:
             return json.dumps({"error": f"Not enough data ({len(df_clean)}) for period {period} decomposition"})

        result = seasonal_decompose(df_clean[value_col], model='additive', period=int(period))

        # 3. Plot (4 subplots)
        fig, axes = plt.subplots(4, 1, figsize=(10, 8), sharex=True)
        
        result.observed.plot(ax=axes[0], color='#3498db')
        axes[0].set_ylabel('Observed')
        axes[0].set_title(f'Time Series Decomposition (Period={period})')

        result.trend.plot(ax=axes[1], color='#e67e22')
        axes[1].set_ylabel('Trend')

        result.seasonal.plot(ax=axes[2], color='#2ecc71')
        axes[2].set_ylabel('Seasonal')

        result.resid.plot(ax=axes[3], color='#e74c3c', marker='o', linestyle='None', markersize=2)
        axes[3].set_ylabel('Residual')
        axes[3].axhline(0, color='black', linestyle='--', linewidth=0.8)

        plt.xlabel(date_col)
        plt.tight_layout()

        # 4. Summary
        # Analyze Trend
        trend_vals = result.trend.dropna()
        if not trend_vals.empty:
            start_v = trend_vals.iloc[0]
            end_v = trend_vals.iloc[-1]
            change_pct = ((end_v - start_v) / start_v) * 100 if start_v != 0 else 0
            trend_desc = f"Overall trend is {'Upward' if change_pct > 0 else 'Downward'} ({change_pct:+.1f}%)"
        else:
            trend_desc = "Trend is not obvious"
            
        # Analyze Seasonal
        seasonal_vals = result.seasonal.dropna()
        season_range = seasonal_vals.max() - seasonal_vals.min()
        
        summary = f"{trend_desc}. Significant seasonal fluctuation detected, range approx {season_range:.2f} units."

        # Base64
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        
        result_json = {
            "image": image_base64,
            "summary": summary,
            "columnsUsed": [date_col, value_col],
            "code": ""
        }
        return json.dumps(result_json)

    except Exception as e:
        return json.dumps({"error": str(e), "summary": "Decomposition failed"})

print(analyze(df))`,

    inputVariables: ['date_col', 'value_col', 'period'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
