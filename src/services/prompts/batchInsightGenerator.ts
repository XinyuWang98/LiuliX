// 批量洞察生成 Prompt（Pyodide Base64输出）
import { logger } from '@/utils/logger';

/**
 * 生成批量洞察建议的 AI Prompt
 */
export function generateBatchInsightsPrompt(
    columns: string[],
    rowCount: number,
    totalRows: number,
    sampleData: any[],
    t: (key: string) => string  // i18n函数
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

    const sampleJson = JSON.stringify(sampleDataCleaned);

    return `${t('prompt.batchInsight.systemRole')}

${t('prompt.batchInsight.datasetInfo')}
${t('prompt.batchInsight.columns')}${columnList}
${t('prompt.batchInsight.sampledRows')}${rowCount}${t('prompt.batchInsight.sampledRowsHint')}
${t('prompt.batchInsight.totalRows')}${totalRows}${t('prompt.batchInsight.totalRowsHint')}
${t('prompt.batchInsight.sampleData')}
${sampleJson}

${t('prompt.batchInsight.requirements')}
${t('prompt.batchInsight.dualModeIntro')}
${t('prompt.batchInsight.fullMode')}
${t('prompt.batchInsight.aggregatedMode')}

${t('prompt.batchInsight.codeStandards')}

${t('prompt.batchInsight.fullModeTitle')}
${t('prompt.batchInsight.fullModeRule1')}
${t('prompt.batchInsight.fullModeRule2')}
${t('prompt.batchInsight.fullModeRule3')}
${t('prompt.batchInsight.fullModeRule4')}

${t('prompt.batchInsight.aggregatedModeTitle')}
${t('prompt.batchInsight.aggregatedModeRule1')}
${t('prompt.batchInsight.aggregatedModeRule2')}

${t('prompt.batchInsight.outputFormat')}
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

${t('prompt.batchInsight.keyNotes')}
${t('prompt.batchInsight.note1')}
${t('prompt.batchInsight.note2')}
${t('prompt.batchInsight.note3')}
${t('prompt.batchInsight.note4')}

${t('prompt.batchInsight.generalRequirements')}
${t('prompt.batchInsight.req1')}
${t('prompt.batchInsight.req2')}

${t('prompt.batchInsight.codeNorms')}
${t('prompt.batchInsight.codeNorm1')}
${t('prompt.batchInsight.codeNorm2')}
${t('prompt.batchInsight.codeNorm3')}
${t('prompt.batchInsight.codeNorm4')}

${t('prompt.batchInsight.codeTemplate')}
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

${t('prompt.batchInsight.outputFormat')}
[
    {
        "title": "年龄分布",
        "description": "用户年龄集中在25-35岁", 
        "columns_used": ["age"],
        "full_mode": { "code": "..." },
        "aggregated_mode": { "sql": "...", "viz_code": "..." }
    }
]

${t('prompt.batchInsight.finalInstruction')}`;
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

        // ✅ P0修复：尝试修复截断的JSON
        cleaned = attemptJSONRepair(cleaned);

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
        logger.error('AI服务', 'AI响应解析失败', error);
        // ✅ 增强日志：显示截断位置
        const preview = aiResponse.substring(0, 500);
        const suffix = aiResponse.substring(Math.max(0, aiResponse.length - 100));
        logger.log('AI服务', 'AI响应预览', { data: `开头: ${preview}...\n结尾: ...${suffix}` });
        return [];
    }
}

/**
 * 尝试修复截断的JSON响应
 * 如果JSON字符串未正确结束，尝试补全
 * 同时修复AI生成代码中的控制字符问题
 */
function attemptJSONRepair(jsonStr: string): string {
    let trimmed = jsonStr.trim();

    // 🔧 移除危险的正则替换逻辑，避免破坏JSON结构
    // 现在的LLM通常能生成合法的JSON转义，如果生成了未转义的换行符，简单的正则很难完美修复
    // 我们信任LLM的输出，或者只处理截断问题

    // 检查是否以完整的}或]结尾
    if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
        logger.warn('AI服务', 'JSON响应可能被截断，尝试修复');

        // 找到最后一个完整的对象（以},结尾）
        const lastCompleteObj = trimmed.lastIndexOf('},');
        if (lastCompleteObj > 0) {
            // 截取到最后一个完整对象，并补充结尾
            const repaired = trimmed.substring(0, lastCompleteObj + 1) + ']';
            logger.log('AI服务', 'JSON修复成功', { data: `原长度: ${jsonStr.length}, 修复后: ${repaired.length}` });
            return repaired;
        }
    }

    return trimmed;
}
