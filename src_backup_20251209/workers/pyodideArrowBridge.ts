/**
 * Pyodide Arrow Bridge
 * 
 * 此文件提供在 Web Worker 内部 (Python环境) 运行的胶水代码。
 * 用于将接收到的 Arrow IPC Stream (Uint8Array) 零拷贝转换为 Pandas DataFrame。
 */

// 对应的 Python 初始化代码 - 请在 Worker 启动时 runPython() 此代码
export const PYODIDE_BRIDGE_INIT_CODE = `
import pyarrow as pa
import pandas as pd
import io

def load_arrow_stream(ipc_bytes):
    """
    接收 Uint8Array (JS) -> PyProxy -> BytesIO -> PyArrow Table -> Pandas
    这是目前 Pyodide 中最高效的转换路径
    """
    # 1. 创建 Byte 流
    reader = pa.ipc.open_stream(io.BytesIO(ipc_bytes.to_py()))
    
    # 2. 读取为通过 Arrow Table
    table = reader.read_all()
    
    # 3. 转为 Pandas (Zero-copy where possible)
    # self_destruct=True 允许 arrow 释放内存，如果 pandas 复制了数据
    # split_blocks=True 能够更好地利用内存
    df = table.to_pandas(self_destruct=True, split_blocks=True)
    
    return df

print("🚀 DuckDB <-> Pyodide Arrow Bridge Loaded")
`;

/**
 * 前端使用的 Helper，用于生成 postMessage 里的 Transferable
 * @param ipcStream 来自 DuckDB exportArrowTable 的结果
 */
export function prepareTransferable(ipcStream: Uint8Array) {
    return {
        buffer: ipcStream.buffer,
        // 其他元数据
    };
}
