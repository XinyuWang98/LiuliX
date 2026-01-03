/**
 * Skills执行模式选择器
 * 根据内存评估结果和洞察建议,选择执行full_mode或aggregated_mode
 */

import { logger } from '@/utils/logger';
import { calculateMaxRowsForPyodide } from '@/utils/memoryAssessment';
import { DuckDBEngine } from '@/db/duckdbEngine';
import { pyodideManager } from '@/services/PyodideManager';
import { ExecutionMode } from '@/utils/memoryAssessment';
import { InsightSuggestion } from '@/services/prompts/batchInsightGenerator';
import { CodeEnhancer } from '@/services/prompts/guards/codeEnhancer';
// import { validatePythonCode, formatValidationResult } from '@/utils/pythonCodeValidator';
// import { smartFixPythonCode } from '@/utils/pythonCodeSanitizer';

export interface ModeExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    mode: ExecutionMode;
}

/**
 * 根据执行模式执行洞察建议
 * @param suggestion AI生成的洞察建议（包含双模式）
 * @param mode 内存评估决定的执行模式
 * @param tableName 当前表名
 * @returns 执行结果
 */
export async function executeInsightWithMode(
    suggestion: InsightSuggestion,
    mode: ExecutionMode,
    tableName: string
): Promise<ModeExecutionResult> {
    try {
        logger.log('Skills', `执行模式: ${mode}`, { data: { title: suggestion.title } });

        if (mode === 'full' || mode === 'sampled') {
            // full和sampled都使用full_mode代码（数据已经在Pyodide中加载）
            return await executeFullMode(suggestion, mode, tableName);  // ✅ 传递tableName
        } else {
            // aggregated模式：先DuckDB聚合，再Pyodide可视化
            return await executeAggregatedMode(suggestion, tableName);
        }
    } catch (error: any) {
        logger.error('Skills', `执行失败 (${mode})`, error);
        return {
            success: false,
            error: error.message,
            mode
        };
    }
}

/**
 * 为 Python 字符串字面量转义 JSON 字符串
 * Python 的 json.loads 需要一个合法的 JSON 字符串
 * 但这个 JSON 字符串是嵌入在 Python 代码的 '''...''' 中的
 * 因此需要处理转义字符和三引号
 */
