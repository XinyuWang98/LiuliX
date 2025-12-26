# 14-专题-预测模型Prompt设计方案

> **文档性质**: 技术方案设计
> **生成时间**: 2025-12-26
> **关联模块**: Insight Analysis, Prompt Library

---

## 1. 背景与目标

除了“预测未来”(时序预测)和“发现群体”(聚类)，用户还经常需要回答 **"什么因素决定了结果？"**
例如："什么因素最能预测用户流失？" 或 "高价值客户有什么共同特征？"

我们将引入 **有监督学习 (Supervised Learning)** 模型，重点通过决策树和随机森林来提供 **可解释性 (Explainability)** 和 **重要性分析 (Feature Importance)**。

---

## 2. 交互流程设计

### 2.1 触发机制 (L1 Router)
*   **场景**: 用户问 "哪些因素影响了销量？" 或 "帮我分析用户流失的原因"。
*   **L1 逻辑**:
    1.  检测 Intent 为 `attribution` (归因) 或 `modeling`。
    2.  检测数据: 需包含一个 **目标列 (Target)** (如 `Churn`, `Sales`) 和多个 **特征列 (Features)**。
    3.  输出: 推荐使用 `worker-model-decision-tree` 或 `worker-model-feature-importance`。

### 2.2 参数确认 (Human-in-the-loop)
建模的核心是选对 Target。
> 🤖 **推荐分析**: 建议构建决策树模型，分析影响 `Churn` 的核心规则。
> *   **目标变量 (Target)**: `Churn` (分类型) [✏️修改]
> *   **特征变量 (Features)**: `[Age, Income, Tenure, SupportCalls]` [✏️修改]
> *   **最大深度 (Depth)**: `3` (深度越小越易解释) [✏️修改]
>
> [✅ 生成模型与解释]

---

## 3. L2 Prompt 设计 (Worker)

我们将设计两个互补的 Prompt：

### 3.1 Worker A: 决策树 (规则发现)
**ID**: `worker-model-decision-tree-v1`
**侧重**: **白盒解释**。告诉用户具体的判断逻辑 ("如果 A>5 且 B<10，则 C")。

```typescript
export const workerDecisionTreePrompt: UserPrompt = {
    id: 'worker-model-decision-tree-v1',
    executionMode: 'TEMPLATE_FILL',
    codeTemplate: `
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor, plot_tree
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer
import base64
from io import BytesIO
import json

# 1. 数据准备
target_col = '{{target_col}}'
feature_cols = {{feature_cols}}
max_depth = {{max_depth}} # 默认 3

# 预处理：删除空值，LabelEncode 目标列
df_clean = df[feature_cols + [target_col]].dropna().copy()
y = df_clean[target_col]
X = df_clean[feature_cols]

# 处理分类特征 (One-Hot Encoding)
X = pd.get_dummies(X, drop_first=True)

# 判断是分类还是回归
is_classifier = False
if pd.api.types.is_object_dtype(y) or pd.api.types.is_inferred_bool_dtype(y) or y.nunique() < 10:
    is_classifier = True
    le = LabelEncoder()
    y = le.fit_transform(y)
    model = DecisionTreeClassifier(max_depth=max_depth, random_state=42)
else:
    model = DecisionTreeRegressor(max_depth=max_depth, random_state=42)

# 2. 训练
model.fit(X, y)

# 3. 可视化 (Tree Plot)
fig, ax = plt.subplots(figsize=(20, 10))
plot_tree(model, feature_names=X.columns, filled=True, rounded=True, fontsize=10, ax=ax)
ax.set_title(f'决策树分析: 什么是影响 {target_col} 的关键规则?', fontsize=16)

# 转 Base64
buf = BytesIO()
fig.savefig(buf, format='png', bbox_inches='tight')
img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

# 4. 提取文字规则 (简化版)
summary = f"模型构建完成。根节点分裂特征为 {X.columns[model.tree_.feature[0]]}，它是区分 {target_col} 最重要的单一指标。"

result = {
    "images": [img_b64],
    "summary": summary
}
json.dumps(result)
    `,
    description: "使用决策树挖掘数据中的显性规则。"
};
```

### 3.2 Worker B: 随机森林 (关键因子)
**ID**: `worker-model-feature-importance-v1`
**侧重**: **黑盒排序**。告诉用户哪个特征最重要 (Feature Importance)，不关心具体逻辑。
**算法**: `RandomForestClassifier` / `RandomForestRegressor` + `model.feature_importances_` + Bar Chart。

---

## 4. 可视化与解释策略

### 4.1 决策树图
*   **痛点**: `sklearn.plot_tree` 默认画出来很丑且字很小。
*   **优化**: 
    *   强制限制 `max_depth=3`，保证树只有 3-4 层，人眼能看清。
    *   Prompt 中明确要求生成高分辨率宽图 (`figsize=(20, 10)`)。

### 4.2 因子重要性条形图
*   **形式**: 横向条形图，Feature Name 在 Y 轴，Importance Score 在 X 轴，从大到小排序。
*   **解读**: "在预测流失时，`Age` 的重要性是 `Income` 的 2 倍。"

---

## 5. 总结

引入决策树和随机森林后，DataPrism 的模型库将形成完整闭环：

| 领域 | 方法 | Prompt ID | 解决问题 |
| :--- | :--- | :--- | :--- |
| **Relation** (关系) | 相关性分析 | `worker-correlation` | A 和 B 像不像？ |
| **Clustering** (分群) | K-Means | `worker-cluster` | 谁和谁是一伙的？ |
| **Causal** (因果) | RDD/DID/PSM | `worker-causal-*` | A 导致了 B 吗？ |
| **Forecast** (预测) | Holt-Winters | `worker-forecast` | 明天虽然 A 多少？ |
| **Modeling** (归因) | **Tree/Forest** | `worker-model-*` | **谁决定了结果 A？** |

这将极大增强分析师解释业务现象的能力。
