/**
 * Pyodide Web Worker
 * 在独立线程中运行 Python 代码，避免阻塞主线程
 */

let pyodide = null;
let isPyodideLoading = false;
let pyodideLoadPromise = null;

/**
 * 初始化 Pyodide
 */
async function initializePyodide() {
    if (pyodide) return pyodide;
    if (isPyodideLoading) return pyodideLoadPromise;

    isPyodideLoading = true;
    pyodideLoadPromise = (async () => {
        try {
            // 从 CDN 加载 Pyodide
            importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

            pyodide = await loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
            });

            // 加载常用的 Python 包
            await pyodide.loadPackage(['numpy', 'pandas']);

            console.log('Pyodide initialized successfully');
            return pyodide;
        } catch (error) {
            console.error('Failed to initialize Pyodide:', error);
            isPyodideLoading = false;
            pyodideLoadPromise = null;
            throw error;
        }
    })();

    return pyodideLoadPromise;
}

/**
 * 处理来自主线程的消息
 */
self.addEventListener('message', async (event) => {
    const { id, type, payload } = event.data;

    try {
        switch (type) {
            case 'INIT':
                await initializePyodide();
                self.postMessage({
                    id,
                    type: 'INIT_SUCCESS',
                    payload: { message: 'Pyodide initialized' },
                });
                break;

            case 'RUN_PYTHON':
                {
                    if (!pyodide) {
                        await initializePyodide();
                    }

                    const { code, namespace } = payload;

                    // 设置全局变量
                    if (namespace) {
                        for (const [key, value] of Object.entries(namespace)) {
                            pyodide.globals.set(key, value);
                        }
                    }

                    // 执行 Python 代码
                    const result = await pyodide.runPythonAsync(code);

                    // 将结果转换为 JavaScript 对象
                    const jsResult = result?.toJs ? result.toJs({ dict_converter: Object.fromEntries }) : result;

                    self.postMessage({
                        id,
                        type: 'RUN_PYTHON_SUCCESS',
                        payload: { result: jsResult },
                    });
                }
                break;

            case 'LOAD_DATA':
                {
                    if (!pyodide) {
                        await initializePyodide();
                    }

                    const { data, variableName = 'df' } = payload;

                    // 将数据传递给 Python
                    pyodide.globals.set('_temp_data', data);

                    // 创建 pandas DataFrame
                    await pyodide.runPythonAsync(`
import pandas as pd
import json

_data_dict = _temp_data.to_py()
${variableName} = pd.DataFrame(_data_dict)
del _temp_data
          `);

                    self.postMessage({
                        id,
                        type: 'LOAD_DATA_SUCCESS',
                        payload: { message: `Data loaded as ${variableName}` },
                    });
                }
                break;

            case 'GET_STATS':
                {
                    if (!pyodide) {
                        await initializePyodide();
                    }

                    const { variableName = 'df' } = payload;

                    // 计算统计信息
                    const code = `
${variableName}.describe().to_dict()
          `;

                    const result = await pyodide.runPythonAsync(code);
                    const stats = result.toJs({ dict_converter: Object.fromEntries });

                    self.postMessage({
                        id,
                        type: 'GET_STATS_SUCCESS',
                        payload: { stats },
                    });
                }
                break;

            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({
            id,
            type: 'ERROR',
            payload: {
                message: error.message,
                stack: error.stack,
            },
        });
    }
});

// 通知主线程 Worker 已就绪
self.postMessage({ type: 'WORKER_READY' });
