/* eslint-disable no-restricted-globals */
// 注意：不能使用 import { loadPyodide } from 'pyodide'
// 因为会导致Node模块被打包到浏览器bundle中
// 必须在运行时动态加载

// Define the worker scope
const ctx: Worker = self as any;

let pyodide: any = null;

async function loadPyodideAndPackages() {
    try {
        ctx.postMessage({ type: 'STATUS', message: 'Loading Pyodide...' });

        // 🚀 使用 CDN 加载 Pyodide
        // 注意：public/pyodide/ 不会被部署到 Vercel（在 .gitignore 中）
        // 因此在所有环境统一使用 CDN
        const indexURL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

        // 动态加载Pyodide（运行时加载，不打包进bundle）
        // @ts-ignore - Pyodide会通过script标签加载到全局
        const loadPyodide = (self as any).loadPyodide || (await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`)).loadPyodide;

        pyodide = await loadPyodide({
            indexURL
        });

        ctx.postMessage({ type: 'STATUS', message: 'Loading Pandas & Matplotlib...' });

        // Load operational packages (添加 matplotlib 用于图表生成)
        await pyodide.loadPackage(['pandas', 'numpy', 'matplotlib']);

        // 🔧 配置 matplotlib 使用 Agg 后端(非交互式)，避免 Worker 环境访问 DOM
        await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use('Agg')  # 必须在 import pyplot 之前设置
import matplotlib.pyplot as plt
# 设置默认图表样式
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['font.size'] = 10
plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示
`);

        ctx.postMessage({ type: 'READY' });
    } catch (error) {
        console.error("Pyodide loading failed:", error);
        ctx.postMessage({ type: 'ERROR', error: String(error) });
    }
}

loadPyodideAndPackages();

