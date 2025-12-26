# 13-专题-时序预测Prompt设计方案

> **文档性质**: 技术方案设计
> **生成时间**: 2025-12-26
> **关联模块**: Insight Analysis, Prompt Library

---

## 1. 背景与目标

用户不仅想看历史趋势 (What happened)，更想看未来走向 (What will happen)。
虽然 `worker-trend` 提供了历史趋势线，但缺乏**预测 (Forecast)** 能力。我们将引入时序预测 Prompt，利用统计学模型（ARIMA/Prophet 简化版）进行短期预测。

---

## 2. 交互流程设计

### 2.1 触发机制 (L1 Router)
*   **场景**: 用户问 "下个月销量会是多少？" 或 "预测未来的趋势"。
*   **L1 逻辑**:
    1.  检测 Intent 为 `prediction` 或 `forecasting`。
    2.  检测数据: 必须包含 1 个时间列 (Date/Time) 和 1 个数值列 (Metric)。
    3.  输出: 推荐使用 `worker-forecast`。

### 2.2 参数确认 (Human-in-the-loop)
预测未来的风险很大，AI 必须让用户确认假设。
> 🤖 **推荐分析**: 建议对 `Sales` 进行未来趋势预测。
> *   **时间列**: `OrderDate` [✏️修改]
> *   **预测时长 (Horizon)**: `30` (天) [✏️修改]
> *   **置信区间**: `95%` [✏️修改]
>
> [✅ 生成预测]

---

## 3. L2 Prompt 设计 (Worker)

**ID**: `worker-forecast-prophet-v1`

### 3.1 核心 Prompt 结构

考虑到 Prophet 库体积较大可能不在 Pyodide 默认包中，MVP 阶段优先使用 `statsmodels` (ARIMA/Holt-Winters) 或 `sklearn` (Linear Regression with Time Features) 的轻量级实现。

```typescript
export const workerForecastPrompt: UserPrompt = {
    id: 'worker-forecast-v1',
    executionMode: 'TEMPLATE_FILL',
    
    // 预置 Python 代码模板 (使用 statsmodels 进行指数平滑预测)
    codeTemplate: `
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import base64
from io import BytesIO
import json

# 1. 数据准备
date_col = '{{date_col}}'
value_col = '{{value_col}}'
periods = {{periods}} # 预测步数，默认 30

df_clean = df[[date_col, value_col]].dropna().copy()
df_clean[date_col] = pd.to_datetime(df_clean[date_col])
df_clean = df_clean.set_index(date_col).sort_index()

# 聚合 (处理同一天多条数据的情况)
df_agg = df_clean.resample('D').sum().fillna(0) # 假设按天预测

# 2. 训练模型 (Holt-Winters 指数平滑)
# 自动检测季节性周期 (此处简化处理，实际代码需增强)
try:
    model = ExponentialSmoothing(
        df_agg[value_col], 
        seasonal_periods=7, # 假设周周期
        trend='add', 
        seasonal='add'
    ).fit()
except:
    # 降级：简单指数平滑
    model = ExponentialSmoothing(df_agg[value_col], trend='add').fit()

# 3. 预测
forecast = model.forecast(periods)
# 计算简单置信区间 (基于残差标准差)
residuals = df_agg[value_col] - model.fittedvalues
std_resid = residuals.std()
conf_int_lower = forecast - 1.96 * std_resid
conf_int_upper = forecast + 1.96 * std_resid

# 4. 可视化
fig, ax = plt.subplots(figsize=(12, 6))

# 历史数据
ax.plot(df_agg.index, df_agg[value_col], label='历史数据', color='black', alpha=0.7)

# 预测数据
forecast_index = pd.date_range(start=df_agg.index[-1] + pd.Timedelta(days=1), periods=periods)
ax.plot(forecast_index, forecast, label='预测值', color='red', linestyle='--')

# 置信区间
ax.fill_between(forecast_index, conf_int_lower, conf_int_upper, color='red', alpha=0.2, label='95% 置信区间')

ax.set_title(f'{value_col} 未来 {periods} 天预测', fontsize=14)
ax.set_xlabel('日期')
ax.set_ylabel(value_col)
ax.legend()
plt.tight_layout()

# 转 Base64
buf = BytesIO()
fig.savefig(buf, format='png', bbox_inches='tight')
img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

# 5. 结论
last_val = df_agg[value_col].iloc[-1]
pred_end_val = forecast.iloc[-1]
change_pct = ((pred_end_val - last_val) / (last_val + 1e-6)) * 100
trend_str = "上涨" if change_pct > 5 else ("下跌" if change_pct < -5 else "平稳")

summary = f"基于 Holt-Winters 模型预测，未来 {periods} 天 {value_col} 将呈{trend_str}趋势 (预计变动 {change_pct:.1f}%)。"

result = {
    "images": [img_b64],
    "summary": summary
}
json.dumps(result)
    `,
    
    description: "使用 Holt-Winters 指数平滑模型进行短期时序预测。"
};
```

---

## 4. 关键挑战与对策

### 4.1 频率推断 (Frequency Inference)
*   **挑战**: 用户数据可能是按天、按月、甚至按分钟的。
*   **对策**: 在 Python 代码中使用 `pd.infer_freq()` 或 `df.resample()` 强制对齐频率，避免模型报错。

### 4.2 季节性 (Seasonality)
*   **挑战**: 很难自动知道是周周期 (7)、月周期 (30) 还是年周期 (365)。
*   **对策**: 
    1.  **AI 猜测**: 通过 `statsmodels.tsa.seasonal.seasonal_decompose` 尝试检测。
    2.  **默认值**: 如果数据跨度短，默认无季节性；如果跨度长，默认周/年周期。

### 4.3 库的可用性
*   **挑战**: `prophet` 库依赖复杂 (CmdStan)，很难在浏览器 (Pyodide) 中运行。
*   **对策**: 坚持使用 **Statsmodels** 或 **Scikit-learn**。它们已包含在 Pyodide 的默认科学栈中，轻量且够用。

---

## 5. 总结
时序预测是 "洞察" 的终极形态。虽受限于浏览器端算力，不能跑深度学习 (LSTM/Transformer)，但经典的统计学模型 (Holt-Winters/ARIMA) 足以应付 90% 的商业报表预测需求。
