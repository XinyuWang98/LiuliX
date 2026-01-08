/**
 * workerMissing Prompt - English Version
 */

import { UserPrompt } from '@/types/prompt';

export const workerMissingPrompt: UserPrompt = {
    id: 'worker-missing-v1',
    name: 'worker_missing',
    title: 'Missing Value Analysis',
    description: 'Scan all columns and analyze missing data patterns, calculate missing counts and percentages',

    slug: 'worker-missing-v1',
    packageId: 'basic',
    requiredPackages: ['pandas', 'matplotlib', 'numpy'],
    outputCharts: ['chart'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'analysis', label: 'Analysis' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    // ✅ Router Mode: Auto Code Generation
    executionMode: 'TEMPLATE_FILL',
    template: '', // Placeholder for TS compliance

    codeTemplate: `import pandas as pd
import matplotlib.pyplot as plt
import io
import base64
import json
import numpy as np

plt.switch_backend('Agg')

def analyze(df):
    try:
        # 1. Calc Missing
        missing = df.isnull().sum()
        missing = missing[missing > 0]
        
        if missing.empty:
             summary = "✅ Dataset is complete. No missing values found."
             # Green Image
             fig, ax = plt.subplots(figsize=(8, 2))
             ax.text(0.5, 0.5, "100% Complete (No Missing Data)", 
                     ha='center', va='center', fontsize=14, color='#2ecc71')
             ax.axis('off')
             columns_used = []
        else:
            # Calc Pct
            total_rows = len(df)
            missing_pct = (missing / total_rows) * 100
            missing_df = pd.DataFrame({'count': missing, 'pct': missing_pct})
            missing_df = missing_df.sort_values('pct', ascending=True) 
            
            # Color Map (Red>20%, Yellow>5%, Green<5%)
            colors = []
            for pct in missing_df['pct']:
                if pct > 20: colors.append('#e74c3c') # Red
                elif pct > 5: colors.append('#f1c40f') # Yellow
                else: colors.append('#2ecc71') # Green
            
            # Plot
            fig_height = max(4, len(missing_df) * 0.4)
            fig, ax = plt.subplots(figsize=(10, fig_height), dpi=100)
            bars = ax.barh(missing_df.index, missing_df['pct'], color=colors)
            
            ax.set_xlabel('Missing Percentage (%)')
            ax.set_title(f'Found {len(missing_df)} columns with missing values')
            ax.grid(axis='x', linestyle='--', alpha=0.3)
            
            # Labels
            for i, v in enumerate(missing_df['pct']):
                count = missing_df.iloc[i]['count']
                ax.text(v + 0.2, i, f'{v:.1f}% ({count})', va='center', fontsize=9)
                
            plt.tight_layout()
            
            # Summary
            top_col = missing_df.index[-1]
            top_pct = missing_df.iloc[-1]['pct']
            summary = f"Found {len(missing_df)} columns with missing values. The most severe is {top_col} ({top_pct:.1f}%)."
            columns_used = list(missing.index)

        # To Base64
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        
        result = {
            "image": image_base64, 
            "summary": summary,
            "columnsUsed": columns_used,
            "code": ""
        }
        return json.dumps(result)
        
    except Exception as e:
        return json.dumps({"error": str(e), "image": "", "summary": "Analysis failed"})

print(analyze(df))`,

    inputVariables: [],
    author: 'System',
    version: '2.0.0', // Updated
    isBuiltIn: true,
    updatedAt: Date.now()
};
