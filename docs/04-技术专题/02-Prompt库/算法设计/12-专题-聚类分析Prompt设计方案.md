# 12-专题-聚类分析Prompt设计方案

> **文档性质**: 技术方案设计
> **生成时间**: 2025-12-26
> **关联模块**: Insight Analysis, Prompt Library

---

## 1. 背景与目标

用户需要对多维数据进行"分群" (Segmentation) 或 "画像" (Profiling)，以发现潜在的群体特征。
聚类分析是无监督学习的核心方法，我们的目标是通过 Prompt 库实现 **"AI 自动建议 + 用户微调参数"** 的低门槛交互。

---

## 2. 交互流程设计

### 2.1 触发机制 (L1 Router)
*   **场景**: 用户在对话框输入 "帮我给用户分群" 或 "看看有哪些类型的客户"。
*   **L1 逻辑**:
    1.  检测 Intent 是否为 `exploration` 或 `clustering`。
    2.  检测数据特征: 是否包含 >= 2 个数值型列 (如 `Age`, `Income`, `Tenure`)。
    3.  输出: 推荐使用 `worker-cluster`，并预选数值列。

### 2.2 参数确认 (Human-in-the-loop)
AI 不应擅自决定分几类。
> 🤖 **推荐分析**: 建议使用 K-Means 算法对客户进行分群。
> *   **参与特征**: `[Age, Income, SpendingScore]` (已剔除 UserID) [✏️修改]
> *   **聚类数量 (K)**: `3` (AI 基于肘部法则推荐) [✏️修改]
> *   **降维方式**: `PCA` (用于 2D 可视化) [✏️修改]

---

## 3. L2 Prompt 设计 (Worker)

**ID**: `worker-cluster-kmeans-v1`

### 3.1 核心 Prompt 结构

```typescript
export const workerClusterPrompt: UserPrompt = {
    id: 'worker-cluster-kmeans-v1',
    executionMode: 'TEMPLATE_FILL',
    
    // 预置 Python 代码模板 (性能优先)
    codeTemplate: `
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
import json
import base64
from io import BytesIO

# 1. 数据准备
features = {{features_list}} # e.g. ['Age', 'Income']
n_clusters = {{n_clusters}}  # e.g. 3
df_clean = df[features].copy()

# 填补缺失值 (聚类不接受 NaN)
imputer = SimpleImputer(strategy='mean')
data_scaled = StandardScaler().fit_transform(imputer.fit_transform(df_clean))

# 2. 核心聚类
kmeans = KMeans(n_clusters=n_clusters, random_state=42)
labels = kmeans.fit_predict(data_scaled)
df['Cluster'] = labels # 将标签回写到原数据，方便后续分析

# 3. 可视化 A: 降维散点图 (Structure View)
pca = PCA(n_components=2)
coords = pca.fit_transform(data_scaled)
x_axis, y_axis = coords[:, 0], coords[:, 1]

fig1, ax1 = plt.subplots(figsize=(10, 6))
scatter = ax1.scatter(x_axis, y_axis, c=labels, cmap='viridis', alpha=0.6)
ax1.set_title(f'K-Means Clustering (K={n_clusters}, PCA Reduced)')
ax1.set_xlabel('PC1')
ax1.set_ylabel('PC2')
plt.colorbar(scatter, ax=ax1, label='Cluster ID')

# 转 Base64 (图1)
buf1 = BytesIO()
fig1.savefig(buf1, format='png', bbox_inches='tight')
img1_b64 = base64.b64encode(buf1.getvalue()).decode('utf-8')

# 4. 可视化 B: 雷达图 (Meaning View) - 需归一化到 0-1 供展示
# (此处省略雷达图 matplotlib 代码，逻辑为计算每个 Cluster 的 feature mean)
# ...

# 5. 结论生成
counts = pd.Series(labels).value_counts().to_dict()
summary = f"已将数据分为 {n_clusters} 类。最大群体为 Cluster {max(counts, key=counts.get)} (n={max(counts.values())})。"

result = {
    "images": [img1_b64, img2_b64], # 返回两张图
    "summary": summary,
    "derived_columns": ["Cluster"] # 告知前端有新列生成
}
json.dumps(result)
    `,
    
    // 兜底与解释
    description: "使用 K-Means 算法进行无监督聚类，并通过 PCA 降维可视化。"
};
```

---

## 4. 可视化策略

### 4.1 散点图 (The "Map")
*   **作用**: 展示**结构**。
*   **对应用户图片**: 正是你上传的那种散点图。
*   **技术点**: 必须做 **PCA 降维**。因为用户的特征通常 >2 个，直接画不出来。降维后虽然坐标轴物理意义模糊 (PC1, PC2)，但能直观看到"是否有清晰的的一团一团"。

### 4.2 雷达图 (The "Profile")
*   **作用**: 展示**含义**。
*   **痛点**: 仅看散点图，用户不知道 "Cluster 0" 到底代表什么。
*   **解决方案**: 计算每个 Cluster 的特征均值，画在雷达图上。
*   **解读示例**: 
    *   Cluster 0: `Age` 高, `Income` 高 -> **"高净值成熟客户"**
    *   Cluster 1: `Age` 低, `Income` 低 -> **"学生党"**

---

## 5. 总结
聚类分析将补全 DataPrism 在 **无监督学习** 领域的空白。通过 **"PCA 散点图 + 特征雷达图"** 的组合拳，我们能让非技术用户也能看懂复杂的群体结构。
