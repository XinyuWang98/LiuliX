/**
 * 洞察链类型定义
 * 用于分析假设生成、洞察挖掘、证据采纳的核心数据结构
 */

// 图表类型枚举
export type ChartType =
    | 'histogram'      // 直方图（分布）
    | 'scatter'        // 散点图（相关性）
    | 'bar'            // 柱状图（对比）
    | 'line'           // 折线图（趋势）
    | 'box'            // 箱线图（离群值）
    | 'table';         // 表格（降级方案）

// 代码语言类型
export type CodeLanguage = 'python' | 'sql';

// 假设卡片结构
export interface HypothesisCard {
    id: string;                          // 唯一标识符
    title: string;                       // 假设标题（如"收入随年龄上涨"）
    description: string;                 // 假设详细描述
    verificationMethod: string;          // 验证方式（如"计算相关系数"）
    isExpanded: boolean;                 // 是否展开显示洞察节点
    // 🆕 P0 新增：批量执行结果（Pyodide Base64输出）
    executionResult?: {
        image: string;                   // Base64图片: data:image/png;base64,...
        summary: string;                 // 统计摘要文本
        code: string;                    // 生成的Python代码
    };
    executionStatus?: 'pending' | 'success' | 'error'; // 执行状态
}

// Chart.js 图表数据结构
export interface ChartData {
    labels: string[];                    // X 轴标签
    datasets: Array<{
        label: string;                     // 数据集名称
        data: number[];                    // 数据点
        backgroundColor?: string | string[]; // 背景色
        borderColor?: string;              // 边框色
        borderWidth?: number;              // 边框宽度
    }>;
}

// 洞察节点结构
export interface InsightNode {
    id: string;                          // 唯一标识符
    hypothesisId: string;                // 所属假设卡 ID
    parentId?: string;                   // 父节点 ID（深挖链）
    chartType: ChartType;                // 图表类型
    chartData?: ChartData;               // Chart.js 数据（如果有图表）
    tableData?: Array<Record<string, any>>; // 表格数据（降级方案）
    conclusion: string;                  // 一句话结论
    code: string;                        // 生成的代码
    codeLanguage: CodeLanguage;          // 代码语言
    timestamp: number;                   // 生成时间戳
    isAdopted: boolean;                  // 是否已采纳
}

// 完整洞察链结构
export interface InsightChain {
    hypothesis: HypothesisCard;          // 假设卡片
    insights: InsightNode[];             // 洞察节点列表（树状结构）
    isAdopted: boolean;                  // 整条链是否已采纳
    timestamp: number;                   // 创建时间戳
}

// 图表类型推断映射表
export const CHART_TYPE_KEYWORDS: Record<string, ChartType> = {
    // 分布关键词
    '分布': 'histogram',
    '分布图': 'histogram',
    '直方图': 'histogram',
    '频率': 'histogram',

    // 相关性关键词
    '相关': 'scatter',
    '散点': 'scatter',
    '散点图': 'scatter',
    '回归': 'scatter',
    '关系': 'scatter',

    // 对比关键词
    '对比': 'bar',
    '比较': 'bar',
    '分组': 'bar',
    '柱状图': 'bar',

    // 趋势关键词
    '趋势': 'line',
    '时间': 'line',
    '变化': 'line',
    '折线图': 'line',

    // 离群值关键词
    '离群': 'box',
    '异常': 'box',
    '箱线图': 'box',
};

// 根据假设描述推断图表类型
export function inferChartType(description: string): ChartType {
    for (const [keyword, chartType] of Object.entries(CHART_TYPE_KEYWORDS)) {
        if (description.includes(keyword)) {
            return chartType;
        }
    }
    // 默认降级到表格
    return 'table';
}
