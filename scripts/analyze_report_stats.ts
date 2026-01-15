
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportPath = path.resolve(__dirname, '../docs/03-测试验证/48-测试-批量洞察分析测试报告-en-US.md');
const content = fs.readFileSync(reportPath, 'utf-8');

// Parse datasets
const datasets: any[] = [];
let currentDataset: any = null;

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Dataset header
    const dsMatch = line.match(/^### \[(.+?)\]/);
    if (dsMatch) {
        if (currentDataset) datasets.push(currentDataset);
        currentDataset = { name: dsMatch[1], timeline: [], insights: [] };
        continue;
    }

    // Timeline parsing
    if (currentDataset && line.includes('|')) {
        // | 23:45:24.072 | ✅ 数据导入完成 | 0.5s | CSV导入 |
        const timelineMatch = line.match(/\|\s+\S+\s+\|\s+✅ 数据导入完成\s+\|\s+([\d.]+)s\s+\|/);
        if (timelineMatch) {
            currentDataset.importTime = parseFloat(timelineMatch[1]);
        }

        // | 23:45:48.119 | ⭐ 第一个洞察成功 (TTFI) | 24.6s | Prompt: worker-outlier-v1 |
        const ttfiMatch = line.match(/\|\s+\S+\s+\|\s+⭐ 第一个洞察成功 \(TTFI\)\s+\|\s+([\d.]+)s\s+\|/);
        if (ttfiMatch) {
            currentDataset.ttfi = parseFloat(ttfiMatch[1]);
        }

        // | 23:45:50.939 | 🏁 最后一个洞察成功 | 27.4s | Total 10 Insights |
        const e2eMatch = line.match(/\|\s+\S+\s+\|\s+🏁 最后一个洞察成功\s+\|\s+([\d.]+)s\s+\|/);
        if (e2eMatch) {
            currentDataset.e2e = parseFloat(e2eMatch[1]);
        }
    }

    // Insight parsing
    // | 1 | `worker-groupby-v1` | 80 | ✅ Pass | ...
    if (currentDataset && line.match(/^\|\s+\d+\s+\|\s+`worker-/)) {
        const parts = line.split('|').map(p => p.trim());
        const promptId = parts[2].replace(/`/g, '');
        const status = parts[4];
        currentDataset.insights.push({ promptId, status });
    }
}
if (currentDataset) datasets.push(currentDataset);


// Group datasets
function getGroup(name: string) {
    if (name.includes('small')) return 'Small (<1MB)';
    if (name.includes('medium')) return 'Medium (1-10MB)';
    if (name.includes('large')) return 'Large (10-100MB)';
    if (name.includes('mega') || name.includes('big') || name.includes('trips')) return 'Mega (>100MB)';
    return 'Other';
}

const groups: any = {
    'Small (<1MB)': [],
    'Medium (1-10MB)': [],
    'Large (10-100MB)': [],
    'Mega (>100MB)': []
};

datasets.forEach(ds => {
    const g = getGroup(ds.name);
    if (groups[g]) groups[g].push(ds);
});

console.log(`#### 1. 性能分析 (Performance Detail)\n`);
console.log(`| 数据集量级 | 指标 | Avg (平均) | Min (最小) | Max (最大) | 样本数 |`);
console.log(`| :--- | :--- | :--- | :--- | :--- | :--- |`);

for (const groupName of ['Small (<1MB)', 'Medium (1-10MB)', 'Large (10-100MB)', 'Mega (>100MB)']) {
    const dss = groups[groupName];
    if (dss.length === 0) continue;

    const imports = dss.map((d: any) => d.importTime).filter((n: any) => !isNaN(n));
    const ttfis = dss.map((d: any) => d.ttfi).filter((n: any) => !isNaN(n));
    const e2es = dss.map((d: any) => d.e2e).filter((n: any) => !isNaN(n));

    const calc = (vals: number[]) => {
        if (vals.length === 0) return { avg: '-', min: '-', max: '-' };
        const min = Math.min(...vals).toFixed(2);
        const max = Math.max(...vals).toFixed(2);
        const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
        return { avg, min, max };
    };

    const iStats = calc(imports);
    const tStats = calc(ttfis);
    const eStats = calc(e2es);

    console.log(`| **${groupName}** | Import Time | ${iStats.avg}s | ${iStats.min}s | ${iStats.max}s | ${imports.length} |`);
    console.log(`| | TTFI | ${tStats.avg}s | ${tStats.min}s | ${tStats.max}s | ${ttfis.length} |`);
    console.log(`| | E2E Total | ${eStats.avg}s | ${eStats.min}s | ${eStats.max}s | ${e2es.length} |`);
}

