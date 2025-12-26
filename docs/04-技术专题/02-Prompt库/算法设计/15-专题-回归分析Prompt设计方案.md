# 15-专题-回归分析Prompt设计方案

> **文档性质**: 技术方案设计
> **生成时间**: 2025-12-26
> **关联模块**: Insight Analysis, Prompt Library

---

## 1. 背景与目标

**回归分析 (Regression Analysis)** 是统计学的基石。
虽然我们有了相关性 (单变量关系) 和 机器学习 (黑盒预测)，但商业分析往往需要 **"精准的量化解释"**。
*   *相关性*: "价格和用来正相关。" (模糊)
*   *随机森林*: "价格是最重要的因素。" (模糊)
*   *回归分析*: "在控制了其他变量后，价格每上涨 1 元，销量平均下降 100 单位。" (精准，Ceteris paribus)

我们将引入 **多多元线性回归 (OLS)** Prompt，核心目标是提供 **可解释的系数分析**。

---

## 2. 交互流程设计

### 2.1 触发机制 (L1 Router)
*   **场景**: 用户问 "各个因素对销量的具体影响是多少？" 或 "控制成本后，广告费 ROI 是多少？"。
*   **L1 逻辑**:
    1.  检测 Intent 为 `attribution` (归因) 或 `regression`。
    2.  检测数据: 1 个数值型 Target，多个数值型/分类型 Features。
    3.  输出: 推荐使用 `worker-model-regression`。

### 2.2 参数确认
> 🤖 **推荐分析**: 建议进行多变量回归分析，量化各因素的影响力。
> *   **因变量 (Y)**: `Sales` [✏️修改]
> *   **自变量 (X)**: `[Price, AdSpend, Season]` (AI 自动识别) [✏️修改]
> *   **模型类型**: `OLS (线性回归)` [✏️修改] (未来可扩充 Logit)
>
> [✅ 生成回归报告]

---

## 3. L2 Prompt 设计 (Worker)

**ID**: `worker-model-regression-v1`

### 3.1 核心 Prompt 结构

使用 `statsmodels` 库，因为它能提供详尽的统计报表 (Summary)，比 `sklearn` 更适合推断统计。

```typescript
export const workerRegressionPrompt: UserPrompt = {
    id: 'worker-model-regression-v1',
    executionMode: 'TEMPLATE_FILL',
    codeTemplate: `
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import statsmodels.api as sm
import base64
from io import BytesIO
import json

# 1. 数据准备
target_col = '{{target_col}}'
feature_cols = {{feature_cols}}

df_clean = df[feature_cols + [target_col]].dropna().copy()
y = df_clean[target_col]
X = df_clean[feature_cols]

# 处理分类变量 (One-Hot Encoding, drop_first to avoid multicollinearity)
X = pd.get_dummies(X, drop_first=True)
# 强制转为 float (避免 bool 类型报错)
X = X.astype(float)

# 添加截距项 (Intercept)
X = sm.add_constant(X)

# 2. 拟合 OLS 模型
model = sm.OLS(y, X).fit()

# 3. 可视化: 系数图 (Coefficient Plot)
# 提取系数和置信区间
params = model.params.drop('const', errors='ignore')
conf = model.conf_int().drop('const', errors='ignore')
conf.columns = ['Lower', 'Upper']
errors = params - conf['Lower']

# 绘图
fig, ax = plt.subplots(figsize=(10, len(params) * 0.5 + 2))
params.plot(kind='barh', xerr=errors, ax=ax, color='#3498db', alpha=0.7, capsize=4)

# 添加 0 线
ax.axvline(x=0, color='red', linestyle='--', linewidth=1)

ax.set_title(f'因素对 {target_col} 的影响幅度 (95% CI)', fontsize=14)
ax.set_xlabel('系数 (Coefficient)')
ax.set_ylabel('特征')
plt.grid(axis='x', linestyle='--', alpha=0.5)
plt.tight_layout()

# 转 Base64
buf = BytesIO()
fig.savefig(buf, format='png', bbox_inches='tight')
img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

# 4. 结论生成
r_squared = model.rsquared
sig_params = model.pvalues[model.pvalues < 0.05].index.tolist()
sig_params = [p for p in sig_params if p != 'const']

if len(sig_params) > 0:
    impact_desc = "、".join(sig_params[:3])
    summary = f"模型解释了 {r_squared:.1%} 的波动。{impact_desc} 对 {target_col} 有显著影响。"
else:
    summary = f"模型解释度为 {r_squared:.1%}，未发现统计显著的关键因素。"

# 5. 结构化输出系数表 (供前端展示表格)
coef_table = []
for idx in params.index:
    coef_table.append({
        "feature": idx,
        "coef": float(params[idx]),
        "p_value": float(model.pvalues[idx]),
        "is_significant": bool(model.pvalues[idx] < 0.05)
    })

result = {
    "images": [img_b64],
    "summary": summary,
    "data": coef_table # 前端可渲染为 Table
}
json.dumps(result)
    `,
    description: "使用 OLS 多元回归分析各变量的独立影响系数和显著性。"
};
```

---

## 4. 可视化策略

### 4.1 系数森林图 (Coefficient Plot)
*   **形式**: 横向条形图 + 误差线 (Error Bar)。
*   **解读关键**:
    *   **方向**: 条形在 0 轴右边是正影响，左边是负影响。
    *   **显著性**: 如果误差线跨过了 0 轴，说明影响不显著 (P > 0.05)。
    *   **幅度**: 条形越长，影响越大。

这比干巴巴的回归表格直观得多，是学术界和商业分析的通用标准。

---

## 5. 总结

回归分析是 **"解释性建模"** 的核心。
*   与 **随机森林** 相比：它可以给出明确的方向 (正/负) 和单位增量 (每增加1元...)。
*   与 **相关性分析** 相比：它能同时处理多个变量，排除混淆因素 (控制变量法)。

加入 OLS 后，我们的统计工具箱已不仅仅是"完备"，而是具备了"严谨性"。
