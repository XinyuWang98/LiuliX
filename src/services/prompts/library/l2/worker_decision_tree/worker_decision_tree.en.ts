/**
 * Worker Decision Tree Prompt - English Version
 * L2 Prompt: Decision Tree Analysis
 */

import { UserPrompt } from '@/types/prompt';

export const workerDecisionTreePrompt: UserPrompt = {
    id: 'worker-decision-tree-v1',
    name: 'worker_decision_tree',
    title: 'Decision Tree Analysis',
    description: 'Use decision tree model to discover key rules affecting target variable (interpretable white-box model)',

    // Capability package config (v2.1)
    slug: 'worker-decision-tree-v1',
    packageId: 'sklearn',
    requiredPackages: ['matplotlib', 'pandas', 'scikit-learn'],
    outputCharts: ['tree'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'causal', label: 'Causal' },
        { category: 'method', value: 'classification', label: 'Classification' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    executionMode: 'TEMPLATE_FILL',

    codeTemplate: `import pandas as pd
import matplotlib.pyplot as plt
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor, plot_tree
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

# 1. Data preparation
target_col = {{target_col}}
feature_cols = {{feature_cols}}
max_depth = {{max_depth}}

df_clean = df[feature_cols + [target_col]].dropna().copy()
y = df_clean[target_col]
X = df_clean[feature_cols]

# Handle categorical features (One-Hot Encoding)
X = pd.get_dummies(X, drop_first=True)

# Determine if classification or regression task
is_classifier = False
if pd.api.types.is_object_dtype(y) or y.nunique() < 10:
    is_classifier = True
    le = LabelEncoder()
    y = le.fit_transform(y)
    model = DecisionTreeClassifier(max_depth=max_depth, random_state=42)
else:
    model = DecisionTreeRegressor(max_depth=max_depth, random_state=42)

# 2. Train model
model.fit(X, y)

# 3. Visualization (Decision tree plot)
fig, ax = plt.subplots(figsize=(20, 10))
plot_tree(model, feature_names=list(X.columns), filled=True, rounded=True, fontsize=10, ax=ax)
ax.set_title(f'Decision Tree: What factors affect {target_col}?', fontsize=16)
plt.tight_layout()

# Convert to Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight', dpi=100)
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# 4. Extract key rules
root_feature = X.columns[model.tree_.feature[0]] if model.tree_.feature[0] >= 0 else 'N/A'
summary = f"Model built. Root node split feature is {root_feature}, the most important indicator for {target_col}."

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    template: `
You are a professional Python data analyst.
Please build a decision tree model for DataFrame \`df\` to discover key rules affecting the target variable.

# Dataset Summary
{{df_summary}}

# Target Variable
{{target_col}}

# Feature Variables
{{feature_cols}}

# Max Depth
{{max_depth}}

# Requirements
1. Automatically select classification or regression tree based on target variable type.
2. Use sklearn's DecisionTreeClassifier/Regressor.
3. Draw decision tree plot (plot_tree), limit depth for readability.
4. Extract root node split feature as the most important indicator.
5. **Do NOT** generate plt.show().
6. Return JSON format result.

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "Root node split feature is X, the most important indicator",
  "columnsUsed": ["{{target_col}}", ...]
}
`,

    inputVariables: ['target_col', 'feature_cols', 'max_depth'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
