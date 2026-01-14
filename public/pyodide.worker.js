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

            // 🚀 预加载所有必需的 Python 包（避免执行时动态加载，节省~45秒）
            // 包括：numpy, pandas, matplotlib（绘图）, scipy（科学计算）, scikit-learn（机器学习）
            // 注意：所有依赖会自动安装（如 joblib、openblas、threadpoolctl等）
            await pyodide.loadPackage([
                'numpy',
                'pandas',
                'python-dateutil',  // pandas依赖
                'pytz',             // pandas依赖
                'six',              // pandas依赖
                'matplotlib',
                'matplotlib-pyodide',
                'Pillow',           // matplotlib依赖
                'scipy',
                'scikit-learn'
            ]);

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

                    // 🔧 修复：捕获 stdout 输出
                    // 使用 Python 的 io.StringIO 重定向 sys.stdout
                    const captureStdout = `
import sys
import io
import json

_stdout_capture = io.StringIO()
_old_stdout = sys.stdout
sys.stdout = _stdout_capture
`;

                    const restoreStdout = `
sys.stdout = _old_stdout
_captured_output = _stdout_capture.getvalue()
`;

                    try {
                        // 1. 开始捕获 stdout
                        await pyodide.runPythonAsync(captureStdout);

                        // 2. 执行用户代码
                        await pyodide.runPythonAsync(code);

                        // 3. 恢复 stdout 并返回捕获的输出（作为 Python 表达式）
                        const capturedOutputRaw = await pyodide.runPythonAsync(`
sys.stdout = _old_stdout
_stdout_capture.getvalue()
`);

                        // 🔧 修复：显式转换 PyProxy 为字符串
                        const capturedOutput = capturedOutputRaw?.toString() || '';

                        // 🔍 调试：输出捕获的字符串
                        console.log('[Pyodide Worker] Captured Output Length:', capturedOutput.length);
                        console.log('[Pyodide Worker] Captured Output Preview:', capturedOutput.substring(0, 200));

                        // 4. 尝试解析为 JSON（支持 print(json.dumps(...)) 模式）
                        let parsedResult = null;
                        if (capturedOutput && capturedOutput.trim()) {
                            try {
                                parsedResult = JSON.parse(capturedOutput.trim());
                                console.log('[Pyodide Worker] ✅ JSON Parse Success');
                            } catch (e) {
                                console.error('[Pyodide Worker] ❌ JSON Parse Failed:', e);
                                console.log('[Pyodide Worker] Raw Output:', capturedOutput);
                                // 不是 JSON，返回原始文本
                                parsedResult = { textOutput: capturedOutput };
                            }
                        }

                        self.postMessage({
                            id,
                            type: 'RUN_PYTHON_SUCCESS',
                            payload: { result: parsedResult },
                        });
                    } catch (error) {
                        // 确保恢复 stdout
                        try {
                            await pyodide.runPythonAsync(restoreStdout);
                        } catch (e) {
                            // 忽略恢复错误
                        }
                        throw error;
                    }
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

            case 'LOAD_PACKAGES':
                {
                    if (!pyodide) {
                        await initializePyodide();
                    }

                    const { packages } = payload;

                    // 加载指定的Python包
                    console.log('[Pyodide Worker] Loading packages:', packages);
                    await pyodide.loadPackage(packages);
                    console.log('[Pyodide Worker] Packages loaded successfully:', packages);

                    self.postMessage({
                        id,
                        type: 'LOAD_PACKAGES_SUCCESS',
                        payload: { message: `Packages loaded: ${packages.join(', ')}` },
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
