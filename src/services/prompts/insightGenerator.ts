/**
 * 洞察生成 Prompt 模板
 * 用于深挖输入框的用户指令解析和洞察生成
 */

import { ChartType, CodeLanguage } from '@/types/insightChain';

/**
 * 洞察生成结果接口
 */
export interface 洞察结果 {
    chartType: ChartType;              // 图表类型
    chartData?: {                      // Chart.js 数据（如果有图表）
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            backgroundColor?: string | string[];
            borderColor?: string;
        }>;
    };
    tableData?: Array<Record<string, any>>; // 表格数据（降级方案）
    conclusion: string;                // 一句话结论
    code: string;                      // 生成的代码
    codeLanguage: CodeLanguage;        // 代码语言
}

/**
 * 生成洞察的 Prompt
 * @param 假设描述 - 当前假设的描述
 * @param 数据字段列表 - 数据集的列名数组
 * @param 用户指令 - 用户输入的深挖指令（如"用 age 和 salary 做散点图"）
 * @param 代码语言 - 优先生成的代码语言
 * @param t - i18n翻译函数
 * @returns Prompt 字符串
 */
export function 生成洞察Prompt(
    假设描述: string,
    数据字段列表: string[],
    用户指令: string,
    代码语言: CodeLanguage = 'python',
    t: (key: string) => string  // i18n函数
): string {
    const 字段文本 = 数据字段列表.join(', ');
    const 语言提示 = 代码语言 === 'python' ? 'Python (pandas)' : 'SQL (DuckDB)';

    return `
${t('prompt.insightGen.systemRole')}

${t('prompt.insightGen.hypothesis')}${假设描述}
${t('prompt.insightGen.availableFields')}${字段文本}
${t('prompt.insightGen.userInstruction')}${用户指令}

${t('prompt.insightGen.outputInstruction')}

{
  "chartType": "scatter | histogram | bar | line | box | table",
  "chartData": {
    "labels": ["X轴标签1", "X轴标签2", ...],
    "datasets": [{
      "label": "数据集名称",
      "data": [数值1, 数值2, ...],
      "backgroundColor": "rgba(75,192,192,0.4)",
      "borderColor": "rgba(75,192,192,1)"
    }]
  },
  "conclusion": "一句话中文结论，例如：age 和 salary 呈正相关，相关系数 0.68",
  "code": "${语言提示} 代码字符串（带注释）",
  "codeLanguage": "${代码语言}"
}

${t('prompt.insightGen.requirements')}
${t('prompt.insightGen.req1')}
${t('prompt.insightGen.req2')}
${t('prompt.insightGen.req3')}
${t('prompt.insightGen.req4')}
${t('prompt.insightGen.req5Prefix')}${语言提示}${t('prompt.insightGen.req5Suffix')}
${t('prompt.insightGen.req6')}
`.trim();
}

/**
 * 解析 AI 返回的洞察结果
 * @param AI返回结果 - Gemini API 返回的原始文本
 * @returns 结构化洞察结果，解析失败返回 null
 */
export function 解析洞察结果(AI返回结果: string): 洞察结果 | null {
    try {
        let jsonStr = AI返回结果.trim();

        // 去除可能的 markdown 代码块标记
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonStr);

        // 基本校验
        if (
            parsed &&
            typeof parsed === 'object' &&
            parsed.chartType &&
            parsed.conclusion &&
            parsed.code &&
            parsed.codeLanguage
        ) {
            // 如果 chartType 是 table，必须有 tableData
            if (parsed.chartType === 'table' && !parsed.tableData) {
                console.warn('图表类型为 table 但缺少 tableData');
                return null;
            }

            // 如果 chartType 不是 table，必须有 chartData
            if (parsed.chartType !== 'table' && !parsed.chartData) {
                console.warn('图表类型不是 table 但缺少 chartData');
                return null;
            }

            return parsed as 洞察结果;
        }

        return null;
    } catch (e) {
        console.warn('洞察结果解析失败', e);
        return null;
    }
}
