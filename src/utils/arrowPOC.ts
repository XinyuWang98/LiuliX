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
    logger.group('AI服务', '🧪 Arrow POC测试');

    try {
        const db = DuckDBEngine.getInstance();
        await db.init();

        // 初始化Pyodide
        pyodideManager.initialize();
        await pyodideManager.waitForReady();

        // 初始化Arrow Bridge
        logger.log('Python', '初始化Arrow Bridge');
        await pyodideManager.runPython(PYODIDE_BRIDGE_INIT_CODE);

        // ========== 方案1：JSON传输（当前方案）==========
        logger.log('数据分析', '测试方案1: JSON传输');
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

        logger.log('数据分析', `JSON方案完成`, {
            data: {
                totalTime: `${jsonTotalTime}s`,
                dataSize: `${(rawJson.length / 1024 / 1024).toFixed(2)}MB`,
                result: jsonResult
            }
        });

        // ========== 方案2：Arrow传输 ==========
        logger.log('数据分析', '测试方案2: Arrow传输');
        const arrowStartTime = performance.now();

        // 导出Arrow IPC
        const arrowBuffer = await db.exportArrowTable(tableName, maxRows);
        logger.log('DuckDB', `Arrow导出完成`, {
            data: {
                bufferSize: `${(arrowBuffer.length / 1024 / 1024).toFixed(2)}MB`,
                rows: maxRows
            }
        });

        // ✅ 使用 writeFile 将 Arrow 缓冲区写入 Pyodide 虚拟文件系统
        // 这样可以在 Worker 中访问，避免直接访问 pyodide 实例
        await pyodideManager.writeFile('data.arrow', arrowBuffer);

        // Python侧加载（从文件系统读取）
        const arrowLoadScript = `
import pyarrow as pa
import pandas as pd
import json
import time
import io

start = time.time()

# 从虚拟文件系统读取
with open('data.arrow', 'rb') as f:
    ipc_bytes = f.read()

# 解析 Arrow IPC 流
reader = pa.ipc.open_stream(io.BytesIO(ipc_bytes))
table = reader.read_all()

# 转换为 Pandas (使用零拷贝优化)
df_arrow = table.to_pandas(self_destruct=True, split_blocks=True)

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

        logger.log('数据分析', `Arrow方案完成`, {
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
        logger.error('AI服务', '测试失败', error);
        logger.groupEnd();
        return {
            success: false,
            error: error.message
        };
    }
}
