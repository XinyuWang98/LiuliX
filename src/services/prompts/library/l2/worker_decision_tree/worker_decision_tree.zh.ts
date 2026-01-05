import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 决策树分析
 * 使用决策树挖掘数据中的显性规则
 */
export const workerDecisionTreePrompt: UserPrompt = {
    id: 'worker-decision-tree-v1',
    name: 'worker_decision_tree',
    title: '决策树分析',
    description: '使用决策树模型发现影响目标变量的关键规则（白盒可解释）',



    // 能力包配置 (v2.1)
    slug: 'worker-decision-tree-v1',
    packageId: 'sklearn',
    requiredPackages: ['matplotlib', 'pandas', 'scikit-learn'],
    outputCharts: ['line', 'box'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'causal', label: '归因' },
        { category: 'method', value: 'classification', label: '分类建模' },
        { category: 'output', value: 'chart', label: '图表' }
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

# 1. 数据准备
target_col = {{target_col}}
feature_cols = {{feature_cols}}
max_depth = {{max_depth}}

df_clean = df[feature_cols + [target_col]].dropna().copy()
y = df_clean[target_col]
X = df_clean[feature_cols]

# 处理分类特征 (One-Hot Encoding)
X = pd.get_dummies(X, drop_first=True)

# 判断是分类还是回归任务
is_classifier = False
if pd.api.types.is_object_dtype(y) or y.nunique() < 10:
    is_classifier = True
    le = LabelEncoder()
    y = le.fit_transform(y)
    model = DecisionTreeClassifier(max_depth=max_depth, random_state=42)
else:
    model = DecisionTreeRegressor(max_depth=max_depth, random_state=42)

# 2. 训练模型
model.fit(X, y)

# 3. 可视化 (决策树图)
fig, ax = plt.subplots(figsize=(20, 10))
plot_tree(model, feature_names=list(X.columns), filled=True, rounded=True, fontsize=10, ax=ax)
ax.set_title(f'决策树分析: 什么因素影响 {target_col}?', fontsize=16)
plt.tight_layout()

# 转 Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight', dpi=100)
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# 4. 提取关键规则
root_feature = X.columns[model.tree_.feature[0]] if model.tree_.feature[0] >= 0 else 'N/A'
summary = f"模型构建完成。根节点分裂特征为 {root_feature}，它是区分 {target_col} 最重要的单一指标。"

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 构建决策树模型，挖掘影响目标变量的关键规则。

# 数据集摘要
{{df_summary}}

# 目标变量
{{target_col}}

# 特征变量
{{feature_cols}}

# 最大深度
{{max_depth}}

# 要求
1. 根据目标变量类型自动选择分类树或回归树。
2. 使用 sklearn 的 DecisionTreeClassifier/Regressor。
3. 绘制决策树图 (plot_tree)，限制深度以确保可读性。
4. 提取根节点分裂特征作为最重要指标。
5. **不要** 生成任何 plt.show()。
6. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "根节点分裂特征为 X，它是最重要的指标",
  "columnsUsed": ["{{target_col}}", ...]
}
`,

    inputVariables: ['target_col', 'feature_cols', 'max_depth'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
