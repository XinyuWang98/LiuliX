/**
 * 预置模板（QualityGate全拒绝时的兜底方案）
 * 提供基础数据概览洞察
 * 
 * ⚠️ 注意：所有 Python 代码模板已通过 pythonCodeValidator 验证
 * 修改此文件时，请确保运行验证器检查
 */

import { InsightSuggestion } from '@/services/prompts/library/insight';
import { validatePythonCode, formatValidationResult } from './pythonCodeValidator';

/**
 * 获取预置模板洞察（兜底方案）
 * @returns 基础数据概览洞察列表
 */
export function getFallbackInsights(): InsightSuggestion[] {
    return [
        {
            title: "数据概览",
            description: "数据集的基础统计信息",
            columns_used: [],  // 使用所有列
            full_mode: {
                code: `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

# 基础统计
stats = df.describe().T
summary = f"数据集共{len(df)}行，{len(df.columns)}列"

# 创建统计表格可视化
fig, ax = plt.subplots(figsize=(10, 6), dpi=72)
ax.axis('off')
table_data = []
table_data.append(['指标', '数值'])
table_data.append(['总行数', f"{len(df):,}"])
table_data.append(['总列数', len(df.columns)])
table_data.append(['内存占用', f"{df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB"])

table = ax.table(cellText=table_data, cellLoc='left', loc='center', 
                 colWidths=[0.3, 0.7])
table.auto_set_font_size(False)
table.set_fontsize(12)
table.scale(1, 2)
ax.set_title('数据集概览', fontsize=14, pad=20)

# 转Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
json.dumps(result)`
            },
            aggregated_mode: {
                sql: "SELECT COUNT(*) as row_count FROM __TABLE_NAME__",
                viz_code: `import matplotlib.pyplot as plt
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

row_count = df['row_count'].iloc[0]
summary = f"数据集共{row_count:,}行"

fig, ax = plt.subplots(figsize=(8, 6), dpi=72)
ax.text(0.5, 0.5, f"数据集概览\\n\\n总行数: {row_count:,}", 
        ha='center', va='center', fontsize=16)
ax.axis('off')

buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
json.dumps(result)`
            }
        },
        {
            title: "缺失值检测",
            description: "检测数据集中的缺失值分布",
            columns_used: [],
            full_mode: {
                code: `import matplotlib.pyplot as plt
import pandas as pd
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

# 计算缺失值
missing = df.isnull().sum()
missing_pct = (missing / len(df) * 100).round(2)
has_missing = missing[missing > 0].sort_values(ascending=False)

if len(has_missing) == 0:
    summary = "数据集无缺失值，质量良好"
else:
    summary = f"发现{len(has_missing)}个列存在缺失值"

# 可视化
fig, ax = plt.subplots(figsize=(10, 6), dpi=72)
if len(has_missing) > 0:
    has_missing.head(10).plot(kind='barh', ax=ax, color='#e74c3c')
    ax.set_xlabel('缺失值数量')
    ax.set_title('缺失值分布（Top 10）', fontsize=14)
else:
    ax.text(0.5, 0.5, '✓ 数据质量良好\\n无缺失值', 
            ha='center', va='center', fontsize=16, color='green')
    ax.axis('off')

buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
json.dumps(result)`
            },
            aggregated_mode: {
                sql: "SELECT COUNT(*) as total_rows FROM __TABLE_NAME__",
                viz_code: `import matplotlib.pyplot as plt
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

fig, ax = plt.subplots(figsize=(8, 6), dpi=72)
ax.text(0.5, 0.5, '缺失值检测\\n\\n（需全量数据分析）', 
        ha='center', va='center', fontsize=14)
ax.axis('off')

buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

result = {"image": f"data:image/png;base64,{image_base64}", "summary": "聚合模式下无法检测缺失值"}
json.dumps(result)`
            }
        },
        {
            title: "数据类型分布",
            description: "展示数据集中各类型列的分布",
            columns_used: [],
            full_mode: {
                code: `import matplotlib.pyplot as plt
import pandas as pd
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

# 统计数据类型
dtype_counts = df.dtypes.astype(str).value_counts()
summary = f"数据集包含{len(dtype_counts)}种数据类型"

# 可视化
fig, ax = plt.subplots(figsize=(8, 6), dpi=72)
dtype_counts.plot(kind='pie', ax=ax, autopct='%1.1f%%', startangle=90)
ax.set_ylabel('')
ax.set_title('数据类型分布', fontsize=14)

buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

result = {"image": f"data:image/png;base64,{image_base64}", "summary": summary}
json.dumps(result)`
            },
            aggregated_mode: {
                sql: "SELECT COUNT(*) as cols FROM information_schema.columns WHERE table_name = '__TABLE_NAME__'",
                viz_code: `import matplotlib.pyplot as plt
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

fig, ax = plt.subplots(figsize=(8, 6), dpi=72)
ax.text(0.5, 0.5, '数据类型分布\\n\\n（需全量数据分析）', 
        ha='center', va='center', fontsize=14)
ax.axis('off')

buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

result = {"image": f"data:image/png;base64,{image_base64}", "summary": "聚合模式下无法分析数据类型"}
json.dumps(result)`
            }
        }
    ];
}

/**
 * 验证所有预置模板的 Python 代码
 * 开发时可调用此函数确保代码质量
 */
export function validateAllFallbackTemplates(): void {
    const templates = getFallbackInsights();

    templates.forEach((template, index) => {
        if (template.full_mode?.code) {
            const result = validatePythonCode(template.full_mode.code);
            if (!result.valid) {
                console.error(`❌ 模板 ${index + 1} "${template.title}" 验证失败:`, formatValidationResult(result));
            }
        }
    });
}
