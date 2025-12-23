// 批量洞察生成 Prompt（Pyodide Base64输出）
import { logger } from '@/utils/logger';

/**
 * 生成批量洞察建议的 AI Prompt
 */
export function generateBatchInsightsPrompt(
    columns: string[],
    rowCount: number,
    totalRows: number,
    sampleData: any[]
): string {
    const columnList = columns.join(', ');

    // 🔧 处理BigInt序列化问题
    const sampleDataCleaned = sampleData.slice(0, 5).map(row => {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(row)) {
            cleaned[key] = typeof value === 'bigint' ? value.toString() : value;
        }
        return cleaned;
    });

    const sampleJson = JSON.stringify(sampleDataCleaned, null, 2);

    return `你是专业的数据分析专家，请基于以下数据集生成 3-5 条洞察分析建议。

**数据集信息**：
- 列名：${columnList}
- 采样行数：${rowCount}（用于理解数据分布）
- 总行数：${totalRows}（实际数据规模）
- 示例数据：
${sampleJson}

**重要要求**：
每条洞察建议必须提供 **两种执行模式**：
1. **full_mode**：用于小数据集（<50万行），直接使用pandas全量数据分析
2. **aggregated_mode**：用于大数据集（>50万行），使用DuckDB预聚合后再可视化

**双模式代码规范**：

**full_mode** - pandas全量分析：
- 使用全局变量 \`df\`（已加载全量数据）
- 导入：\`import matplotlib.pyplot as plt\`, \`import pandas as pd\`, \`import numpy as np\`, \`import base64\`, \`from io import BytesIO\`, \`import json\`
- 使用 \`plt.switch_backend('Agg')\`
- 返回格式：\`json.dumps({"image": "data:image/png;base64,...", "summary": "统计文本"})\`

**aggregated_mode** - DuckDB预聚合：
- **sql**：DuckDB SQL查询（使用 \`__TABLE_NAME__\` 占位符代表表名）
- **viz_code**：基于聚合结果的Pyodide可视化代码（使用 \`df\` 代表聚合后的小数据集）

**输出格式（JSON数组）**：
[
    {
        "title": "洞察标题",
        "description": "洞察描述",
        "columns_used": ["列名1", "列名2"],
        "full_mode": {
            "code": "完整Python代码（使用全量df）"
        },
        "aggregated_mode": {
            "sql": "DuckDB预聚合SQL（使用__TABLE_NAME__占位符）",
            "viz_code": "Pyodide可视化代码（使用聚合后df）"
        }
    }
]

**关键注意事项**：
1. aggregated_mode的SQL必须返回较少的行（<1000行），通过GROUP BY聚合
2. viz_code使用的df是SQL聚合后的结果，不是原始数据
3. 两种模式最终生成的图表应该**视觉上一致**（只是数据粒度不同）
4. 必须在columns_used中列出使用的列名（用于内存评估）

**要求**：
1. 生成 3-5 条有价值的数据洞察建议
2. 每条建议必须包含：title（标题）、description（描述）、code（Python代码）

**代码规范**：
- 使用全局变量 \`df\`（已加载数据）
- 必须导入：\`import matplotlib.pyplot as plt\`, \`import base64\`, \`from io import BytesIO\`
- 使用 \`plt.switch_backend('Agg')\`
- 代码最后一行必须返回：\`json.dumps({"image": "data:image/png;base64,...", "summary": "统计文本"})\`

**代码模板**：
\`\`\`python
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import base64
from io import BytesIO
import json

plt.switch_backend('Agg')

# 分析逻辑
# ...

# 生成图表
fig, ax = plt.subplots(figsize=(8, 6), dpi=72)
# ... 绘图代码 ...
ax.set_title('标题', fontsize=14)

# 转Base64
buffer = BytesIO()
fig.savefig(buffer, format='png', bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
plt.close(fig)

# 返回结果
result = {"image": f"data:image/png;base64,{image_base64}", "summary": "统计摘要"}
json.dumps(result)
\`\`\`

**输出格式（JSON数组）**：
[
    {"title": "年龄分布", "description": "用户年龄集中在25-35岁", "code": "完整Python代码"},
    {"title": "销售趋势", "description": "销售额逐月增长", "code": "完整Python代码"}
]

请直接返回JSON数组，无需任何解释。`;
}

/**
 * 批量洞察建议接口
 */
export interface InsightSuggestion {
    title: string;
    description: string;
    /** AI分析用到的列 */
    columns_used: string[];
    /** 全量模式 */
    full_mode: {
        code: string;
    };
    /** 聚合模式 */
    aggregated_mode: {
        sql: string;
        viz_code: string;
    };
}

/**
 * 解析AI返回的批量洞察
 */
export function parseBatchInsightsResponse(aiResponse: string): InsightSuggestion[] {
    try {
        let cleaned = aiResponse.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed)) {
            logger.log('AI服务', 'AI返回格式错误：期望数组');
            return [];
        }

        return parsed.filter((item: any) =>
            item.title &&
            item.description &&
            item.columns_used &&
            item.full_mode?.code &&
            item.aggregated_mode?.sql &&
            item.aggregated_mode?.viz_code
        );
    } catch (error) {
        logger.log('AI服务', 'AI响应解析失败', { data: String(error) });
        return [];
    }
}
