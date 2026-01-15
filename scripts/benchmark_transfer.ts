
import { performance } from 'perf_hooks';

/**
 * Data Transfer Benchmark
 * 
 * Simulates the overhead of transferring data from DuckDB (JS) to Pyodide (Python)
 * via the current JSON.stringify + Escape mechanism.
 */

// 1. Generate Mock Data (Mega size: ~600k rows)
const ROW_COUNT = 600000;
const COL_COUNT = 15;

console.log(`🚀 Starting Benchmark: Data Transfer Simulation`);
console.log(`   Target: ${ROW_COUNT} rows x ${COL_COUNT} columns (Simulating Mega Dataset)`);

function generateData(rows: number, cols: number) {
    const data: any[] = [];
    const keys = Array.from({ length: cols }, (_, i) => `col_${i}`);

    console.log(`   Generating mock data...`);
    const start = performance.now();

    for (let i = 0; i < rows; i++) {
        const row: any = {};
        keys.forEach((k, idx) => {
            if (idx === 0) row[k] = i; // ID
            else if (idx % 3 === 0) row[k] = `text_value_${i}`; // String
            else if (idx % 3 === 1) row[k] = Math.random() * 1000; // Float
            else row[k] = Math.floor(Math.random() * 100); // Int
        });
        data.push(row);
    }

    const end = performance.now();
    console.log(`   ✅ Data generated in ${((end - start) / 1000).toFixed(2)}s`);
    return data;
}

function escapeJsonForPython(jsonStr: string): string {
    // Current logic in modeExecutor.ts
    // .replace(/\\/g, '\\\\').replace(/'''/g, "\\'\\'\\'");
    // Note: simple regex replace on large string can be slow
    return jsonStr
        .replace(/\\/g, '\\\\')
        .replace(/'''/g, "\\'\\'\\'");
}

async function runBenchmark() {
    // Measure Heap Usage
    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`   Initial Memory: ${initialMemory.toFixed(2)} MB`);

    const data = generateData(ROW_COUNT, COL_COUNT);

    const dataMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`   Memory after Generation: ${dataMemory.toFixed(2)} MB`);

    // Step 1: JSON.stringify
    console.log(`\n👉 Step 1: JSON.stringify (Serialization)`);
    const startJson = performance.now();

    // Simulate BigInt handling if needed, but for speed we use standard
    const jsonStr = JSON.stringify(data);

    const endJson = performance.now();
    const jsonDuration = (endJson - startJson);
    console.log(`   ⏱️ Duration: ${jsonDuration.toFixed(2)} ms (${(jsonDuration / 1000).toFixed(2)}s)`);
    console.log(`   📦 JSON Size: ${(jsonStr.length / 1024 / 1024).toFixed(2)} MB`);

    // Step 2: Escape for Python
    console.log(`\n👉 Step 2: Escape for Python (Regex Replace)`);
    const startEscape = performance.now();

    // Simulate escape
    const safeJson = escapeJsonForPython(jsonStr);

    const endEscape = performance.now();
    const escapeDuration = (endEscape - startEscape);
    console.log(`   ⏱️ Duration: ${escapeDuration.toFixed(2)} ms (${(escapeDuration / 1000).toFixed(2)}s)`);

    // Total Overhead
    const totalOverhead = jsonDuration + escapeDuration;
    console.log(`\n🚨 Total JS-Side Overhead: ${totalOverhead.toFixed(2)} ms (${(totalOverhead / 1000).toFixed(2)}s)`);

    // Analysis
    console.log(`\n🔍 Analysis:`);
    console.log(`   - Data generation took time, but serialization is the transfer bottleneck.`);
    console.log(`   - Stringify + Escape = ${(totalOverhead / 1000).toFixed(2)}s blocking main thread.`);
    console.log(`   - This does NOT include Pyodide JSON.loads() time (Python side), which is usually 2x-5x slower than JS stringify.`);
}

runBenchmark();
