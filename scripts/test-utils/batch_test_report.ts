
import fs from 'fs';
import { TestResult, getGroup } from './batch_test_config.js';

// ========== Generate Report ==========
export function generateReport(results: TestResult[], reportPath: string) {
    const now = new Date();
    const readableTime = now.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    let md = `# 📊 批量洞察分析测试报告 (V2) - ${readableTime}\n\n`;
    md += `> **生成时间**: ${now.toLocaleString()}\\\n`;
    md += `> **测试方案**: 对齐 [47-测试-批量洞察分析测试方案](docs/03-测试验证/47-测试-批量洞察分析测试方案.md)\\\n`;

    // Part 1
    md += `## Part 1: 数据集测试详情 (Detail per Dataset)\n\n`;

    // Global Stats Accumulators
    const allErrors: string[] = [];
    const promptStats: Record<string, {
        total: number,
        passed: number,
        blocked: number,
        failureReasons: Set<string>,
        invalidCols: Set<string>,
        blockedDetails: Array<{ ai_params: any, required_params: string[], invalidCols: string[] }>
    }> = {};

    for (const res of results) {
        let title = `[${res.dataset}]`;
        if (res.isColdStart) {
            title += ` ❄️ (Cold Start)`;
        }
        md += `### ${title}\n\n`;
        md += `**A. 执行时间线 (Timeline)**\n\n`;
        md += `| 时间点 | 阶段 | 累计耗时 | 说明 |\n| :--- | :--- | :--- | :--- |\n`;
        for (const t of res.timeline) {
            md += `| ${t.time} | ${t.stage} | ${t.duration} | ${t.note} |\n`;
        }
        md += `\n`;

        md += `**B. 洞察执行详情 (Insights)**\n\n`;
        md += `| # | Prompt ID | Score | Status | Params | Notes |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        res.insights.forEach((ins, idx) => {
            const paramsStr = JSON.stringify(ins.params).substring(0, 30) + (JSON.stringify(ins.params).length > 30 ? '...' : '');
            const statusIcon = ins.status === 'Pass' ? '✅ Pass' : (ins.status === 'Fail' ? '❌ Fail' : ins.status);
            md += `| ${idx + 1} | \`${ins.promptId}\` | ${ins.score} | ${statusIcon} | \`${paramsStr}\` | ${ins.error || '-'} |\n`;

            // Accumulate Executed Stats
            if (!promptStats[ins.promptId]) {
                promptStats[ins.promptId] = { total: 0, passed: 0, blocked: 0, failureReasons: new Set(), invalidCols: new Set(), blockedDetails: [] };
            }
            promptStats[ins.promptId].total++; // This is "Executed" count
            if (ins.status === 'Pass') promptStats[ins.promptId].passed++;
            if (ins.error) promptStats[ins.promptId].failureReasons.add(ins.error);
        });
        md += `\n`;

        md += `**C. 错误日志 (Errors)**\n\n`;
        if (res.errors.length > 0) {
            // 1.去重
            const uniqueErrors = Array.from(new Set(res.errors));
            allErrors.push(...uniqueErrors); // Collect for later analysis

            uniqueErrors.forEach(e => {
                // Parse Blocked Errors from Logs
                // Format: ... [AI服务] [PromptID] 列名验证失败: 列不存在 [Cols]
                // OR old format if not updated logic logs differently.
                // We rely on the text content.
                const promptIdMatch = e.match(/\[AI服务\] \[(.+?)\] 列名验证失败/);
                if (promptIdMatch) {
                    const pidFromLog = promptIdMatch[1];
                    if (!promptStats[pidFromLog]) {
                        promptStats[pidFromLog] = { total: 0, passed: 0, blocked: 0, failureReasons: new Set(), invalidCols: new Set(), blockedDetails: [] };
                    }
                    promptStats[pidFromLog].blocked++;

                    // 🆕 尝试解析详细参数 JSON (从结构化数据中提取)
                    const jsonMatch = e.match(/👉 结构化数据:\s*(\{.*\})/s);
                    if (jsonMatch) {
                        try {
                            const detail = JSON.parse(jsonMatch[1]);
                            if (detail.ai_params && detail.required_params) {
                                promptStats[pidFromLog].blockedDetails.push({
                                    ai_params: detail.ai_params,
                                    required_params: detail.required_params,
                                    invalidCols: detail.invalidColumns || []
                                });
                            }
                        } catch (err) {
                            console.error('解析结构化数据失败:', err);
                        }
                    }

                    const colMatch = e.match(/列不存在 \[(.+?)\]/);
                    if (colMatch) {
                        promptStats[pidFromLog].invalidCols.add(colMatch[1]);
                    }
                }

                // 简单的错误格式化提取
                const timeMatch = e.match(/^\[(\d{2}:\d{2}:\d{2}\.\d{3})\]/);
                const time = timeMatch ? timeMatch[1] : '';

                // 尝试提取 Python Traceback 中的 ValueError
                const valueErrorMatch = e.match(/ValueError: (.*?)(?=\\n|\]|$)/);
                const coreMsg = valueErrorMatch ? `**ValueError**: ${valueErrorMatch[1]}` : e.replace(/\n/g, ' ').substring(0, 100) + '...';

                if (e.includes('Traceback')) {
                    md += `> ${time} 🔴 ${coreMsg}\n`;
                    md += `<details><summary>点击查看完整堆栈</summary>\n\n\`\`\`text\n${e}\n\`\`\`\n\n</details>\n\n`;
                } else if (e.includes('500 Internal Server Error')) {
                    md += `> ${time} ⚠️ **API Error**: 500 Internal Server Error (后端代理/服务故障)\n\n`;
                } else {
                    md += `> ${time} ${e}\n\n`;
                }
            });
        } else {
            md += `> ✅ 无显著错误\n`;
        }
        md += `\n---\n\n`;
    }

    // Part 2
    md += `## Part 2: 汇总分析 (Summary Analysis)\n\n`;

    // 1. 性能分析
    md += `#### 1. 性能分析 (Performance Detail)\n\n`;
    md += `| 数据集量级 | 指标 | Avg (平均) | Min (最小) | Max (最大) | 样本数 |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    const groups = ['Small (<1MB)', 'Medium (1-10MB)', 'Large (10-100MB)', 'Mega (>100MB)'];

    // Helper for stats
    const calc = (vals: number[]) => {
        if (vals.length === 0) return { avg: '-', min: '-', max: '-' };
        const min = Math.min(...vals).toFixed(2);
        const max = Math.max(...vals).toFixed(2);
        const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
        return { avg: `${avg}s`, min: `${min}s`, max: `${max}s` };
    };

    // 🆕 Helper for integer stats (column count)
    const calcInt = (vals: number[]) => {
        if (vals.length === 0) return { avg: '-', min: '-', max: '-' };
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        return { avg: `${avg}`, min: `${min}`, max: `${max}` };
    };

    for (const group of groups) {
        const groupResults = results.filter(r => getGroup(r.size) === group);
        // 如果有冷启动数据，性能分析中可以根据需求决定是否排除。
        // 为了反映真实平均性能，通常可以把冷启动数据单独摘出来或者依然算在内。
        // 这里我们按照常规做法：把冷启动数据算在内，但在表格下方标注。
        // 或者，我们可以增加一行专门展示 "Cold Start" 的数据，但这可能使表格太长。
        // 用户要求 "如果是首次冷启动，需要标注出冷启动链路的具体耗时；然后更新 ... 需要单独记录冷启动的时长"
        // 我们可以为每个组增加 "Cold Start" 标记，或者简单地在表格下面加一段备注。
        // 更好的方式可能是添加一行 "Cold Start (All Groups)" 或者在每个组里如果有冷启动就标注。
        // 鉴于冷启动通常只有一次（第一个数据集），单独列一行比较清晰。

        if (groupResults.length === 0) {
            md += `| **${group}** | Import Time | - | - | - | 0 |\n`;
            md += `| | TTFI | - | - | - | 0 |\n`;
            md += `| | E2E Total | - | - | - | 0 |\n`;
            md += `| | Column Count | - | - | - | 0 |\n`;
            md += `| | AI Suggestion | - | - | - | 0 |\n`;
            md += `| | Prompt Length | - | - | - | 0 |\n`;  // 🆕
            continue;
        }

        const imports = groupResults.map(r => r.metrics.uploadDuration / 1000);
        const ttfis = groupResults.filter(r => r.metrics.aiLatency > 0).map(r => r.metrics.aiLatency / 1000);
        const e2es = groupResults.map(r => r.metrics.totalDuration / 1000);
        const colCounts = groupResults.filter(r => r.columnCount > 0).map(r => r.columnCount);  // 🆕
        const aiSuggestions = groupResults.filter(r => r.aiSuggestionDuration > 0).map(r => r.aiSuggestionDuration / 1000);  // 🆕
        const promptLengths = groupResults.filter(r => r.promptLength > 0).map(r => r.promptLength);  // 🆕

        const iStats = calc(imports);
        const tStats = calc(ttfis);
        const eStats = calc(e2es);
        const cStats = calcInt(colCounts);  // 🆕
        const aStats = calc(aiSuggestions);  // 🆕
        const pStats = calcInt(promptLengths);  // 🆕

        md += `| **${group}** | Import Time | ${iStats.avg} | ${iStats.min} | ${iStats.max} | ${imports.length} |\n`;
        md += `| | TTFI | ${tStats.avg} | ${tStats.min} | ${tStats.max} | ${ttfis.length} |\n`;
        md += `| | E2E Total | ${eStats.avg} | ${eStats.min} | ${eStats.max} | ${e2es.length} |\n`;
        md += `| | Column Count | ${cStats.avg} | ${cStats.min} | ${cStats.max} | ${colCounts.length} |\n`;  // 🆕
        md += `| | AI Suggestion | ${aStats.avg} | ${aStats.min} | ${aStats.max} | ${aiSuggestions.length} |\n`;  // 🆕
        md += `| | Prompt Length | ${pStats.avg} | ${pStats.min} | ${pStats.max} | ${promptLengths.length} |\n`;  // 🆕
    }
    md += `\n`;

    // 🌟 冷启动特别分析
    const coldStartResult = results.find(r => r.isColdStart);
    if (coldStartResult) {
        md += `**❄️ 冷启动分析 (Cold Start Analysis)**\n`;
        md += `> 首次加载包含 DuckDB 初始化和 Pyodide 预热。\n\n`;
        md += `| 指标 | 耗时 | 详情 |\n`;
        md += `| :--- | :--- | :--- |\n`;
        md += `| **DuckDB Init** | ${(coldStartResult.metrics.duckDBInitDuration || 0) / 1000}s | 首次数据库加载 |\n`;
        md += `| **Dataset** | ${coldStartResult.dataset} | ${getGroup(coldStartResult.size)} |\n`;
        md += `| **Import Time** | ${(coldStartResult.metrics.uploadDuration / 1000).toFixed(2)}s | 包含初始化开销 |\n`;
        md += `| **E2E Total** | ${(coldStartResult.metrics.totalDuration / 1000).toFixed(2)}s | 完整链路 |\n\n`;
    }

    // 2. Prompt 质量通过率
    md += `#### 2. Prompt 质量通过率 (Quality Pass Rate)\n\n`;

    // Calculate Blocked Total
    const blockedTotal = Object.values(promptStats).reduce((acc, s) => acc + s.blocked, 0);

    md += `> **注**: "AI对应推荐总数" = 执行总数 + 验证拦截数(Blocked)。拦截数 (**${blockedTotal}**) 来自 AI 引用了不存在列名被门控拦截。 \n\n`;

    md += `| Prompt ID | 执行总数 (Executed) | 通过次数 (Pass) | 拦截数 (Blocked) | 通过率 (Exec Rate) | 失败原因 (Fail/Block Reasons) |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const [pid, stats] of Object.entries(promptStats)) {
        if (pid === 'undefined' || pid === 'null') continue; // Skip bad keys if any
        if (stats.total === 0 && stats.blocked === 0) continue;

        const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(0) + '%' : '-';

        const reasons: string[] = [];
        if (stats.failureReasons.size > 0) reasons.push(...Array.from(stats.failureReasons));
        if (stats.invalidCols.size > 0) reasons.push(`InvalidCols: [${Array.from(stats.invalidCols).join(', ')}]`);
        const reasonStr = reasons.length > 0 ? reasons.join('; ') : '-';

        md += `| \`${pid}\` | ${stats.total} | ${stats.passed} | **${stats.blocked}** | ${rate} | ${reasonStr} |\n`;
    }
    md += `\n`;

    // 3. 验证拦截统计
    md += `**验证拦截统计 (Validation Blocked)**: 共 **${blockedTotal}** 次\n\n`;
    if (blockedTotal > 0) {
        md += `| 触发 Prompt | 拦截原因 | AI 返回参数 (Returned) | 模板所需参数 (Expected) |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;

        for (const [pid, stats] of Object.entries(promptStats)) {
            if (stats.blockedDetails.length > 0) {
                stats.blockedDetails.forEach(detail => {
                    const aiParams = JSON.stringify(detail.ai_params).substring(0, 100) + (JSON.stringify(detail.ai_params).length > 100 ? '...' : '');
                    const reqParams = detail.required_params.join(', ');
                    const reason = `列名不存在: [${detail.invalidCols.join(', ')}]`;
                    md += `| \`${pid}\` | ${reason} | \`${aiParams}\` | \`${reqParams}\` |\n`;
                });
            }
        }
    }

    // Write file
    fs.writeFileSync(reportPath, md);
    console.log(`📄 Report generated at: ${reportPath}`);
}
