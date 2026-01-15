import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 单变量分布分析
 * 用于绘制数值列直方图或分类列柱状图
 */
export const workerDistributionPrompt: UserPrompt = {
    id: 'worker-distribution-v1',
    name: 'worker_distribution',
    title: '单变量分布分析',
    description: '查看单一变量的数据分布情况（偏态、峰度、异常值）',

    // 能力包配置 (v2.1)
    slug: 'worker-distribution-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'numpy', 'pandas', 'scipy', 'seaborn'],
    outputCharts: ['histogram', 'bar'],

    layer: 'L2_EXECUTION',

    // 四维矩阵标签
    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'statistics', label: '统计分布' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    // ✅ Router 模式：使用预置代码模板
    executionMode: 'TEMPLATE_FILL',

    // 预置 Python 代码模板（与英文版一致，使用 seaborn）
    codeTemplate: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import seaborn as sns
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

column_name = {{column_name}}
is_numeric = pd.api.types.is_numeric_dtype(df[column_name])

# 创建不同类型的图表
if is_numeric:
    col_data = pd.to_numeric(df[column_name], errors='coerce').dropna()
    
    # 双视图：直方图 + 密度图
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5), dpi=72)
    
    # 直方图
    ax1.hist(col_data, bins=30, color='#3498db', alpha=0.7, edgecolor='black')
    ax1.set_title(f'{column_name} 分布直方图', fontsize=14)
    ax1.set_xlabel('数值')
    ax1.set_ylabel('频次')
    ax1.grid(axis='y', alpha=0.3)
    
    # 密度图 (KDE)
    try:
        col_data.plot(kind='density', ax=ax2, color='#e74c3c', linewidth=2)
    except:
        # 样本过少无法KDE时降级处理
        ax2.text(0.5, 0.5, '数据点过少无法生成密度图', ha='center')
        
    ax2.set_title(f'{column_name} 密度图', fontsize=14)
    ax2.set_xlabel('数值')
    ax2.set_ylabel('密度')
    ax2.grid(alpha=0.3)
    
    # 统计量
    mean_val = col_data.mean()
    median_val = col_data.median()
    std_val = col_data.std()
    skew_val = col_data.skew()
    skew_desc = '右偏' if skew_val > 0.5 else ('左偏' if skew_val < -0.5 else '对称')
    summary = f"{column_name}: 均值={mean_val:.2f}, 中位数={median_val:.2f}, 标准差={std_val:.2f}, 分布{skew_desc}"

else:
    # 分类型数据：Bar Chart
    top_n = df[column_name].value_counts().head(10)
    
    fig, ax = plt.subplots(figsize=(10, 6), dpi=72)
    top_n.plot(kind='bar', ax=ax, color='#3498db', alpha=0.8)
    
    ax.set_title(f'{column_name} Top 10 分布', fontsize=14)
    ax.set_xlabel('类别')
    ax.set_ylabel('频次')
    ax.grid(axis='y', alpha=0.3)
    plt.xticks(rotation=45)
    
    summary = f"{column_name}: 共 {df[column_name].nunique()} 个类别, Top 1 占比 {top_n.iloc[0]/len(df):.1%}"

plt.tight_layout()

# 转 Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
print(json.dumps(result))`,

    // 旧版 AI Prompt (保留兼容)
    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 中的列 \`{{column_name}}\` 进行分布分析。

# 数据集摘要
{{df_summary}}

# 要求
1. 检查列的数据类型。
2. 如果是数值型 (Numeric)：
   - 绘制直方图 (Histogram) + 核密度估计 (KDE)。
   - 计算偏度 (Skewness) 和峰度 (Kurtosis)。
   - 标题: "{{column_name}} 分布分析"。
3. 如果是分类型 (Categorical/String)：
   - 绘制柱状图 (Bar Chart)，显示 Top 10 类别。
   - 标题: "{{column_name}} 类别分布 (Top 10)"。
4. 使用 matplotlib/seaborn 绘图。
5. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
6. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "对该列分布的分析结论（一句话）",
  "columnsUsed": ["{{column_name}}"]
}
`,

    inputVariables: ['column_name'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
