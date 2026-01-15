/**
 * Worker Cluster Prompt - English Version
 * L2 Prompt: K-Means Clustering Analysis
 */

import { UserPrompt } from '@/types/prompt';

export const workerClusterPrompt: UserPrompt = {
    id: 'worker-cluster-v1',
    name: 'worker_cluster',
    title: 'Clustering Analysis',
    description: 'Use K-Means algorithm to group data and discover potential clusters',

    // Capability package config (v2.1)
    slug: 'worker-cluster-v1',
    packageId: 'sklearn',
    requiredPackages: ['matplotlib', 'numpy', 'pandas', 'scikit-learn'],
    outputCharts: ['scatter', 'cluster'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'clustering', label: 'Clustering' },
        { category: 'output', value: 'chart', label: 'Chart' }
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

# 1. Data preparation
feature_cols = {{feature_cols}}
n_clusters = {{n_clusters}}

df_clean = df[feature_cols].copy()

# Impute missing values
imputer = SimpleImputer(strategy='mean')
data_imputed = imputer.fit_transform(df_clean)

# Standardize
scaler = StandardScaler()
data_scaled = scaler.fit_transform(data_imputed)

# 2. K-Means clustering
kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
labels = kmeans.fit_predict(data_scaled)
df['Cluster'] = labels

# 3. PCA dimensionality reduction for visualization
pca = PCA(n_components=2)
coords = pca.fit_transform(data_scaled)

fig, ax = plt.subplots(figsize=(10, 6))
scatter = ax.scatter(coords[:, 0], coords[:, 1], c=labels, cmap='viridis', alpha=0.6, s=50)
ax.set_title(f'K-Means Clustering Result (K={n_clusters}, PCA Reduced)', fontsize=14)
ax.set_xlabel(f'PC1 (Explained Variance: {pca.explained_variance_ratio_[0]:.1%})')
ax.set_ylabel(f'PC2 (Explained Variance: {pca.explained_variance_ratio_[1]:.1%})')
plt.colorbar(scatter, ax=ax, label='Cluster ID')
plt.tight_layout()

# Convert to Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# 4. Generate summary
counts = pd.Series(labels).value_counts().to_dict()
largest_cluster = max(counts, key=counts.get)
summary = f"Data has been grouped into {n_clusters} clusters. Largest cluster is Cluster {largest_cluster} ({counts[largest_cluster]} records)."

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    template: `
You are a professional Python data analyst.
Please perform K-Means clustering analysis on DataFrame \`df\`.

# Dataset Summary
{{df_summary}}

# Feature Columns for Clustering
{{feature_cols}}

# Number of Clusters
{{n_clusters}}

# Requirements
1. Standardize features using StandardScaler.
2. Use K-Means algorithm for clustering.
3. Use PCA to reduce data to 2D and draw scatter plot showing clustering results.
4. Calculate sample count for each cluster.
5. **Do NOT** generate plt.show().
6. Return JSON format result.

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "Data grouped into K clusters. Largest cluster is X (N records).",
  "columnsUsed": [...]
}
`,

    inputVariables: ['feature_cols', 'n_clusters'],

    // 🆕 Declare generated column names (for column validation whitelist)
    outputColumns: ['Cluster'],  // K-Means clustering adds a Cluster column to the DataFrame

    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
