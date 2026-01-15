# 6. Performance Whitepaper: WASM Data Processing Boundaries

> **Last Updated**: 2026-01-13

This document explains the performance characteristics and physical limitations of LiuliX based on browser-side WASM (WebAssembly) architecture.

---

## Core Mechanism

LiuliX does not rely on backend databases but embeds the analysis engine directly into the browser via **DuckDB WASM** and **Pyodide**. This means:
- **Computing Power Source**: Your local CPU
- **Memory Source**: Your browser allocated memory (RAM)

---

## Data Scale Recommendations

Due to browser Sandbox memory limits, we recommend the following data scales:

| Metric            | **Recommended Range** | **Extreme Boundary (Experimental)** |
| :---------------- | :-------------------- | :---------------------------------- |
| **CSV File Size** | < 500 MB              | ~ 2 GB                              |
| **Rows**          | < 1 Million Rows      | ~ 5 Million Rows                    |
| **Columns**       | < 50 Columns          | ~ 200 Columns                       |

> **Note**: The "Extreme Boundary" heavily relies on your physical memory (16GB+ RAM recommended) and a 64-bit browser version.

---

## Memory Usage & Crash Mechanism

### Why distinct "Crash" (Aw, Snap!)?
When a web page consumes more memory than the browser's single-tab limit (usually 4GB or a physical memory limit), the browser forces the process to terminate to protect system stability.

### Common Memory-Intensive Operations
The following operations significantly increase memory pressure:
1. **Loading Ultra-Wide Tables**: CSV files with extremely high column counts.
2. **Complex Pivoting**: `GROUP BY` on High Cardinality columns.
3. **Large Result Set Rendering**: Trying to render 100k+ rows in a table at once (LiuliX has optimized this with virtual scrolling).

### Mitigation Strategies
1. **Reduce Columns**: Delete unnecessary columns before importing.
2. **Chunk Processing**: Split large files into smaller ones.
3. **Use 64-bit Chrome/Edge**: Ensure the browser can address more memory.

---

## Browser Compatibility & Recommendations

Since Wasm/Pyodide efficiency highly depends on the browser's JavaScript engine (V8, SpiderMonkey, JavaScriptCore), performance varies significantly across browsers.

### 1. Recommended (Tier 1)
**Google Chrome / Microsoft Edge (Chromium Kernel)**
- **Engine**: V8
- **Performance**: Best support for large memory (4GB+) WASM heaps, fastest Pyodide initialization.
- **Recommended Version**: Latest Stable (64-bit)

### 2. Usable (Tier 2)
**Mozilla Firefox**
- **Engine**: SpiderMonkey
- **Performance**: High WASM execution efficiency, but GC (Garbage Collection) may cause brief stutters when processing ultra-large DataFrames.

### 3. Use with Caution (Tier 3)
**Apple Safari**
- **Engine**: JavaScriptCore
- **Performance**: Extremely strict single-tab memory limits (usually stricter than Chrome). More likely to trigger page reload when processing files >200MB.

---

## Performance Benchmark

*Test Environment: MacBook Pro M1, 16GB RAM, Chrome 120*

- **Load 100MB CSV**: < 2 seconds
- **Execute SQL (1M rows aggregation)**: < 0.5 seconds
- **Python Cleaning (Full column scan)**: < 3 seconds

---

**LiuliX Team**