// Prompt stats
const promptStats: any = {};
datasets.forEach(ds => {
    ds.insights.forEach((ins: any) => {
        if (!promptStats[ins.promptId]) promptStats[ins.promptId] = { total: 0, pass: 0 };
        promptStats[ins.promptId].total++;
        if (ins.status.includes('Pass')) promptStats[ins.promptId].pass++;
    });
});

const errorRegex = /\[AI服务\] \[(?:洞察-)?(.+)\] 列名验证失败/g;
const blockedCounts: any = {};

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse blocked prompts from error logs
    // Example: > 23:43:25.563 [AI服务] [洞察-基于多维特征对员工进行聚类，识别...] 列名验证失败
    // Note: The prompt ID isn't directly in the log, but we can infer or just count total blocked.
    // Ideally the log should have PromptID. For now we will list them as "Unknown (Blocked)" or try to match title.
    // Actually the previous step didn't log PromptID in error. 
    // We will just add a column "Blocked by Validation" to the table, but we can't map to specific prompt ID easily without log changes.
    // Wait, let's look at the log again: 
    // > [AI服务] 无法提取列名参数: feature_cols (worker-cluster-v1) -> This was in test plan example.
    // Real log: > ... [AI服务] [洞察-基于...] 列名验证失败: 列不存在

    // To properly attribute blocked counts to prompt IDs, we need to map titles back to prompt IDs or just report "Total AI Suggestions".
    // For this task, user asked for "AI返回推荐prompt次数" (Total AI Suggestions).
    // equivalent to: Total Executed + Total Blocked.
    // Since we can't easily attribute blocked ones to specific IDs from the current log format, 
    // we will add a row for "Blocked/Filtered" or just sum them up if possible.

    // Actually, looking at the user request: "新加一列，ai返回推荐prompt次数...即总分母"
    // So for each row (Prompt ID), we want (Pass + Fail + Blocked).
    // Current logs don't link Blocked errors to Prompt IDs. 
    // WE WILL SCAN FOR THE SPECIFIC ERROR PATTEN AND COUNT GLOBAL BLOCKED.
    // AND we will add a note or column.

    // Let's refine: We can't do per-prompt blocked count with current logs. 
    // I will add a global "Blocked by Validation" count, or ... 
    // Actually, I can regex match the error log, maybe I can find the prompt ID? No.
    // I will add a column "AI Suggestions (Est.)" which is Pass+Fail.
    // And I will list the Blocked ones separately or add to a "Unknown" category.
}

// Re-reading user request: "新加一列，ai返回推荐prompt次数"
// Since we can't map blocked errors to prompt IDs from the markdown report easily (it only has title),
// I will just add the column "Total Executed" (Pass+Fail). 
// AND I will add a summary line about "Blocked Suggestions".
// Accessing the "Validation Layer" logs would be better but I only have the MD file.
// I will parse the "Errors" section to count how many "列名验证失败" occurred.

const blockedLogs: string[] = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('[AI服务]') && line.includes('列名验证失败')) {
        blockedLogs.push(line.replace(/^>\s+/, '').trim());
    }
}
let blockedTotal = blockedLogs.length;

// Output table
console.log(`\n#### 2. Prompt 质量通过率 (Quality Pass Rate)\n`);
console.log(`> **注**: "AI对应推荐总数" = 执行总数 + 验证拦截数(Blocked)。拦截数 (${blockedTotal}) 因日志未记录PromptID暂时无法分摊到具体模版。\n`);

console.log(`| Prompt ID | 执行总数 (Executed) | 通过次数 (Pass) | 通过率 (Exec Rate) | 失败 (Fail) |`);
console.log(`| :--- | :--- | :--- | :--- | :--- |`);

Object.keys(promptStats).forEach(pid => {
    const s = promptStats[pid];
    const rate = ((s.pass / s.total) * 100).toFixed(0) + '%';
    const failed = s.total - s.pass;
    console.log(`| \`${pid}\` | ${s.total} | ${s.pass} | ${rate} | ${failed} |`);
});

console.log(`\n**验证拦截统计 (Validation Blocked)**: 共 **${blockedTotal}** 次 (AI 幻觉生成的无效列名被门控拦截，未进入执行阶段)\n`);

if (blockedLogs.length > 0) {
    console.log(`> **拦截日志详情**:`);
    blockedLogs.forEach(log => {
        // Cleaning up the timestamp for better readability if needed, or just keep as is
        console.log(`> - ${log}`);
    });
}
