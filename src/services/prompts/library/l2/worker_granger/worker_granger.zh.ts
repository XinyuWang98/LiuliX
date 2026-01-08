import { UserPrompt } from '@/types/prompt';

export const workerGrangerPrompt: UserPrompt = {
    id: 'worker-granger-v1',
    name: 'worker_granger',
    title: '格兰杰因果检验',
    description: '检验时间序列 X 是否有助于预测时间序列 Y (统计因果性)',

    slug: 'worker-granger-v1',
    packageId: 'statsmodels',
    requiredPackages: ['statsmodels', 'pandas', 'matplotlib', 'numpy'],
    outputCharts: ['line'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'causal', label: '因果' },
        { category: 'method', value: 'timeseries', label: '时序分析' },
        { category: 'output', value: 'chart', label: '图表' }
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

        # 数据准备
        cols = [y_col, x_col] # granger: [y, x]
        df_clean = df[cols].dropna()
        
        # 确保数据量足够
        if len(df_clean) < maxlag + 2:
             return json.dumps({"error": f"数据不足 (仅 {len(df_clean)} 行)，无法进行滞后 {maxlag} 阶检验"})
             
        # 确保是数值类型
        try:
            df_clean = df_clean.astype(float)
        except:
            return json.dumps({"error": "包含非数值数据，格兰杰检验仅支持数值型时序"})

        # 执行格兰杰检验
        # tests: dict { lag: [ (ftest, ...), (chisq, ...), ... ] }
        test_result = grangercausalitytests(df_clean, maxlag=maxlag, verbose=False)
        
        lags = []
        p_values = []
        
        # 提取 P 值 (SSR Based F Test, index 0)
        for lag in sorted(test_result.keys()):
            res = test_result[lag]
            # res[0] is params tuple, res[0]['ssr_ftest'] is (F, p, df_d, df_n)
            p_val = res[0]['ssr_ftest'][1]
            lags.append(lag)
            p_values.append(p_val)
            
        # 绘图
        fig, ax = plt.subplots(figsize=(10, 5), dpi=100)
        ax.plot(lags, p_values, 'o-', color='#3498db', linewidth=2, label='P-Value (F-test)')
        
        # 显著性红线
        ax.axhline(0.05, color='#e74c3c', linestyle='--', label='P=0.05 Threshold')
        
        ax.set_xlabel('滞后阶数 (Lag)')
        ax.set_ylabel('P-Value')
        ax.set_title(f'格兰杰因果检验: {x_col} -> {y_col}')
        ax.set_xticks(lags)
        ax.legend()
        ax.grid(alpha=0.3)
        
        plt.tight_layout()
        
        # 摘要
        min_p = min(p_values)
        best_lag = lags[p_values.index(min_p)]
        is_significant = min_p < 0.05
        
        if is_significant:
            summary = f"发现统计显著因果关系 (Min P={min_p:.4f} @ Lag {best_lag})。\\n结论: \\"{x_col}\\" 的历史数据有助于预测 \\"{y_col}\\"。"
        else:
            summary = f"未发现显著因果关系 (Min P={min_p:.4f} > 0.05)。\\n结论: \\"{x_col}\\" 可能不是 \\"{y_col}\\" 的格兰杰原因。"

        # 转 Base64
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
        return json.dumps({"error": str(e), "summary": "分析失败"})

print(analyze(df))`,

    inputVariables: ['x_col', 'y_col'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
