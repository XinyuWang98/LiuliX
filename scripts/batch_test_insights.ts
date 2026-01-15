
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const BASE_URL = 'http://localhost:5173';
const DATASET_DIR = path.resolve(__dirname, '../test_datasets');
const REPORT_PATH = path.resolve(__dirname, '../docs/03-测试验证/48-测试-批量洞察分析测试报告-zh-CN-Full.md');

interface DatasetConfig {
    path: string;
    expectedTime: number;
}

// 数据集定义
const DATASETS: DatasetConfig[] = [
    // Small Group (<1MB)
    { path: 'test_datasets/small_sales_100.csv', expectedTime: 30 },
    { path: 'test_datasets/small_users_200.csv', expectedTime: 30 },
    { path: 'test_datasets/small_inventory_50.csv', expectedTime: 30 },
    { path: 'test_datasets/small_weather_365.csv', expectedTime: 30 },
    { path: 'test_datasets/small_students_500.csv', expectedTime: 30 },

    // Medium Group (1MB - 10MB)
    { path: 'test_datasets/medium_feedback_800.csv', expectedTime: 45 },
    { path: 'test_datasets/medium_orders_500.csv', expectedTime: 45 },
    { path: 'test_datasets/medium_stocks_1000.csv', expectedTime: 45 },
    { path: 'test_datasets/medium_housing_1500.csv', expectedTime: 45 },
    { path: 'test_datasets/medium_flights_5000.csv', expectedTime: 45 },

    // Large Group (10MB - 100MB)
    { path: 'test_datasets/large_employees_1500.csv', expectedTime: 60 },
    { path: 'test_datasets/large_sensors_2000.csv', expectedTime: 60 },
    { path: 'test_datasets/large_webtraffic_3000.csv', expectedTime: 60 },
    { path: 'test_datasets/xlarge_iot_20k.csv', expectedTime: 90 },
    { path: 'test_datasets/xlarge_logs_8000.csv', expectedTime: 90 },

    // Mega Group (>100MB)
    { path: 'test_datasets/mega_ecommerce_600k.csv', expectedTime: 120 },
    { path: 'test_datasets/trips_data_1m.csv', expectedTime: 180 },
    { path: 'test_datasets/big_sales_2m.csv', expectedTime: 240 },
];

interface LogEntry {
    time: string;
    msg: string;
    type: string;
}

interface InsightDetail {
    promptId: string;
    title: string;
    score: number;
    status: string;
    params: Record<string, unknown>;
    error?: string | null;
}

interface TestResult {
    dataset: string;
    size: string;
    columnCount: number;  // 🆕 列数
    aiSuggestionDuration: number;  // 🆕 AI建议生成耗时 (ms)
    promptLength: number;  // 🆕 Router Prompt字符数
    metrics: {
        uploadDuration: number;
        ingestDuration: number;
        aiLatency: number;
        totalDuration: number;
    };
    insights: InsightDetail[];
    timeline: {
        time: string;
        stage: string;
        duration: string;
        note: string;
    }[];
    errors: string[];
}

const results: TestResult[] = [];

// 辅助函数：解析日志时间
function parseTime(msg: string): string {
    const match = msg.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3})\]/);
    return match ? match[1] : new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0');
}

