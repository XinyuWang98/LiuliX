/**
 * Apache Arrow POC测试脚本
 * 
 * 目标：验证Arrow零拷贝传输的可行性
 * 测试场景：DuckDB → Arrow IPC → Pyodide → Pandas
 */

import { DuckDBEngine } from '@/db/duckdbEngine';
import { pyodideManager } from '@/services/PyodideManager';
import { PYODIDE_BRIDGE_INIT_CODE } from '@/workers/pyodideArrowBridge';
import { logger } from '@/utils/logger';

export async function testArrowPOC(tableName: string, maxRows: number = 10000) {
    logger.group('Arrow POC', '开始测试');

    try {
        const db = DuckDBEngine.getInstance();
        await db.init();

        // 初始化Pyodide
        pyodideManager.initialize();
        await pyodideManager.waitForReady();

        // 初始化Arrow Bridge
        logger.log('Arrow POC', '初始化Arrow Bridge');
        await pyodideManager.runPython(PYODIDE_BRIDGE_INIT_CODE);

        // ========== 方案1：JSON传输（当前方案）==========
        logger.log('Arrow POC', '测试方案1: JSON传输');
        const jsonStartTime = performance.now();

        const jsonData = await db.runQuery(`SELECT * FROM ${tableName} LIMIT ${maxRows}`);
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
    "load_time": end - start,
    "method": "JSON"
}
print(json.dumps(result))
`;
        const jsonResult = await pyodideManager.runPython(jsonLoadScript);
        const jsonEndTime = performance.now();
        const jsonTotalTime = ((jsonEndTime - jsonStartTime) / 1000).toFixed(3);

        logger.log('Arrow POC', `JSON方案完成`, {
            data: {
                totalTime: `${jsonTotalTime}s`,
                dataSize: `${(rawJson.length / 1024 / 1024).toFixed(2)}MB`,
                result: jsonResult
            }
        });

        // ========== 方案2：Arrow传输 ==========
        logger.log('Arrow POC', '测试方案2: Arrow传输');
        const arrowStartTime = performance.now();

        // 导出Arrow IPC
        const arrowBuffer = await db.exportArrowTable(tableName, maxRows);
        logger.log('Arrow POC', `Arrow导出完成`, {
            data: {
                bufferSize: `${(arrowBuffer.length / 1024 / 1024).toFixed(2)}MB`,
                rows: maxRows
            }
        });

        // 注册到Pyodide
        const pyodide = (pyodideManager as any).pyodide;
        if (!pyodide) {
            throw new Error('Pyodide not ready');
        }

        pyodide.registerJsModule('arrow_transfer', {
            buffer: arrowBuffer
        });

        // Python侧加载
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
    "load_time": end - start,
    "method": "Arrow"
}
print(json.dumps(result))
`;
        const arrowResult = await pyodideManager.runPython(arrowLoadScript);
        const arrowEndTime = performance.now();
        const arrowTotalTime = ((arrowEndTime - arrowStartTime) / 1000).toFixed(3);

        logger.log('Arrow POC', `Arrow方案完成`, {
            data: {
                totalTime: `${arrowTotalTime}s`,
                bufferSize: `${(arrowBuffer.length / 1024 / 1024).toFixed(2)}MB`,
                result: arrowResult
            }
        });

        // ========== 性能对比 ==========
        const speedup = (parseFloat(jsonTotalTime) / parseFloat(arrowTotalTime)).toFixed(2);
        const compressionRatio = ((rawJson.length / arrowBuffer.length) * 100).toFixed(1);

        logger.groupEnd();

        return {
            success: true,
            json: {
                time: jsonTotalTime,
                size: rawJson.length,
                result: jsonResult
            },
            arrow: {
                time: arrowTotalTime,
                size: arrowBuffer.length,
                result: arrowResult
            },
            comparison: {
                speedup: `${speedup}x`,
                compression: `${compressionRatio}%`
            }
        };

    } catch (error: any) {
        logger.error('Arrow POC', '测试失败', error);
        logger.groupEnd();
        return {
            success: false,
            error: error.message
        };
    }
}
