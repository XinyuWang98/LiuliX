/**
 * Worker Clean Outlier Prompt - English Version
 * L2 Prompt: Remove Outliers (IQR-based cleaning with SQL output)
 */

import { UserPrompt } from '@/types/prompt';

export const workerCleanOutlierPrompt: UserPrompt = {
    id: 'worker-clean-outlier-v1',
    name: 'worker_clean_outlier',
    title: 'Remove Outliers',
    description: 'Remove outlier rows in numeric columns using IQR or Z-score method',

    // Capability package config (v2.1)
    slug: 'worker-clean-outlier-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas'],
    outputCharts: ['box'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'cleaning', label: 'Cleaning' },
        { category: 'method', value: 'outlier_removal', label: 'Outlier Removal' },
        { category: 'output', value: 'sql', label: 'SQL' }
    ],

    template: `You are a professional data cleaning expert. Please remove outliers from column "{{column_name}}" in table "__TABLE_NAME__".`,

    executionMode: 'TEMPLATE_FILL',

    codeTemplate: `import pandas as pd
import numpy as np
import io
import base64
import json
import matplotlib.pyplot as plt

def analyze(df):
    try:
        column_name = {{column_name}}
        method = {{outlier_method}} # iqr or zscore (default iqr)
        
        # 1. Data preparation
        df_clean = df.copy()
        df_clean[column_name] = pd.to_numeric(df_clean[column_name], errors='coerce')
        valid_data = df_clean.dropna(subset=[column_name])[column_name]
        
        if valid_data.empty:
             return json.dumps({"error": f"Column {column_name} has no valid numeric values"})

        # 2. Calculate outliers (IQR)
        q1 = valid_data.quantile(0.25)
        q3 = valid_data.quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = valid_data[(valid_data < lower_bound) | (valid_data > upper_bound)]
        outlier_count = len(outliers)
        
        # 3. Generate SQL (DuckDB syntax)
        table_placeholder = "__TABLE_NAME__"
        sql = f"""
CREATE OR REPLACE TABLE {table_placeholder} AS
SELECT * FROM {table_placeholder}
WHERE "{column_name}" BETWEEN {lower_bound} AND {upper_bound}
OR "{column_name}" IS NULL
        """

        # 4. Visualization (Boxplot)
        plt.figure(figsize=(10, 4))
        plt.boxplot(valid_data, vert=False, patch_artist=True)
        plt.title(f'{column_name} Outlier Detection (IQR)')
        plt.xlabel(column_name)
        plt.tight_layout()
        
        img_buf = io.BytesIO()
        plt.savefig(img_buf, format='png')
        img_buf.seek(0)
        img_base64 = base64.b64encode(img_buf.read()).decode('utf-8')
        plt.close()

        # 5. Generate result
        summary = f"Detected {outlier_count} outliers (IQR method).\\nValid range: [{lower_bound:.2f}, {upper_bound:.2f}]"
        
        result = {
            "summary": summary,
            "columnsUsed": [column_name],
            "image": img_base64,
            "suggestions": [{
                "id": "clean-outlier-auto",
                "label": f"Remove {outlier_count} outliers",
                "sql": sql,
                "confidence": 0.9
            }]
        }
        return json.dumps(result)

    except Exception as e:
        return json.dumps({"error": str(e)})

print(analyze(df))`,

    inputVariables: ['column_name', 'outlier_method'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
