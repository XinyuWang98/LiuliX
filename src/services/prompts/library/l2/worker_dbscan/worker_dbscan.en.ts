import { UserPrompt } from '@/types/prompt';

export const workerDbscanPrompt: UserPrompt = {
    id: 'worker-dbscan-v1',
    name: 'worker_dbscan',
    title: 'DBSCAN Density Clustering',
    description: 'Density-based clustering that finds clusters of arbitrary shape and robust to outliers (no need to specify K)',

    slug: 'worker-dbscan-v1',
    packageId: 'sklearn',
    requiredPackages: ['scikit-learn', 'pandas', 'numpy', 'matplotlib'],
    outputCharts: ['scatter'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'clustering', label: 'Clustering' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    executionMode: 'TEMPLATE_FILL',
    template: '', // Placeholder for TS compliance

    codeTemplate: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
import io
import base64
import json

plt.switch_backend('Agg')

def analyze(df):
    try:
        feature_cols = {{feature_cols}}
        eps = {{eps}} # default 0.5
        min_samples = {{min_samples}} # default 5

        # 1. Data Prep
        df_clean = df[feature_cols].copy()
        
        # Missing values
        imputer = SimpleImputer(strategy='mean')
        data_imputed = imputer.fit_transform(df_clean)
        
        # Scale (Critical for DBSCAN)
        scaler = StandardScaler()
        data_scaled = scaler.fit_transform(data_imputed)

        # 2. Run DBSCAN
        if eps <= 0: eps = 0.5
        if min_samples <= 0: min_samples = 5

        db = DBSCAN(eps=eps, min_samples=min_samples).fit(data_scaled)
        labels = db.labels_

        # 3. PCA Viz (2D)
        pca = PCA(n_components=2)
        coords = pca.fit_transform(data_scaled)
        
        # Stats
        n_clusters_ = len(set(labels)) - (1 if -1 in labels else 0)
        n_noise_ = list(labels).count(-1)
        
        # 4. Plot
        fig, ax = plt.subplots(figsize=(10, 6), dpi=100)
        
        unique_labels = set(labels)
        colors = plt.cm.Spectral(np.linspace(0, 1, len(unique_labels)))
        
        for k, col in zip(unique_labels, colors):
            if k == -1:
                col = [0, 0, 0, 1] # Black for noise
                label_text = 'Noise'
                marker = 'x'
                alpha = 0.3
            else:
                label_text = f'Cluster {k}'
                marker = 'o'
                alpha = 0.8

            class_member_mask = (labels == k)
            xy = coords[class_member_mask]
            
            ax.plot(xy[:, 0], xy[:, 1], marker, markerfacecolor=tuple(col),
                    markeredgecolor='white' if k!=-1 else 'k', 
                    markersize=10 if k!=-1 else 6, 
                    alpha=alpha, label=label_text)

        ax.set_title(f'DBSCAN Result (eps={eps}, min_samples={min_samples})')
        ax.set_xlabel(f'PC1')
        ax.set_ylabel(f'PC2')
        
        if len(unique_labels) > 10:
            ax.legend(loc='best', fontsize='small', ncol=2)
        else:
            ax.legend()
            
        plt.tight_layout()

        # 5. Summary
        summary = f"DBSCAN completed. Found {n_clusters_} clusters and {n_noise_} noise points (outliers)."
        if n_clusters_ == 0:
            summary += " (Hint: No valid clusters found, try adjusting eps)"

        # Base64
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)

        result_json = {
            "image": image_base64,
            "summary": summary,
            "columnsUsed": feature_cols,
            "code": ""
        }
        return json.dumps(result_json)

    except Exception as e:
        return json.dumps({"error": str(e), "summary": "DBSCAN failed"})

print(analyze(df))`,

    inputVariables: ['feature_cols', 'eps', 'min_samples'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