// 主函数
(async () => {
    console.log('🚀 开始批量洞察分析测试 (V2 - 方案对齐版)...');
    console.log(`📂 数据集路径: ${DATASET_DIR}`);

    const browser = await puppeteer.launch({
        headless: true, // 默认无头模式
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    try {
        for (const ds of DATASETS) {
            const fileName = path.basename(ds.path);
            console.log(`\n----------------------------------------`);
            console.log(`🧪 Testing: ${fileName} (timeout: ${ds.expectedTime}s)`);

            const filePath = path.resolve(process.cwd(), ds.path);
            if (!fs.existsSync(filePath)) {
                console.error(`❌ File not found: ${filePath}, skipping...`);
                continue;
            }

            const page = await browser.newPage();

            // 设置语言为 zh-CN
            await page.goto(BASE_URL);
            await page.evaluate(() => {
                localStorage.setItem('dataprism_language', 'zh-CN');
            });
            await page.reload(); // Reload to apply language

            const logs: LogEntry[] = [];

            // 时间戳记录
            let startTime = 0;
            let uploadStartTime = 0;
            let ingestTime = 0;
            let aiGenerationStartTime = 0;
            let aiSuggestionStartTime = 0;  // 🆕
            let aiSuggestionEndTime = 0;  // 🆕
            let aiSuggestionReturnTime = 0;  // 🆕 AI建议返回时间
            let firstInsightTime = 0;
            let lastInsightTime = 0;

            const timeline: TestResult['timeline'] = [];
            const insights: InsightDetail[] = [];
            const errors: string[] = [];
            let columnCount = 0;  // 🆕
            let promptLength = 0;  // 🆕 Prompt字符数

            // 监听控制台日志
            page.on('console', async msg => {
                let text = msg.text();

                // 🔍 增强：如果包含 JSHandle@error，尝试展开 Error 对象详情
                if (text.includes('JSHandle@error') || msg.type() === 'error') {
                    try {
                        const args = await Promise.all(msg.args().map(async arg => {
                            if (arg.remoteObject().subtype === 'error') {
                                const message = await arg.getProperty('message').then(h => h.jsonValue()).catch(() => '');
                                const stack = await arg.getProperty('stack').then(h => h.jsonValue()).catch(() => '');
                                return `[Error: ${message}]\nStack: ${stack}`;
                            }
                            return null;
                        }));
                        const expanded = args.filter(a => a).join('\n');
                        if (expanded) {
                            text += `\n👉 错误详情:\n${expanded}`;
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }

                // Debug: Print all logs to see what's happening
                if (text.length < 2000) console.log(`    [Console] ${text}`);

                logs.push({
                    time: parseTime(text),
                    msg: text,
                    type: msg.type()
                });

                // 捕获错误
                if (msg.type() === 'error' || text.includes('Error') || text.includes('失败')) {
                    // 过滤非关键错误
                    if (!text.includes('favicon') && !text.includes('HMR')) {
                        errors.push(text);
                    }
                }

                // 🌟 核心：解析 [TestProbe] 日志
                if (text.includes('[TestProbe] InsightExecution')) {
                    try {
                        // 兼容两种模式：
                        // 1. console.log(msg, data) -> args > 1
                        // 2. console.log(`${msg} ${JSON.stringify(data)}`) -> text parsing
                        const args = msg.args();
                        let data: any = null;

                        if (args.length > 1) {
                            // 模式 1
                            const payload = await args[1].jsonValue();
                            data = (payload as any).data || payload;
                        } else {
                            // 模式 2 (当前 executor.ts 使用的)
                            const jsonStartIndex = text.indexOf('{');
                            if (jsonStartIndex > -1) {
                                const jsonStr = text.substring(jsonStartIndex);
                                data = JSON.parse(jsonStr);
                            }
                        }

                        if (data) {
                            // @ts-ignore
                            insights.push(data);

                            const now = Date.now();
                            if (firstInsightTime === 0) {
                                firstInsightTime = now;
                                timeline.push({
                                    time: parseTime(text),
                                    stage: '⭐ 第一个洞察成功 (TTFI)',
                                    duration: ((now - uploadStartTime) / 1000).toFixed(1) + 's',
                                    note: `Prompt: ${data.promptId}`
                                });
                            }
                            lastInsightTime = now;
                        }
                    } catch (e) {
                        console.error('Failed to parse probe data', e);
                    }
                }

                // 解析关键事件
                if (text.includes('[DuckDB] CSV导入成功')) {
                    const now = Date.now();
                    ingestTime = now;
                    timeline.push({
                        time: parseTime(text),
                        stage: '✅ 数据导入完成',
                        duration: ((now - uploadStartTime) / 1000).toFixed(1) + 's',
                        note: `CSV导入`
                    });
                }

                // 补充关键埋点
                if (text.includes('Router模式调用') || text.includes('生成5个建议')) {
                    if (aiGenerationStartTime === 0) {
                        aiGenerationStartTime = Date.now();
                        timeline.push({
                            time: parseTime(text),
                            stage: '🤖 AI洞察生成',
                            duration: ((aiGenerationStartTime - uploadStartTime) / 1000).toFixed(1) + 's',
                            note: 'Router Prompt Sent'
                        });
                    }
                }

                // 🆕 捕获 AI 建议请求发送 (数据清洗上下文)
                if (text.includes('[AI服务] 发送请求到DeepSeek API') && text.includes('[AI清洗]') === false && aiSuggestionStartTime === 0) {
                    // 注意：洞察分析也会有这个日志，我们只要第一个（数据清洗的）
                    const prevLogs = logs.slice(-5).map(l => l.msg).join(' ');
                    if (prevLogs.includes('[AI清洗]') || prevLogs.includes('Router')) {
                        aiSuggestionStartTime = Date.now();
                    }
                }

                // 🆕 捕获 AI 建议响应返回
                if (text.includes('[AI清洗] AI响应收到') && aiSuggestionEndTime === 0) {
                    aiSuggestionEndTime = Date.now();
                }

                // 🆕 捕获 AI 建议返回时间线标记 (用于显示在Timeline中)
                if (text.includes('[AI服务] [Router] 使用 Router Prompt 模式') && aiSuggestionReturnTime === 0) {
                    aiSuggestionReturnTime = Date.now();
                    if (uploadStartTime > 0) {
                        timeline.push({
                            time: parseTime(text),
                            stage: '🤖 AI建议返回',
                            duration: ((aiSuggestionReturnTime - uploadStartTime) / 1000).toFixed(1) + 's',
                            note: 'Router Prompt Response'
                        });
                    }
                }

                // 🆕 捕获列数 (从简化后的文本日志中提取)
                if (text.includes('[AI洞察] 数据规模:')) {
                    const colMatch = text.match(/数据规模:\s*(\d+)列/);
                    if (colMatch) {
                        columnCount = parseInt(colMatch[1]);
                    }
                }

                // 🆕 捕获 Prompt 长度
                if (text.includes('[AI清洗] Router Prompt构建完成')) {
                    const lengthMatch = text.match(/(\d+)字符/);
                    if (lengthMatch) {
                        promptLength = parseInt(lengthMatch[1]);
                    }
                }

                if (text.includes('[Inflater] 🏁 膨胀完成')) {
                    const now = Date.now();
                    timeline.push({
                        time: parseTime(text),
                        stage: '🔄 代码膨胀完成',
                        duration: ((now - uploadStartTime) / 1000).toFixed(1) + 's',
                        note: text.match(/(\d+\/\d+)/)?.[0] || 'Unknown count'
                    });

                    // 膨胀完成后，通常立即开始预加载/并发执行
                    timeline.push({
                        time: parseTime(text), // 近似时间
                        stage: '🚀 并发执行开始',
                        duration: ((now - uploadStartTime) / 1000).toFixed(1) + 's',
                        note: 'Batch Execution'
                    });
                }
            });

            // 1. 加载页面
            await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

            // 🧹 清理状态
            const currentUrl = page.url();
            if (currentUrl.includes('/project/')) {
                await page.evaluate(() => localStorage.clear());
                await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
            }

            if (page.url() !== BASE_URL && page.url() !== BASE_URL + '/') {
                await page.evaluate(async () => {
                    localStorage.clear();
                    sessionStorage.clear();
                    try {
                        const dbs = await window.indexedDB.databases();
                        for (const db of dbs) {
                            if (db.name) window.indexedDB.deleteDatabase(db.name);
                        }
                    } catch (e) { }

                    // 🔧 Fix: 防止 ExplorationFlowV2 自动启用本地模型
                    localStorage.setItem('use_local_model', 'false');
                    localStorage.setItem('app_has_run_before', 'true');
                });
                await page.reload({ waitUntil: 'networkidle0' });
            }

            // 2. 上传文件
            const inputUploadHandle = await page.$('input[type=file]');
            if (!inputUploadHandle) {
                console.error(`  ❌ Upload input not found`);
                await page.close();
                continue;
            }

            console.log('  📤 Uploading...');
            uploadStartTime = Date.now();
            timeline.push({
                time: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0'),
                stage: '📥 文件上传开始',
                duration: '0s',
                note: 'User Action'
            });

            await inputUploadHandle.uploadFile(filePath);

            const timeout = 300000; // Unified 5 minutes timeout for all datasets to handle AI latency

            // 3. 等待完成
            try {
                // 轮询等待结束
                await new Promise<void>((resolve) => {
                    const checkInterval = setInterval(() => {
                        const elapsed = Date.now() - uploadStartTime;

                        if (elapsed > timeout) {
                            clearInterval(checkInterval);
                            console.log('  ⚠️ Timeout reached');
                            resolve();
                        }

                        // 结束条件：已有 Insights 且过去 3s 无新 Insight
                        if (insights.length > 0 && (Date.now() - lastInsightTime > 3000)) {
                            clearInterval(checkInterval);

                            if (lastInsightTime > 0) {
                                timeline.push({
                                    time: new Date(lastInsightTime).toLocaleTimeString('en-US', { hour12: false }) + '.' + new Date(lastInsightTime).getMilliseconds().toString().padStart(3, '0'),
                                    stage: '🏁 最后一个洞察成功',
                                    duration: ((lastInsightTime - uploadStartTime) / 1000).toFixed(1) + 's',
                                    note: `Total ${insights.length} Insights`
                                });
                            }
                            resolve();
                        }

                    }, 500);
                });

            } catch (e) {
                console.error('  ❌ Validation error:', e);
            }

            const endTime = Date.now();
            const totalDuration = (endTime - uploadStartTime) / 1000;

            console.log(`  ✅ Finished: ${insights.length} insights in ${totalDuration.toFixed(1)}s`);

            results.push({
                dataset: ds.path.split('/').pop() || 'unknown',
                size: ds.expectedTime.toString(),
                columnCount: columnCount,  // 🆕
                aiSuggestionDuration: aiSuggestionEndTime > 0 ? (aiSuggestionEndTime - aiSuggestionStartTime) : 0,  // 🆕
                promptLength: promptLength,  // 🆕
                metrics: {
                    uploadDuration: (ingestTime - uploadStartTime),
                    ingestDuration: 0,
                    aiLatency: (firstInsightTime - uploadStartTime),
                    totalDuration: totalDuration * 1000
                },
                insights: insights,
                timeline: timeline,
                errors: errors
            });

            await page.close();
        }

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        await browser.close();
    }

    // 生成报告
    generateReport(results);

})();

function getGroup(sizeStr: string): string {
    if (sizeStr.includes('KB') || parseFloat(sizeStr) < 1) return 'Small (<1MB)';
    const mb = parseFloat(sizeStr);
    if (mb < 10) return 'Medium (1-10MB)';
    if (mb < 100) return 'Large (10-100MB)';
    return 'Mega (>100MB)';
}

function generateReport(results: TestResult[]) {
    let md = `# 📊 批量洞察分析测试报告 (V2)\n\n`;
    md += `> **生成时间**: ${new Date().toLocaleString()}\n`;
    md += `> **测试方案**: 对齐 [47-测试-批量洞察分析测试方案](docs/03-测试验证/47-测试-批量洞察分析测试方案.md)\n\n`;

    // Part 1
    md += `## Part 1: 数据集测试详情 (Detail per Dataset)\n\n`;

    // Global Stats Accumulators
    const allErrors: string[] = [];
    const promptStats: Record<string, { total: number, passed: number, blocked: number, failureReasons: Set<string>, invalidCols: Set<string> }> = {};

    for (const res of results) {
        md += `### [${res.dataset}]\n\n`;
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
                promptStats[ins.promptId] = { total: 0, passed: 0, blocked: 0, failureReasons: new Set(), invalidCols: new Set() };
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
                    // Just in case pid is "洞察-Title", we might need to map it, but current executor logs PromptID if available.
                    // If pid is not in our known list, add it.
                    if (!promptStats[pidFromLog]) {
                        promptStats[pidFromLog] = { total: 0, passed: 0, blocked: 0, failureReasons: new Set(), invalidCols: new Set() };
                    }
                    promptStats[pidFromLog].blocked++;

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
        md += `> **拦截日志详情**:\n`;
        const blockedLogs = allErrors.filter(e => e.includes('列名验证失败'));
        blockedLogs.forEach(log => {
            // Extract plain log
            const plain = log.replace(/^\[.*?\]\s*/, '').trim();
            md += `> - ${plain}\n`;
        });
    }

    // Write file
    const finalPath = REPORT_PATH.replace('[日期]', new Date().toISOString().split('T')[0]);
    fs.writeFileSync(finalPath, md);
    console.log(`📄 Report generated at: ${finalPath}`);
}