function escapeJsonForPython(jsonStr: string): string {
    return jsonStr
        .replace(/\\/g, '\\\\') // 将 \ 变为 \\ (让 Python 看到字面量的 \)
        .replace(/'''/g, "\\'\\'\\'"); // 转义三引号，防止提前闭合
}

/**
 * 执行全量模式（full/sampled）
 */
async function executeFullMode(
    suggestion: InsightSuggestion,
    mode: ExecutionMode,
    tableName: string  // ✅ 添加tableName参数
): Promise<ModeExecutionResult> {
    if (!tableName) {
        throw new Error('Table name is required for full mode execution');
    }

    const code = suggestion.full_mode.code;

    logger.log('Skills', `执行full_mode代码`, { data: { codeLength: code.length } });

    // ✅ 从DuckDB导出数据到Pyodide
    const db = DuckDBEngine.getInstance();
    await db.init();

    try {
        // ✅ 优化：使用动态内存计算替代魔法数字
        const schema = await db.runQuery(`DESCRIBE ${tableName}`);
        const columnCount = schema.length;
        const maxRows = calculateMaxRowsForPyodide(columnCount);

        const countResult = await db.runQuery(`SELECT COUNT(*) as total FROM ${tableName}`);
        const totalRows = Number(countResult[0]?.total || 0);

        let query = `SELECT * FROM ${tableName}`;
        let isLimited = false;

        if (totalRows > maxRows) {
            query = `SELECT * FROM ${tableName} LIMIT ${maxRows}`;
            isLimited = true;
            logger.warn('Skills', `数据量过大（${totalRows}行），已限制到${maxRows}行（基于${columnCount}列内存评估）`);
        }

        const data = await db.runQuery(query);

        pyodideManager.initialize();
        await pyodideManager.waitForReady();

        // 1. 序列化 JSON (处理 BigInt)
        const rawJson = JSON.stringify(data, (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        // 2. 转义以嵌入 Python 字符串
        const safeJsonData = escapeJsonForPython(rawJson);

        const dataScript = `
import pandas as pd
import json

try:
    data_json = '''${safeJsonData}'''
    df = pd.DataFrame(json.loads(data_json))
    
    # ✅ 自动类型转换：将可转换的列转为数值类型（兜底防御）
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
except Exception as e:
    print(f"Error loading JSON data: {str(e)}")
    raise e
`;
        await pyodideManager.runPython(dataScript);
        logger.log('Skills', `数据已加载到Pyodide`, { data: { rows: data.length, limited: isLimited, maxRows } });







        // ✅ 代码增强：注入防御性逻辑（零Token成本）
        const columnNames = schema.map((row: any) => row.column_name);
        const enhanceResult = await CodeEnhancer.enhance(code, {
            columns: columnNames,
            dfName: 'df',
            promptType: suggestion.title // 用于场景化增强
        });

        logger.log('AI代码增强', '增强完成', {
            data: {
                rulesApplied: enhanceResult.rulesApplied.length,
                originalLength: enhanceResult.originalLength,
                enhancedLength: enhanceResult.enhancedLength
            }
        });

        const finalCode = enhanceResult.code;

        const result = await pyodideManager.runPython(finalCode);

        return {
            success: true,
            data: result, // 包含 plotImage, textOutput 等所有字段
            mode
        };
    } catch (error) {
        logger.error('Skills', `full_mode执行失败`, { error });
        throw error;
    }
}

/**
 * 执行聚合模式（aggregated）
 */
async function executeAggregatedMode(
    suggestion: InsightSuggestion,
    tableName: string
): Promise<ModeExecutionResult> {
    const { sql, viz_code } = suggestion.aggregated_mode;

    // 替换表名占位符
    const actualSQL = sql.replace(/__TABLE_NAME__/g, tableName);

    logger.log('Skills', 'DuckDB预聚合', { data: { sql: actualSQL } });

    // 1. 执行DuckDB SQL聚合
    const db = DuckDBEngine.getInstance();
    await db.init();

    let aggregatedData: any[];
    try {
        aggregatedData = await db.runQuery(actualSQL);
        logger.log('Skills', `聚合结果: ${aggregatedData.length}行`);
    } catch (error: any) {
        throw new Error(`DuckDB聚合失败: ${error.message}`);
    }

    // 2. 将聚合数据加载到Pyodide
    pyodideManager.initialize();
    await pyodideManager.waitForReady();

    // 转换为JSON并加载为pandas DataFrame
    const dataScript = `
import pandas as pd
import json

# 加载聚合数据
data_json = '''${JSON.stringify(aggregatedData)}'''
df = pd.DataFrame(json.loads(data_json))
`;

    await pyodideManager.runPython(dataScript);
    logger.log('Skills', '聚合数据已加载到Pyodide');

    // 3. 代码增强：为viz_code注入防御性逻辑
    const aggColumnNames = aggregatedData.length > 0 ? Object.keys(aggregatedData[0]) : [];
    const vizEnhanceResult = await CodeEnhancer.enhance(viz_code, {
        columns: aggColumnNames,
        dfName: 'df',
        promptType: 'aggregated_viz'
    });

    logger.log('AI代码增强', 'Viz代码增强完成', {
        data: { rulesApplied: vizEnhanceResult.rulesApplied.length }
    });

    // 4. 执行增强后的viz_code生成图表
    const result = await pyodideManager.runPython(vizEnhanceResult.code);


    // 解析结果
    try {
        const parsed = JSON.parse(result);
        return {
            success: true,
            data: {
                ...parsed,
                aggregatedRows: aggregatedData.length,
                sql: actualSQL
            },
            mode: 'aggregated'
        };
    } catch {
        return {
            success: true,
            data: { output: result, aggregatedRows: aggregatedData.length },
            mode: 'aggregated'
        };
    }
}
