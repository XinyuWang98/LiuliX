import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 剔除异常值
 * 删除超出正常范围的异常值行
 */
export const workerCleanOutlierPrompt: UserPrompt = {
  id: 'worker-clean-outlier-v1',
  name: 'worker_clean_outlier',
  title: '剔除异常值',
  description: '删除数值列中的异常值行，使用IQR或Z-score方法识别异常',



  // 能力包配置 (v2.1)
  slug: 'worker-clean-outlier-v1',
  packageId: 'basic',
  requiredPackages: ['matplotlib', 'numpy', 'pandas'],
  outputCharts: ['line', 'box'],
  layer: 'L2_EXECUTION',

  dimensions: [
    { category: 'industry', value: 'general', label: '通用' },
    { category: 'intent', value: 'cleaning', label: '清洗' },
    { category: 'method', value: 'outlier_removal', label: '异常剔除' },
    { category: 'output', value: 'sql', label: 'SQL' }
  ],

  // 提示词模板 (System Prompt) - 用于参考或 LLM 模式
  template: `你是一个专业的数据清洗专家。请针对表 "__TABLE_NAME__" 中的 "{{column_name}}" 列剔除异常值。`,

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
        
        # 1. 数据准备
        df_clean = df.copy()
        df_clean[column_name] = pd.to_numeric(df_clean[column_name], errors='coerce')
        valid_data = df_clean.dropna(subset=[column_name])[column_name]
        
        if valid_data.empty:
             return json.dumps({"error": f"列 {column_name} 无有效数值"})

        # 2. 计算异常值 (IQR)
        q1 = valid_data.quantile(0.25)
        q3 = valid_data.quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = valid_data[(valid_data < lower_bound) | (valid_data > upper_bound)]
        outlier_count = len(outliers)
        
        # 3. 构造 SQL (DuckDB syntax)
        table_placeholder = "__TABLE_NAME__"
        sql = f"""
CREATE OR REPLACE TABLE {table_placeholder} AS
SELECT * FROM {table_placeholder}
WHERE "{column_name}" BETWEEN {lower_bound} AND {upper_bound}
OR "{column_name}" IS NULL
        """

        # 4. 可视化 (Boxplot)
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

        # 5. 生成结果
        summary = f"检测到 {outlier_count} 个异常值 (IQR方法)。\\n保留范围: [{lower_bound:.2f}, {upper_bound:.2f}]"
        
        result = {
            "summary": summary,
            "columnsUsed": [column_name],
            "image": img_base64,
            "suggestions": [{
                "id": "clean-outlier-auto",
                "label": f"剔除 {outlier_count} 个异常值",
                "sql": sql,
                "confidence": 0.9
            }]
        }
        return json.dumps(result)

    except Exception as e:
        return json.dumps({"error": str(e)})

print(analyze(df))`,

  inputVariables: ['df_summary', 'column_name', 'outlier_method'],
  author: 'System',
  version: '1.0.0',
  isBuiltIn: true,
  updatedAt: Date.now()
};
