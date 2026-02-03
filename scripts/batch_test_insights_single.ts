
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import {
    DATASETS,
    DATASET_DIR,
    BASE_URL,
    generateReportPath,
    parseTime,
    LOCALE,
    ENV_MODE,
    TestResult,
    LogEntry,
    InsightDetail
} from './test-utils/batch_test_config.js';
import { generateReport } from './test-utils/batch_test_report.js';

const REPORT_PATH = generateReportPath();

console.log(`\n📊 开始批量测试`);
console.log(`🌍 环境模式: ${ENV_MODE === 'production' ? '生产环境 (Production Build)' : '开发环境 (Dev Mode)'}`);
console.log(`🌐 语言: ${LOCALE}`);
console.log(`🔗 测试 URL: ${BASE_URL}`);
console.log(`📄 报告路径: ${REPORT_PATH}`);
console.log(`🕐 测试时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);

const results: TestResult[] = [];

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
        let isFirstRun = true; // 🆕 标记首次运行

        for (const ds of DATASETS) {
            const fileName = path.basename(ds.path);
            console.log(`\n----------------------------------------`);
            console.log(`🧪 Testing: ${fileName} (timeout: ${ds.expectedTime}s) ${isFirstRun ? '[❄️ Cold Start]' : ''}`);

            const filePath = path.resolve(process.cwd(), ds.path);
            if (!fs.existsSync(filePath)) {
                console.error(`❌ File not found: ${filePath}, skipping...`);
                continue;
            }

            const page = await browser.newPage();

            // 🆕 设置语言
            await page.goto(BASE_URL);
            await page.evaluate((locale) => {
                localStorage.setItem('dataprism_language', locale);
            }, LOCALE);
            await page.reload(); // Reload to apply language

            const logs: LogEntry[] = [];

            // 时间戳记录
            let startTime = 0;
            let uploadStartTime = 0;
            let ingestTime = 0;
            let aiGenerationStartTime = 0;
            let aiSuggestionStartTime = 0;
            let aiSuggestionEndTime = 0;
            let aiSuggestionReturnTime = 0;
            let firstInsightTime = 0;
            let lastInsightTime = 0;

            // 🆕 Cold Start Metrics
            let duckDBInitTime = 0;
            let duckDBInitEndTime = 0;

            const timeline: TestResult['timeline'] = [];
            const insights: InsightDetail[] = [];
            const errors: string[] = [];
            const validationBlocks: any[] = [];  // 🆕 列名验证失败记录
            const injectionFailures: any[] = [];  // 🆕 参数注入失败记录
            let columnCount = 0;
            let promptLength = 0;
            let currentPromptId = '';  // 🆕 跟踪当前处理的PromptID

            // 监听控制台日志
            page.on('console', async msg => {
                let text = msg.text();
                let structuredData: any = null;

                try {
                    const args = msg.args();
                    if (args.length >= 3) {
                        const potentialData = await args[2].jsonValue().catch(() => null);
                        if (potentialData && typeof potentialData === 'object' && 'data' in potentialData) {
                            structuredData = (potentialData as any).data;
                            text += `\n👉 结构化数据: ${JSON.stringify(structuredData)}`;
                        }
                    }
                } catch (e) { }

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
                        if (expanded) text += `\n👉 错误详情:\n${expanded}`;
                    } catch (e) { }
                }

                if (text.length < 2000) console.log(`    [Console] ${text}`);

                logs.push({
                    time: parseTime(text),
                    msg: text,
                    type: msg.type()
                });

                if (msg.type() === 'error' || text.includes('Error') || text.includes('失败')) {
                    if (!text.includes('favicon') && !text.includes('HMR')) {
                        errors.push(text);
                    }
                }

                // � 捕获 DuckDB 初始化时间 (Cold Start)
                if (text.includes('[DuckDB] 开始初始化') && duckDBInitTime === 0) {
                    duckDBInitTime = Date.now();
                }
                if (text.includes('[DuckDB] 初始化完成') && duckDBInitEndTime === 0) {
                    duckDBInitEndTime = Date.now();
                    if (isFirstRun) {
                        timeline.push({
                            time: parseTime(text),
                            stage: '🦆 DuckDB 初始化',
                            duration: ((duckDBInitEndTime - duckDBInitTime) / 1000).toFixed(1) + 's',
                            note: 'Cold Start Overhead'
                        });
                    }
                }

                // Insight Parsing
                if (text.includes('[TestProbe] InsightExecution')) {
                    try {
                        const args = msg.args();
                        let data: any = null;

                        if (args.length > 1) {
                            const payload = await args[1].jsonValue();
                            data = (payload as any).data || payload;
                        } else {
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

                if (text.includes('[AI服务] 发送请求到DeepSeek API') && text.includes('[AI清洗]') === false && aiSuggestionStartTime === 0) {
                    const prevLogs = logs.slice(-5).map(l => l.msg).join(' ');
                    if (prevLogs.includes('[AI清洗]') || prevLogs.includes('Router')) {
                        aiSuggestionStartTime = Date.now();
                    }
                }

                if (text.includes('[AI清洗] AI响应收到') && aiSuggestionEndTime === 0) {
                    aiSuggestionEndTime = Date.now();
                }

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

                if (text.includes('[AI洞察] 数据规模:')) {
                    const colMatch = text.match(/数据规模:\s*(\d+)列/);
                    if (colMatch) columnCount = parseInt(colMatch[1]);
                }

                if (text.includes('[AI清洗] Router Prompt构建完成')) {
                    const lengthMatch = text.match(/(\d+)字符/);
                    if (lengthMatch) promptLength = parseInt(lengthMatch[1]);
                }

                if (text.includes('[Inflater] 🏁 膨胀完成')) {
                    const now = Date.now();
                    timeline.push({
                        time: parseTime(text),
                        stage: '🔄 代码膨胀完成',
                        duration: ((now - uploadStartTime) / 1000).toFixed(1) + 's',
                        note: text.match(/(\d+\/\d+)/)?.[0] || 'Unknown count'
                    });
                }

                if (text.includes('[流式处理] 开始膨胀+执行流水线')) {
                    const now = Date.now();
                    timeline.push({
                        time: parseTime(text),
                        stage: '🚀 流式处理启动',
                        duration: ((now - uploadStartTime) / 1000).toFixed(1) + 's',
                        note: '开始流式膨胀+执行'
                    });
                }

                if (text.includes('[流式处理] ⭐ 任务') && text.includes('完成')) {
                    const taskMatch = text.match(/任务\s*(\d+)\/(\d+)/);
                    if (taskMatch) {
                        const taskNum = taskMatch[1];
                        const totalTasks = taskMatch[2];
                        const now = Date.now();
                        const durationMatch = text.match(/inflateDuration:\s*([\d.]+)ms.*executeDuration:\s*([\d.]+)ms.*totalDuration:\s*([\d.]+)ms/);
                        let note = `任务 ${taskNum}/${totalTasks}`;
                        if (durationMatch) {
                            note += ` (膨胀:${durationMatch[1]}ms, 执行:${durationMatch[2]}ms, 总计:${durationMatch[3]}ms)`;
                        }
                        timeline.push({
                            time: parseTime(text),
                            stage: `⭐ 流式任务${taskNum}完成`,
                            duration: ((now - uploadStartTime) / 1000).toFixed(1) + 's',
                            note
                        });
                    }
                }

                if (text.includes('[流式处理] 流水线完成')) {
                    const now = Date.now();
                    const successMatch = text.match(/(\d+)\/(\d+)\s*个节点成功/);
                    const durationMatch = text.match(/总耗时:\s*([\d.]+)s/);
                    let note = successMatch ? `${successMatch[1]}/${successMatch[2]} 节点成功` : '完成';
                    if (durationMatch) note += ` (流式总耗时: ${durationMatch[1]}s)`;
                    timeline.push({
                        time: parseTime(text),
                        stage: '✅ 流式处理完成',
                        duration: ((now - uploadStartTime) / 1000).toFixed(1) + 's',
                        note
                    });
                }

                // 🆕 监控参数注入
                if (text.includes('[参数注入器]')) {
                    // 跟踪当前PromptID
                    const promptIdMatch = text.match(/worker-[\w-]+/);
                    if (promptIdMatch) currentPromptId = promptIdMatch[0];

                    // 捕获注入失败 ⭐ 关键
                    if (text.includes('无法提取') || text.includes('保留原值')) {
                        const paramMatch = text.match(/参数\s+(\w+)\s+无法提取/);
                        if (paramMatch && currentPromptId) {
                            injectionFailures.push({
                                promptId: currentPromptId,
                                param: paramMatch[1],
                                reason: 'Field not found in stats',
                                timestamp: parseTime(text)
                            });
                            console.log(`    ⚠️ [参数注入失败] ${currentPromptId} - ${paramMatch[1]}`);
                        }
                    }
                }

                // 🆕 监控列名验证
                if (text.includes('[列名校验]')) {
                    if (text.includes('❌ 未通过') || text.includes('invalidColumns')) {
                        try {
                            const invalidColsMatch = text.match(/invalidColumns:\s*\[([^\]]+)\]/);
                            if (invalidColsMatch && currentPromptId) {
                                const cols = invalidColsMatch[1].split(',').map(c => c.trim().replace(/['"]/g, ''));
                                validationBlocks.push({
                                    promptId: currentPromptId,
                                    invalidColumns: cols,
                                    timestamp: parseTime(text)
                                });
                                console.log(`    ⚠️ [列名验证失败] ${currentPromptId} - ${cols.join(', ')}`);
                            }
                        } catch (e) { }
                    }
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
                    localStorage.setItem('use_local_model', 'false');
                    localStorage.setItem('app_has_run_before', 'true');

                    // 🆕 清除远程Feature Flag缓存（防止覆盖）
                    localStorage.removeItem('feature_flags_remote');
                    localStorage.removeItem('feature_flags_remote_timestamp');

                    // 🆕 使用兜底邀请码
                    localStorage.setItem('liulix_invite_code', 'LIULIX2026');

                    // 🆕 强制关闭邀请码Feature Flag（localStorage优先级最高）
                    const flags = { ENABLE_INVITE_CODE_GATE: false };
                    localStorage.setItem('feature_flags', JSON.stringify(flags));
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

            const timeout = 300000;

            // 3. 等待完成
            try {
                await new Promise<void>((resolve) => {
                    const checkInterval = setInterval(() => {
                        const elapsed = Date.now() - uploadStartTime;
                        if (elapsed > timeout) {
                            clearInterval(checkInterval);
                            console.log('  ⚠️ Timeout reached');
                            resolve();
                        }
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
                columnCount: columnCount,
                aiSuggestionDuration: aiSuggestionEndTime > 0 ? (aiSuggestionEndTime - aiSuggestionStartTime) : 0,
                promptLength: promptLength,
                isColdStart: isFirstRun, // 🆕 Capture Cold Start
                metrics: {
                    uploadDuration: (ingestTime - uploadStartTime),
                    ingestDuration: 0,
                    aiLatency: (firstInsightTime - uploadStartTime),
                    totalDuration: totalDuration * 1000,
                    duckDBInitDuration: isFirstRun ? (duckDBInitEndTime - duckDBInitTime) : 0 // 🆕
                },
                insights: insights,
                timeline: timeline,
                errors: errors,
                injectionFailures: injectionFailures,  // 🆕 参数注入失败记录
                validationBlocks: validationBlocks     // 🆕 列名验证失败记录
            });

            isFirstRun = false; // Next datasets will be warm
            await page.close();
        }

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        await browser.close();
    }

    // 生成报告
    generateReport(results, REPORT_PATH);

})();
