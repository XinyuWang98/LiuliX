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
 * @returns Prompt 字符串
 */
export function 生成洞察Prompt(
    假设描述: string,
    数据字段列表: string[],
    用户指令: string,
    代码语言: CodeLanguage = 'python'
): string {
    const 字段文本 = 数据字段列表.join(', ');
    const 语言提示 = 代码语言 === 'python' ? 'Python (pandas)' : 'SQL (DuckDB)';

    return `
你是一个专业的数据分析师，当前正在验证以下假设：

假设：${假设描述}
可用字段：${字段文本}
用户指令：${用户指令}

请根据用户指令生成洞察分析，输出必须是纯 JSON，严格符合以下结构（不要任何解释、markdown、\`\`\`json 标记）：

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

要求：
1. 图表类型根据用户指令选择（散点/柱状/折线/直方图/箱线图）
2. 如果无法生成图表，chartType 设为 "table"，并填充 tableData（数组，每项是一个对象）
3. chartData.labels 和 datasets[0].data 长度必须一致
4. conclusion 必须是一句话，不超过 50 字
5. code 必须是完整可运行的 ${语言提示} 代码，带中文注释
6. 只输出纯 JSON，不要任何其他文字
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
