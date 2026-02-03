/**
 * Apache Arrow大数据量POC测试
 * 
 * 测试目标：
 * 1. 验证Arrow在50万/100万/200万行数据下的性能
 * 2. 对比移除采样限制前后的表现
 * 3. 评估是否可以突破10万行限制
 */

import { DuckDBEngine } from '@/db/duckdbEngine';
import { pyodideManager } from '@/services/PyodideManager';
import { PYODIDE_BRIDGE_INIT_CODE } from '@/workers/pyodideArrowBridge';
import { logger } from '@/utils/logger';

interface TestResult {
    rowCount: number;
    method: 'JSON' | 'Arrow';
    success: boolean;
    totalTime?: string;
    dataSize?: number;
    pythonLoadTime?: number;
    error?: string;
    memoryPeak?: number;
}

/**
 * 生成大数据量CSV测试文件
 */
async function generateLargeCSV(rows: number, cols: number = 8): Promise<File> {
    logger.log('数据准备', `生成${(rows / 10000).toFixed(1)}万行 x ${cols}列测试数据`);

    const headers = Array.from({ length: cols }, (_, i) => `col_${i + 1}`);
    let csvContent = headers.join(',') + '\n';

    for (let i = 0; i < rows; i++) {
        const row = Array.from({ length: cols }, () => Math.random() * 1000);
        csvContent += row.join(',') + '\n';

        // 每10万行报告进度
        if ((i + 1) % 100000 === 0) {
            logger.log('数据准备', `进度: ${((i + 1) / rows * 100).toFixed(1)}%`);
        }
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], `test_${rows}_rows.csv`, { type: 'text/csv' });

    logger.log('数据准备', `CSV生成完成`, {
        data: {
            size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
            rows,
            cols
        }
    });

    return file;
}

/**
 * 测试JSON传输方式
 */
async function testJSON(tableName: string, maxRows: number): Promise<TestResult> {
    try {
        const db = DuckDBEngine.getInstance();
        const jsonStartTime = performance.now();

        // 🔍 关键：这里可以控制是否有采样限制
        const query = maxRows > 0
            ? `SELECT * FROM ${tableName} LIMIT ${maxRows}`
            : `SELECT * FROM ${tableName}`; // 无限制

        const jsonData = await db.runQuery(query);
        const actualRows = jsonData.length;

        const rawJson = JSON.stringify(jsonData, (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        const jsonLoadScript = `
import pandas as pd
import json
import time

start = time.time()
data_json = '''${rawJson.replace(/\\/g, '\\\\').replace(/'''/g, "\\'\\'\\'")}'''
df_json = pd.DataFrame(json.loads(data_json))
end = time.time()

result = {
    "rows": len(df_json),
    "cols": len(df_json.columns),
    "load_time": end - start
}
print(json.dumps(result))
`;
        const pythonResult = JSON.parse(await pyodideManager.runPython(jsonLoadScript));
        const jsonEndTime = performance.now();

        return {
            rowCount: actualRows,
            method: 'JSON',
            success: true,
            totalTime: ((jsonEndTime - jsonStartTime) / 1000).toFixed(3),
            dataSize: rawJson.length,
            pythonLoadTime: pythonResult.load_time
        };
    } catch (error: any) {
        return {
            rowCount: maxRows,
            method: 'JSON',
            success: false,
            error: error.message
        };
    }
}

/**
 * 测试Arrow传输方式
 */
async function testArrow(tableName: string, maxRows: number): Promise<TestResult> {
    try {
        const db = DuckDBEngine.getInstance();
        const arrowStartTime = performance.now();

        // 🔍 关键：Arrow方案也支持无限制
        const arrowBuffer = maxRows > 0
            ? await db.exportArrowTable(tableName, maxRows)
            : await db.exportArrowTable(tableName);

        const pyodide = (pyodideManager as any).pyodide;
        if (!pyodide) throw new Error('Pyodide not ready');

        pyodide.registerJsModule('arrow_transfer', { buffer: arrowBuffer });

        const arrowLoadScript = `
import json
import time
from js import arrow_transfer

start = time.time()
df_arrow = load_arrow_stream(arrow_transfer.buffer)
end = time.time()

result = {
    "rows": len(df_arrow),
    "cols": len(df_arrow.columns),
    "load_time": end - start
}
print(json.dumps(result))
`;
        const pythonResult = JSON.parse(await pyodideManager.runPython(arrowLoadScript));
        const arrowEndTime = performance.now();

        return {
            rowCount: pythonResult.rows,
            method: 'Arrow',
            success: true,
            totalTime: ((arrowEndTime - arrowStartTime) / 1000).toFixed(3),
            dataSize: arrowBuffer.length,
            pythonLoadTime: pythonResult.load_time
        };
    } catch (error: any) {
        return {
            rowCount: maxRows,
            method: 'Arrow',
            success: false,
            error: error.message
        };
    }
}

/**
 * 完整测试流程
 */
export async function runLargeDataPOC() {
    logger.group('AI服务', '🚀 大数据量Arrow POC测试');

    const testCases = [
        { rows: 100000, desc: '10万行(当前限制)' },
        { rows: 500000, desc: '50万行' },
        { rows: 1000000, desc: '100万行' },
        { rows: 2000000, desc: '200万行' }
    ];

    const allResults: any[] = [];

    try {
        const db = DuckDBEngine.getInstance();
        await db.init();

        pyodideManager.initialize();
        await pyodideManager.waitForReady();
        await pyodideManager.runPython(PYODIDE_BRIDGE_INIT_CODE);

        for (const testCase of testCases) {
            logger.group('数据分析', `📊 测试 ${testCase.desc}`);

            // 生成测试数据
            const file = await generateLargeCSV(testCase.rows, 8);

            // 导入DuckDB
            logger.log('DuckDB', '导入数据到DuckDB');
            await db.ingestCSV(file);
            const tableName = `t_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

            // 🎯 关键测试：对比有/无采样限制
            logger.log('数据分析', '场景1: 有10万行采样限制');
            const jsonLimited = await testJSON(tableName, 100000);
            const arrowLimited = await testArrow(tableName, 100000);

            logger.log('数据分析', `场景2: 无采样限制（全量${testCase.rows}行）`);
            const arrowUnlimited = await testArrow(tableName, 0); // 0表示无限制

            const caseResult = {
                scenario: testCase.desc,
                totalRows: testCase.rows,
                withLimit: {
                    json: jsonLimited,
                    arrow: arrowLimited
                },
                noLimit: {
                    arrow: arrowUnlimited
                }
            };

            allResults.push(caseResult);

            // 输出对比
            logger.log('数据分析', '性能对比', {
                data: {
                    '10万行-JSON': `${jsonLimited.totalTime}s (${(jsonLimited.dataSize! / 1024 / 1024).toFixed(2)}MB)`,
                    '10万行-Arrow': `${arrowLimited.totalTime}s (${(arrowLimited.dataSize! / 1024 / 1024).toFixed(2)}MB)`,
                    '全量-Arrow': arrowUnlimited.success
                        ? `${arrowUnlimited.totalTime}s (${(arrowUnlimited.dataSize! / 1024 / 1024).toFixed(2)}MB)`
                        : `失败: ${arrowUnlimited.error}`
                }
            });

            logger.groupEnd();
        }

        logger.groupEnd();
        return allResults;

    } catch (error: any) {
        logger.error('AI服务', '测试失败', error);
        logger.groupEnd();
        return null;
    }
}
