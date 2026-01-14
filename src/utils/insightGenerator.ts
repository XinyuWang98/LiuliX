import { DuckDBEngine } from '../db/duckdbEngine';
import { sampleDataForAI } from '@/utils/sampleData';
import { askAIInsight } from '../services/aiService';
import { logger } from './logger';

/**
 * 生成批量洞察建议的Prompt
 */
function generateBatchInsightsPrompt(columns: string[], rowCount: number, sampledData: any[]): string {
    // 🔧 方案1优化：适当减少行数（保留所有列）
    // 不限制列数，AI可以看到完整数据结构

    // 🔧 修复BigInt序列化问题：将BigInt转换为字符串
    const serializableSample = sampledData.map(row => {
        const newRow: any = {};
        for (const key in row) {
            const value = row[key];
            newRow[key] = typeof value === 'bigint' ? value.toString() : value;
        }
        return newRow;
    });

    // 🔧 发送前30行数据（平衡精度、大小和响应时间）
    const limitedSample = serializableSample.slice(0, 30);

    // 🆕 方案1：分析列类型和唯一值（只统计分类列）
    const columnStats = analyzeColumnTypes(limitedSample, columns);
    const numericCols = columnStats.numeric.map(c => c.name);
    const categoricalCols = columnStats.categorical;

    // 构建列统计信息
    let columnStatsText = '';
    if (numericCols.length > 0) {
        columnStatsText += `  * 数值列：${numericCols.length}个（如：${numericCols.slice(0, 5).join(', ')}${numericCols.length > 5 ? '...' : ''}）\n`;
    }
    if (categoricalCols.length > 0) {
        const catInfo = categoricalCols.map(c => `${c.name}(${c.uniqueCount})`).join(', ');
        columnStatsText += `  * 分类列：${categoricalCols.length}个，唯一值统计：${catInfo}`;
    }

    return `你是一个专业的数据分析专家。请基于以下数据集进行【深度洞察分析】。

**数据集概况**：
- 总行数：${rowCount}
- 总列数：${columns.length}
- 列统计：
${columnStatsText}
- 采样数据（前30行）：
${JSON.stringify(limitedSample, null, 2)}

**分析重点**：
1. 📊 相关性分析：探索变量间的关系（相关系数、散点图、热力图）
2. ⚠️ 异常检测：识别离群点或异常模式（Z-score、IQR方法）
3. 📈 趋势分析：如有时间列，分析时间序列趋势和季节性
4. 🔍 分组对比：利用分类列进行分组对比分析（如不同类别的表现差异）
5. 🎲 模式发现：聚类分析、分布特征、隐藏规律

**严格要求**：
1. 每条洞察必须包含可执行的Python代码
2. 代码必须使用pandas DataFrame（变量名为df）
3. 返回JSON数组格式：[{"title": "标题", "description": "描述", "code": "Python代码"}]
4. ⚠️ 禁止输出基础统计（均值、中位数、标准差、缺失率等已在数据清洗模块提供）
5. 必须聚焦于：关系挖掘、异常发现、趋势预测、分组洞察、聚类分析
6. 生成3-5条有实际业务价值的深度洞察
7. 可以分析所有${columns.length}列

请直接返回JSON，不要额外说明。`;
}

/**
 * 🆕 分析列类型（区分数值列和分类列）
 */
function analyzeColumnTypes(sample: any[], columns: string[]) {
    const numeric: { name: string }[] = [];
    const categorical: { name: string; uniqueCount: number }[] = [];

    for (const col of columns) {
        const values = sample.map(row => row[col]).filter(v => v !== null && v !== undefined);
        if (values.length === 0) continue;

        // 判断是否为数值列
        const isNumeric = values.every(v => typeof v === 'number' || !isNaN(Number(v)));

        if (isNumeric) {
            numeric.push({ name: col });
        } else {
            // 分类列：统计唯一值数量
            const uniqueValues = new Set(values);
            if (uniqueValues.size <= 20) { // 只记录唯一值较少的分类列
                categorical.push({ name: col, uniqueCount: uniqueValues.size });
            }
        }
    }

    return { numeric, categorical };
}

/**
 * 解析AI返回的批量洞察响应
 */
function parseBatchInsightsResponse(aiResponse: string): Array<{ title: string; description: string; code: string }> {
    try {
        // 提取JSON内容（去除markdown代码块标记）
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            logger.warn('AI洞察', 'JSON格式提取失败');
            return [];
        }

        const jsonContent = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonContent);

        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        logger.error('AI洞察', 'JSON解析失败', err);
        return [];
    }
}

/**
 * 🆕 独立的洞察生成函数（用于预加载）
 * @param tableName DuckDB表名
 * @param columns 列名数组
 * @param rowCount 总行数
 * @returns 洞察建议数组
 */
export async function generateInsightSuggestions(
    tableName: string,
    columns: string[] = [],
    rowCount: number = 0
): Promise<Array<{ title: string; description: string; code: string; result?: any }>> {
    try {
        logger.group('AI洞察预加载', '批量生成流程');

        // 步骤1：获取列信息（如果未提供）
        let validColumns = columns;
        if (validColumns.length === 0) {
            logger.log('DuckDB', `从DESCRIBE获取列信息 表:${tableName}`);
            const engine = DuckDBEngine.getInstance();
            await engine.init();
            const describeResult = await engine.runQuery(`DESCRIBE ${tableName}`);
            validColumns = describeResult.map((row: any) => row.column_name);
            logger.log('DuckDB', `DESCRIBE成功`, { count: validColumns.length });
        }

        // 步骤2：采样数据
        logger.log('AI洞察', '开始数据采样');
        const { sampledData } = await sampleDataForAI(tableName, 1000);
        logger.log('AI洞察', `数据采样成功`, { count: sampledData.length });

        // 步骤3：调用AI生成
        logger.log('AI洞察', '调用AI生成洞察建议');
        const prompt = generateBatchInsightsPrompt(validColumns, rowCount, sampledData);
        const aiResult = await askAIInsight(prompt);
        const aiResponse = aiResult.content;

        // 步骤4：解析响应
        const insights = parseBatchInsightsResponse(aiResponse);
        logger.log('AI洞察', `AI生成成功`, { count: insights.length });

        logger.groupEnd();
        return insights;

    } catch (error) {
        logger.groupEnd();
        logger.error('AI洞察预加载', '生成失败', error);
        return []; // 预加载失败不影响主流程
    }
}
