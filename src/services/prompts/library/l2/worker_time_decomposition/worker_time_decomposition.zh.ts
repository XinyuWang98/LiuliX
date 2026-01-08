import { UserPrompt } from '@/types/prompt';

export const workerTimeDecompositionPrompt: UserPrompt = {
    id: 'worker-time-decomposition-v1',
    name: 'worker_time_decomposition',
    title: '时序分解 (季节性分析)',
    description: '将时间序列分解为趋势、季节性和残差项，识别周期性规律',

    slug: 'worker-time-decomposition-v1',
    packageId: 'statsmodels',
    requiredPackages: ['statsmodels', 'pandas', 'matplotlib', 'numpy'],
    outputCharts: ['line'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'timeseries', label: '时序分析' },
        { category: 'output', value: 'chart', label: '图表' }
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

        # 1. 数据准备
        df_clean = df[[date_col, value_col]].dropna().copy()
        
        # 转换日期格式
        try:
            df_clean[date_col] = pd.to_datetime(df_clean[date_col])
        except:
             return json.dumps({"error": f"列 {date_col} 无法转换为日期格式"})

        df_clean = df_clean.sort_values(date_col).set_index(date_col)
        
        # 确保频率 (Statsmodels 需要 index.freq 或指定 period)
        # 简单起见，我们对非固定频率数据使用 period 参数
        
        # 填充缺失值 (线性插值) 以保证连续性
        # 如果数据太稀疏可能还是会有问题，这里做简单的插值处理
        df_clean[value_col] = df_clean[value_col].interpolate(method='linear')

        # 2. 执行分解
        # 自动推断周期: 如果 period=0
        if period == 0:
            # 简单启发式: 观察数据量
            n = len(df_clean)
            if n > 14: period = 7 # 假设周周期
            elif n > 24: period = 12 # 假设月周期 (年)
            else: period = 2 # 最小周期
        
        # 确保数据量足够
        if len(df_clean) < 2 * period:
             return json.dumps({"error": f"数据量不足 ({len(df_clean)})，无法进行周期为 {period} 的分解"})

        result = seasonal_decompose(df_clean[value_col], model='additive', period=int(period))

        # 3. 绘图 (4个子图)
        fig, axes = plt.subplots(4, 1, figsize=(10, 8), sharex=True)
        
        result.observed.plot(ax=axes[0], color='#3498db')
        axes[0].set_ylabel('Observed')
        axes[0].set_title(f'时间序列分解 (Period={period})') # Title on top

        result.trend.plot(ax=axes[1], color='#e67e22')
        axes[1].set_ylabel('Trend')

        result.seasonal.plot(ax=axes[2], color='#2ecc71')
        axes[2].set_ylabel('Seasonal')

        result.resid.plot(ax=axes[3], color='#e74c3c', marker='o', linestyle='None', markersize=2)
        axes[3].set_ylabel('Residual')
        axes[3].axhline(0, color='black', linestyle='--', linewidth=0.8)

        plt.xlabel(date_col)
        plt.tight_layout()

        # 4. 结论生成
        # 分析 Trend (总体涨跌)
        trend_vals = result.trend.dropna()
        if not trend_vals.empty:
            start_v = trend_vals.iloc[0]
            end_v = trend_vals.iloc[-1]
            change_pct = ((end_v - start_v) / start_v) * 100 if start_v != 0 else 0
            trend_desc = f"总体呈现 {'上升' if change_pct > 0 else '下降'} 趋势 ({change_pct:+.1f}%)"
        else:
            trend_desc = "趋势不明显"
            
        # 分析 Seasonal (波动幅度)
        seasonal_vals = result.seasonal.dropna()
        season_range = seasonal_vals.max() - seasonal_vals.min()
        
        summary = f"{trend_desc}。检测到显著的周期性波动，幅度约为 {season_range:.2f} (单位)。"

        # 转 Base64
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
        return json.dumps({"error": str(e), "summary": "时序分解失败"})

print(analyze(df))`,

    inputVariables: ['date_col', 'value_col', 'period'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