ctx.onmessage = async (event) => {
    const { id, type, content } = event.data;

    if (!pyodide) {
        ctx.postMessage({ id, type: 'ERROR', error: 'Pyodide not ready' });
        return;
    }

    try {
        if (type === 'RUN_CODE') {
            // Execute Python code
            await pyodide.loadPackagesFromImports(content);

            // 🔧 关键修复：将 stdout 捕获和用户代码合并为单个脚本
            // 这样所有代码在同一个 Python 执行上下文中运行，变量可以共享
            const fullScript = `
import sys
import io

# 开始捕获 stdout
_stdout_capture = io.StringIO()
_old_stdout = sys.stdout
sys.stdout = _stdout_capture

# === 用户代码开始 ===
${content}
# === 用户代码结束 ===

# 恢复 stdout 并返回捕获的内容
sys.stdout = _old_stdout
_stdout_capture.getvalue()
`;

            try {
                // 一次性执行完整脚本，返回值是捕获的 stdout
                const capturedOutputRaw = await pyodide.runPythonAsync(fullScript);

                // 显式转换 PyProxy 为字符串
                const capturedOutput = capturedOutputRaw?.toString() || '';

                // 🔍 调试日志（已移除，使用标准logger）

                // 优先使用 stdout 捕获的内容（print 输出）
                let result = null;
                if (capturedOutput && capturedOutput.trim()) {
                    try {
                        result = JSON.parse(capturedOutput.trim());
                        // stdout解析为JSON成功
                    } catch (e) {
                        console.warn('[Worker] stdout 不是 JSON，作为文本返回');
                        result = { textOutput: capturedOutput };
                    }
                } else {
                    console.warn('[Worker] stdout 为空，无可用输出');
                    result = { error: 'No output captured from Python code' };
                }

                ctx.postMessage({ id, type: 'SUCCESS', result });
            } catch (error) {
                throw error;
            }
        } else if (type === 'LOAD_DATA') {
            // Load data into a global dataframe 'df'
            const { filename, csv } = content;

            // Register file in FS (virtual filesystem)
            pyodide.FS.writeFile(filename, csv);

            const pythonCode = `
import pandas as pd
import io

# Read CSV
df = pd.read_csv('${filename}')

# Basic stats to ensure it loaded
columns = df.columns.tolist()
shape = df.shape
{"columns": columns, "shape": shape}
`;
            const resultProxy = await pyodide.runPythonAsync(pythonCode);
            // Convert proxy to JS object
            const result = resultProxy.toJs({ dict_converter: Object.fromEntries });
            resultProxy.destroy();

            ctx.postMessage({ id, type: 'SUCCESS', result });
        } else if (type === 'LOAD_DATA_FILE') {
            // Enhanced data loading with statistics
            const { content: fileContent, fileType, options } = content;
            const maxRows = options?.maxRows || 100000;
            const sample = options?.sample || false;

            // Write content to virtual filesystem
            const filename = `data_${Date.now()}.${fileType}`;
            pyodide.FS.writeFile(filename, fileContent);

            const readCmd = fileType === 'csv' ?
                `df = pd.read_csv('${filename}')` :
                `df = pd.read_json('${filename}')`;

            const pythonCode = `
import pandas as pd
import numpy as np
import json

# Read data
${readCmd}

# Sample if needed and file is large
if ${sample ? 'True' : 'False'} and len(df) > ${maxRows}:
    df = df.sample(n=${maxRows}, random_state=42)
    was_sampled = True
else:
    was_sampled = False

# Get basic info
result = {
    "row_count": int(df.shape[0]),
    "column_count": int(df.shape[1]),
    "column_names": df.columns.tolist(),
    "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
    "preview_data": df.head(100).values.tolist(),
    "was_sampled": was_sampled
}

import math
def replace_nan(obj):
    if isinstance(obj, float) and math.isnan(obj):
        return None
    elif isinstance(obj, dict):
        return {k: replace_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_nan(x) for x in obj]
    return obj

json.dumps(replace_nan(result))
`;

            const resultStr = await pyodide.runPythonAsync(pythonCode);
            const result = JSON.parse(resultStr);

            ctx.postMessage({ id, type: 'SUCCESS', result });
        } else if (type === 'CALCULATE_STATS') {
            // Calculate column statistics
            const pythonCode = `
import pandas as pd
import numpy as np
import json

columns_stats = []

for col in df.columns:
    col_data = df[col]
    stats = {
        "column_name": col,
        "unique_count": int(col_data.nunique()),
        "missing_count": int(col_data.isna().sum()),
        "missing_ratio": float(col_data.isna().mean()),
    }
    
    # Determine data type
    if pd.api.types.is_numeric_dtype(col_data):
        stats["data_type"] = "numeric"
        stats["numeric_stats"] = {
            "min": float(col_data.min()) if not col_data.isna().all() else 0,
            "max": float(col_data.max()) if not col_data.isna().all() else 0,
            "mean": float(col_data.mean()) if not col_data.isna().all() else 0,
            "median": float(col_data.median()) if not col_data.isna().all() else 0,
            "std": float(col_data.std()) if not col_data.isna().all() else 0,
            "q1": float(col_data.quantile(0.25)) if not col_data.isna().all() else 0,
            "q3": float(col_data.quantile(0.75)) if not col_data.isna().all() else 0,
            "histogram": np.histogram(col_data.dropna(), bins=10)[0].tolist() if not col_data.isna().all() else []
        }
    elif pd.api.types.is_datetime64_any_dtype(col_data):
        stats["data_type"] = "datetime"
    elif pd.api.types.is_bool_dtype(col_data):
        stats["data_type"] = "boolean"
    else:
        stats["data_type"] = "categorical" if col_data.nunique() < 50 else "text"
        if stats["data_type"] == "categorical":
            value_counts = col_data.value_counts().head(5)
            stats["categorical_stats"] = {
                "top_values": [
                    {"value": str(val), "count": int(count), "percentage": float(count / len(col_data))}
                    for val, count in value_counts.items()
                ]
            }
    
    columns_stats.append(stats)

import math
def replace_nan(obj):
    if isinstance(obj, float) and math.isnan(obj):
        return None
    elif isinstance(obj, dict):
        return {k: replace_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_nan(x) for x in obj]
    return obj

json.dumps(replace_nan(columns_stats))
`;

            const resultStr = await pyodide.runPythonAsync(pythonCode);
            const result = JSON.parse(resultStr);

            ctx.postMessage({ id, type: 'SUCCESS', result });
        } else if (type === 'GET_PREVIEW') {
            // Get preview data
            const { rows } = content;
            const pythonCode = `
import pandas as pd
import json

preview = {
    "data": df.head(${rows}).values.tolist(),
    "columns": df.columns.tolist()
}

import math
def replace_nan(obj):
    if isinstance(obj, float) and math.isnan(obj):
        return None
    elif isinstance(obj, dict):
        return {k: replace_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_nan(x) for x in obj]
    return obj

json.dumps(replace_nan(preview))
`;

            const resultStr = await pyodide.runPythonAsync(pythonCode);
            const result = JSON.parse(resultStr);

            ctx.postMessage({ id, type: 'SUCCESS', result });
        } else if (type === 'LOAD_FONT_URL') {
            // 动态加载字体
            const { url, name } = content;

            try {
                ctx.postMessage({ type: 'STATUS', message: `Downloading font ${name}...` });

                // 1. Fetch字体文件
                const response = await fetch(url);
                if (!response.ok) {
                    console.warn(`Font fetch failed: ${url} (${response.status})`);
                    ctx.postMessage({ id, type: 'SUCCESS', result: 'Font fetch failed (skipped)' });
                    return;
                }
                const buffer = await response.arrayBuffer();
                const data = new Uint8Array(buffer);

                // 简单的 Magic Number 检查 (TTF/OTF start with 0x00010000 or OTTO)
                // 避免将 HTML (如 404 页面) 传给 Matplotlib 导致崩溃
                const isFont = (data.length > 4) && (
                    (data[0] === 0x00 && data[1] === 0x01 && data[2] === 0x00 && data[3] === 0x00) || // TTF
                    (data[0] === 0x4F && data[1] === 0x54 && data[2] === 0x54 && data[3] === 0x4F)    // OTF (OTTO)
                );

                if (!isFont) {
                    console.warn(`Invalid font file signature at ${url}. Likely a 404 HTML page.`);
                    // 不抛出错误，而是作为警告处理，避免打断整体加载流程
                    ctx.postMessage({ id, type: 'SUCCESS', result: 'Invalid font file (skipped)' });
                    return;
                }

                // 2. 写入虚拟文件系统
                const fontPath = `/home/pyodide/${name}`;
                pyodide.FS.writeFile(fontPath, data);

                // 3. 配置Matplotlib
                const pythonCode = `
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import os

font_path = '${fontPath}'

# 注册字体
if os.path.exists(font_path):
    fm.fontManager.addfont(font_path)
    
    # 尝试推断Family Name，通常文件名去掉后缀即可，或者硬编码
    font_prop = fm.FontProperties(fname=font_path)
    font_name = font_prop.get_name()
    
    # 设置为默认字体 (保留sans-serif作为后备)
    plt.rcParams['font.sans-serif'] = [font_name] + plt.rcParams['font.sans-serif']
    plt.rcParams['axes.unicode_minus'] = False # 解决负号显示问题
    
    print(f"Font loaded: {font_name}")
else:
    print("Font file not found")
`;
                await pyodide.runPythonAsync(pythonCode);
                ctx.postMessage({ id, type: 'SUCCESS', result: 'Font loaded' });
            } catch (err) {
                console.error("Font loading error:", err);
                ctx.postMessage({ id, type: 'ERROR', error: String(err) });
            }
        } else if (type === 'LOAD_PACKAGES') {
            const { packages } = content;
            try {
                if (packages && packages.length > 0) {
                    ctx.postMessage({ type: 'STATUS', message: `Loading packages: ${packages.join(', ')}...` });

                    // 1. 加载 micropip
                    await pyodide.loadPackage('micropip');
                    const micropip = pyodide.pyimport("micropip");

                    // 2. 尝试安装所有包
                    // 注意：标准 pyodide 包和 PyPI 包都可以尝试用 micropip 安装
                    // 或者先用 loadPackage 尝试，失败再用 micropip，但混合用可能更复杂
                    // 简单起见，对于已知不支持的包（如 jieba），micropip 是必须的

                    // 策略：先尝试加载 standard packages，如果失败或者是 PyPI 包，则使用 micropip
                    // 但 pyodide.loadPackage 对未知包会报错。
                    // 更好的策略是：先加载 micropip，然后用 micropip.install(packages)
                    // micropip 会自动处理 Pyodide 内置包和 PyPI 包

                    // 2. 尝试安装所有包
                    const packagesToInstall: string[] = [];

                    for (const pkg of packages) {
                        if (pkg === 'jieba') {
                            // 使用第三方提供的 jieba wheel
                            packagesToInstall.push('https://files.pythonhosted.org/packages/1f/20/451327170139b83a213ba111a0300d89758f2762ba41c305a415951e604f/jieba-0.42.1-py3-none-any.whl');
                        } else {
                            packagesToInstall.push(pkg);
                        }
                    }

                    await micropip.install(packagesToInstall);
                    micropip.destroy(); // 释放 Python 对象

                    // Packages加载成功（由micropip处理）
                }
                ctx.postMessage({ id, type: 'SUCCESS', result: 'Packages loaded' });
            } catch (err) {
                console.error("Package loading error:", err);

                // 如果 micropip 失败，可能是网络问题或包名错误
                // 尝试回退到 pyodide.loadPackage (仅针对内置包) 作为最后的尝试
                try {
                    if (packages && packages.length > 0) {
                        console.warn("Micropip failed, trying pyodide.loadPackage as fallback...");
                        await pyodide.loadPackage(packages);
                    }
                    ctx.postMessage({ id, type: 'SUCCESS', result: 'Packages loaded (Fallback)' });
                } catch (fallbackErr) {
                    ctx.postMessage({ id, type: 'ERROR', error: String(err) });
                }
            }
        }
    } catch (error) {
        ctx.postMessage({ id, type: 'ERROR', error: String(error) });
    }
};
