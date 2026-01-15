/**
 * Skills执行模式选择器
 * 根据内存评估结果和洞察建议,选择执行full_mode或aggregated_mode
 */

import { logger } from '@/utils/logger';
import { calculateMaxRowsForPyodide } from '@/utils/memoryAssessment';
import { DuckDBEngine } from '@/db/duckdbEngine';
import { pyodideManager } from '@/services/PyodideManager';
import { ExecutionMode } from '@/utils/memoryAssessment';
import { InsightSuggestion } from '@/services/prompts/library/insight';
import { CodeEnhancer } from '@/services/prompts/guards/codeEnhancer';
import { promptRegistry } from '@/services/promptRegistry';
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
 * @param promptId Prompt ID（可选，用于查询库依赖）
 * @returns 执行结果
 */
export async function executeInsightWithMode(
    suggestion: InsightSuggestion,
    mode: ExecutionMode,
    tableName: string,
    promptId?: string
): Promise<ModeExecutionResult> {
    try {
        logger.log('Skills', `执行模式: ${mode}`, { data: { title: suggestion.title } });

        if (mode === 'full' || mode === 'sampled') {
            // full和sampled都使用full_mode代码（数据已经在Pyodide中加载）
            return await executeFullMode(suggestion, mode, tableName, promptId);
        } else {
            // aggregated模式：先DuckDB聚合，再Pyodide可视化
            return await executeAggregatedMode(suggestion, tableName, promptId);
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
    tableName: string,
    promptId?: string  // ✅ 添加promptId参数用于查询库依赖
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
        // ✅ 使用 SchemaService 获取Schema
        const { getTableSchema } = await import('@/services/schemaService');
        const schema = await getTableSchema(tableName);
        const columnCount = schema.length;
        const maxRows = calculateMaxRowsForPyodide(columnCount);

        const countResult = await db.runQuery(`SELECT COUNT(*) as total FROM ${tableName}`);
        const totalRows = Number(countResult[0]?.total || 0);

        let isLimited = false;
        if (totalRows > maxRows) {
            isLimited = true;
            logger.warn('Skills', `数据量过大（${totalRows}行），已限制到${maxRows}行（基于${columnCount}列内存评估）`);
        }

        pyodideManager.initialize();
        await pyodideManager.waitForReady();

        // ✅ 上下文检测：检查 Pyodide 中是否已有 _master_df (主副本)
        // 并行执行时必须使用副本，防止前序任务污染全局 df
        const contextCheckScript = `
import sys
has_master = '_master_df' in globals() and 'pd' in sys.modules
if has_master:
    # 每次执行前重置 df 为主副本的深拷贝
    df = _master_df.copy(deep=True)
    print("[上下文检测] True")
    print(f"[上下文信息] Resetted df from _master_df: shape={df.shape}")
else:
    print("[上下文检测] False")
`;

        const checkResult = await pyodideManager.runPython(contextCheckScript);
        // ✅ 兼容多种返回值格式（字符串、对象等）
        const resultStr = typeof checkResult === 'string'
            ? checkResult
            : (checkResult?.textOutput || String(checkResult || ''));
        const hasExistingDf = resultStr.includes('[上下文检测] True');

        if (hasExistingDf) {
            logger.log('Skills', '上下文隔离：已重置 df 为 _master_df 副本', {
                data: { contextInfo: resultStr }
            });
        } else {
            // 🆕 全新场景：从 DuckDB 加载数据并创建 _master_df
            let query = `SELECT * FROM ${tableName}`;

            if (totalRows > maxRows) {
                query = `SELECT * FROM ${tableName} LIMIT ${maxRows}`;
            }

            const data = await db.runQuery(query);

            logger.log('Skills', `[Debug] DuckDB查询结果: ${data?.length || 0} 行`);

            logger.log('Skills', '全新执行，创建 _master_df', {
                data: { rows: data.length, limited: isLimited, maxRows }
            });

            // 1. 序列化 JSON (处理 BigInt)
            const rawJson = JSON.stringify(data, (_key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            );

            // 2. 转义以嵌入 Python 字符串
            const safeJsonData = escapeJsonForPython(rawJson);

            const dataScript = `
import pandas as pd
import json
import time

try:
    start_time = time.time()
    data_json = '''${safeJsonData}'''
    # 创建主副本
    t0 = time.time()
    _master_df = pd.DataFrame(json.loads(data_json))
    t1 = time.time()
    print(f"[Perf] JSON Load & DF Create: {t1 - t0:.4f}s")
    
    # ✅ 智能类型转换：仅转换确实为数值的列，避免破坏有效文本列
    t2 = time.time()
    for col in _master_df.columns:
        converted = pd.to_numeric(_master_df[col], errors='coerce')
        # 只有当转换后至少有一个有效数值时才应用转换（避免将 'North' 等有效字符串全转为 NaN）
        if not converted.isna().all():
            _master_df[col] = converted
    t3 = time.time()
    print(f"[Perf] Type Conversion: {t3 - t2:.4f}s")

    # 创建工作副本
    t4 = time.time()
    df = _master_df.copy(deep=True)
    t5 = time.time()
    print(f"[Perf] Deep Copy: {t5 - t4:.4f}s")
    print(f"[Perf] Total Python Load Time: {t5 - start_time:.4f}s")
    
except Exception as e:
    print(f"Error loading JSON data: {str(e)}")
    raise e
`;
            await pyodideManager.runPython(dataScript);
            logger.log('Skills', `数据已加载到Pyodide (_master_df created)`, { data: { rows: data.length, limited: isLimited, maxRows } });
        }









        // ✅ code已在inflater.ts中完成AST增强,无需重复增强
        const finalCode = code;

        // ✅ 获取库依赖并传递给 Pyodide
        let requiredPackages: string[] = [];
        if (promptId) {
            const prompt = promptRegistry.getPrompt(promptId);
            if (prompt?.requiredPackages) {
                requiredPackages = prompt.requiredPackages;
                logger.log('Python库配置', '检测到库依赖', {
                    data: { promptId, packages: requiredPackages.join(', ') }
                });
            }
        }

        const result = await pyodideManager.runPython(finalCode, requiredPackages);

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
    tableName: string,
    promptId?: string  // ✅ 添加promptId参数
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

    // 4. 获取库依赖
    let requiredPackages: string[] = [];
    if (promptId) {
        const prompt = promptRegistry.getPrompt(promptId);
        if (prompt?.requiredPackages) {
            requiredPackages = prompt.requiredPackages;
            logger.log('Python库配置', '检测到库依赖（聚合模式）', {
                data: { promptId, packages: requiredPackages.join(', ') }
            });
        }
    }

    // 5. 执行增强后的viz_code生成图表
    const result = await pyodideManager.runPython(vizEnhanceResult.code, requiredPackages);


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
