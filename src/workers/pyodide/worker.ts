/* eslint-disable no-restricted-globals */
import { loadPyodide } from 'pyodide';

// Define the worker scope
const ctx: Worker = self as any;

let pyodide: any = null;

async function loadPyodideAndPackages() {
    try {
        ctx.postMessage({ type: 'STATUS', message: 'Loading Pyodide...' });

        // Load Pyodide
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"
        });

        ctx.postMessage({ type: 'STATUS', message: 'Loading Pandas...' });

        // Load operational packages
        await pyodide.loadPackage(['pandas', 'numpy']);

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
            const result = await pyodide.runPythonAsync(content);
            ctx.postMessage({ id, type: 'SUCCESS', result });
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
            const result = resultProxy.toJs();
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

json.dumps(result)
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

json.dumps(columns_stats)
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

json.dumps(preview)
`;

            const resultStr = await pyodide.runPythonAsync(pythonCode);
            const result = JSON.parse(resultStr);

            ctx.postMessage({ id, type: 'SUCCESS', result });
        }
    } catch (error) {
        ctx.postMessage({ id, type: 'ERROR', error: String(error) });
    }
};
