import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: K-Means 聚类分析
 * 使用 K-Means 算法进行无监督聚类，发现潜在群体
 */
export const workerClusterPrompt: UserPrompt = {
    id: 'worker-cluster-v1',
    name: 'worker_cluster',
    title: '聚类分析',
    description: '使用 K-Means 算法对数据进行分群，发现潜在的群体特征',

    // 能力包配置 (v2.1)
    slug: 'worker-cluster-v1',
    packageId: 'sklearn',
    requiredPackages: ['scikit-learn', 'pandas', 'numpy', 'matplotlib'],
    outputCharts: ['scatter', 'cluster'],

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'clustering', label: '聚类' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    executionMode: 'TEMPLATE_FILL',

    codeTemplate: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

# 1. 数据准备
feature_cols = {{feature_cols}}
n_clusters = {{n_clusters}}

df_clean = df[feature_cols].copy()

# 填补缺失值
imputer = SimpleImputer(strategy='mean')
data_imputed = imputer.fit_transform(df_clean)

# 标准化
scaler = StandardScaler()
data_scaled = scaler.fit_transform(data_imputed)

# 2. K-Means 聚类
kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
labels = kmeans.fit_predict(data_scaled)
df['Cluster'] = labels

# 3. PCA 降维可视化
pca = PCA(n_components=2)
coords = pca.fit_transform(data_scaled)

fig, ax = plt.subplots(figsize=(10, 6))
scatter = ax.scatter(coords[:, 0], coords[:, 1], c=labels, cmap='viridis', alpha=0.6, s=50)
ax.set_title(f'K-Means 聚类结果 (K={n_clusters}, PCA 降维)', fontsize=14)
ax.set_xlabel(f'PC1 (解释方差: {pca.explained_variance_ratio_[0]:.1%})')
ax.set_ylabel(f'PC2 (解释方差: {pca.explained_variance_ratio_[1]:.1%})')
plt.colorbar(scatter, ax=ax, label='Cluster ID')
plt.tight_layout()

# 转 Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# 4. 结论生成
counts = pd.Series(labels).value_counts().to_dict()
largest_cluster = max(counts, key=counts.get)
summary = f"已将数据分为 {n_clusters} 个群体。最大群体为 Cluster {largest_cluster} (共 {counts[largest_cluster]} 条记录)。"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 进行 K-Means 聚类分析。

# 数据集摘要
{{df_summary}}

# 参与聚类的特征列
{{feature_cols}}

# 聚类数量
{{n_clusters}}

# 要求
1. 对特征进行标准化处理 (StandardScaler)。
2. 使用 K-Means 算法进行聚类。
3. 使用 PCA 将数据降维到 2D，绘制散点图展示聚类结果。
4. 计算各聚类的样本数量。
5. **不要** 生成任何 plt.show()。
6. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "已将数据分为 K 个群体。最大群体为 Cluster X (共 N 条记录)。",
  "columnsUsed": [...]
}
`,

    inputVariables: ['feature_cols', 'n_clusters'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
