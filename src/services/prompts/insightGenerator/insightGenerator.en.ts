/**
 * 洞察生成 Prompt 模板 - 英文版本
 */

import { ChartType, CodeLanguage } from '@/types/insightChain';

/**
 * 洞察生成结果接口
 */
export interface 洞察结果 {
    chartType: ChartType;
    chartData?: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            backgroundColor?: string | string[];
            borderColor?: string;
        }>;
    };
    tableData?: Array<Record<string, any>>;
    conclusion: string;
    code: string;
    codeLanguage: CodeLanguage;
}

/**
 * Generate Insight Prompt (English Version)
 */
export function 生成洞察PromptInternal(
    假设描述: string,
    数据字段列表: string[],
    用户指令: string,
    代码语言: CodeLanguage = 'python'
): string {
    const 字段文本 = 数据字段列表.join(', ');
    const 语言提示 = 代码语言 === 'python' ? 'Python (pandas)' : 'SQL (DuckDB)';

    return `
You are a professional data analysis assistant.

【Current Hypothesis】${假设描述}
【Available Fields】${字段文本}
【User Instruction】${用户指令}

Generate an insight analysis based on the user instruction and return JSON format:

{
  "chartType": "scatter | histogram | bar | line | box | table",
  "chartData": {
    "labels": ["X Label 1", "X Label 2", ...],
    "datasets": [{
      "label": "Dataset Name",
      "data": [value1, value2, ...],
      "backgroundColor": "rgba(75,192,192,0.4)",
      "borderColor": "rgba(75,192,192,1)"
    }]
  },
  "conclusion": "One-sentence conclusion in English, e.g., age and salary show positive correlation with coefficient 0.68",
  "code": "${语言提示} code string (with comments)",
  "codeLanguage": "${代码语言}"
}

【Requirements】
1. chartType must be one of the types listed above
2. If chartType is table, return tableData instead of chartData
3. conclusion must be a one-sentence summary in English
4. chartData labels and data must have the same length
5. code must be executable ${语言提示} code
6. Return only JSON, no other content
`.trim();
}

/**
 * Parse AI Insight Response
 */
export function 解析洞察结果(AI返回结果: string): 洞察结果 | null {
    try {
        let jsonStr = AI返回结果.trim();

        // Remove possible markdown code block markers
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonStr);

        // Basic validation
        if (
            parsed &&
            typeof parsed === 'object' &&
            parsed.chartType &&
            parsed.conclusion &&
            parsed.code &&
            parsed.codeLanguage
        ) {
            // If chartType is table, must have tableData
            if (parsed.chartType === 'table' && !parsed.tableData) {
                console.warn('Chart type is table but missing tableData');
                return null;
            }

            // If chartType is not table, must have chartData
            if (parsed.chartType !== 'table' && !parsed.chartData) {
                console.warn('Chart type is not table but missing chartData');
                return null;
            }

            return parsed as 洞察结果;
        }

        return null;
    } catch (e) {
        console.warn('Failed to parse insight result', e);
        return null;
    }
}
