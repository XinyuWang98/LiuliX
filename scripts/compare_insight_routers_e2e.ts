
import puppeteer, { Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import {
    DATASETS,
    DATASET_DIR,
    BASE_URL,
    generateReportPath,
    parseTime,
    LOCALE,
    TestResult,
    LogEntry
} from './test-utils/batch_test_config.js'; // Use .js extension for tsx resolution if needed, or .ts if tsx handles it. Usually .js for ESM imports in TS if checking local files. 
// Actually tsx handles .ts, but importing from .js might work if transpiled. 
// Let's assume .ts works with `import ... from './...ts'` in tsx or try standard resolution.
// Re-reading batch_test_insights_single.ts, it uses .js extension in import: `from './test-utils/batch_test_config.js';`
// So I will stick to that pattern.

const REPORT_PATH = path.join(process.cwd(), 'docs/03-测试验证/49-测试-Router对比报告_E2E.md');
const SYNTHETIC_ZH_DATASET = path.join(DATASET_DIR, 'synthetic_zh_sales.csv');

// --- Helper: Ensure Synthetic Dataset Exists ---
if (!fs.existsSync(SYNTHETIC_ZH_DATASET)) {
    const csvContent =
        `日期,销售额,产品类型,地区,客户满意度
2023-01-01,1000,电子产品,华北,5
2023-01-02,1500,家居,华南,4
2023-01-03,800,电子产品,华东,3
2023-01-04,2000,服装,华北,5
2023-01-05,1200,家居,华西,4
`;
    fs.writeFileSync(SYNTHETIC_ZH_DATASET, csvContent);
    console.log(`✅ Created synthetic dataset: ${SYNTHETIC_ZH_DATASET}`);
}

// Add synthetic to datasets list
const TARGET_DATASETS = [
    // Pick one typical English dataset
    { path: 'test_datasets/medium_orders_500.csv', expectedTime: 10 },
    // And the Chinese one
    { path: 'test_datasets/synthetic_zh_sales.csv', expectedTime: 5 }
];

interface RouterSuggestion {
    dataset: string;
    lang: string;
    mode: 'Cloud' | 'Local';
    column: string;
    suggestion: string; // Prompt ID
    confidence: number;
    timestamp: number;
}

const capturedSuggestions: RouterSuggestion[] = [];

(async () => {
    console.log('🚀 Starting E2E Router Comparison...');
    const browser = await puppeteer.launch({
        headless: true, // headless: "new" is deprecated, true is fine
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    try {
        // Iterate Datasets
        for (const ds of TARGET_DATASETS) {
            const fileName = path.basename(ds.path);
            const filePath = path.resolve(process.cwd(), ds.path);

            if (!fs.existsSync(filePath)) {
                console.error(`❌ File not found: ${filePath}`);
                continue;
            }

            console.log(`\n📂 Dataset: ${fileName}`);

            // Iterate Languages
            for (const lang of ['en-US', 'zh-CN']) {
                console.log(`  🌐 Language: ${lang}`);

                // Iterate Modes (Cloud vs Local)
                for (const mode of ['Cloud', 'Local']) {
                    const isLocal = mode === 'Local';
                    console.log(`    ⚡ Mode: ${mode}`);

                    // 🆕 为每个测试创建新的 Page 实例，避免 Frame 冲突
                    let testPage: Page | null = null;

                    try {
                        testPage = await browser.newPage();

                        // 设置导航超时
                        testPage.setDefaultNavigationTimeout(30000);
                        testPage.setDefaultTimeout(30000);

                        // 1. Setup Environment
                        await testPage.goto(BASE_URL, {
                            waitUntil: 'networkidle0',
                            timeout: 30000
                        });

                        await testPage.evaluate((l: string, localEnabled: boolean) => {
                            localStorage.clear();
                            localStorage.setItem('dataprism_language', l);
                            localStorage.setItem('feature_flags', JSON.stringify({
                                ENABLE_LOCAL_ROUTER: localEnabled
                            }));
                        }, lang, isLocal);

                        await testPage.reload({ waitUntil: 'networkidle0' });

                        // 2. Upload File
                        const inputUploadHandle = await testPage.$('input[type=file]');
                        if (!inputUploadHandle) {
                            console.error('      ❌ Upload input not found');
                            continue;
                        }
                        await inputUploadHandle.uploadFile(filePath);

                        // 3. Wait and Capture Logs
                        const modeSuggestions: RouterSuggestion[] = [];

                        // 3. Capture Logs Logic
                        const logHandler = async (msg: any) => {
                            const text = msg.text();
                            try {
                                // Target Log: [AI服务] [RouterPrompt] 解析完成
                                if (text.includes('[RouterPrompt] 解析完成') || text.includes('Router result')) {
                                    const args = msg.args();
                                    if (args.length >= 2) {
                                        const dataHandle = args[1];
                                        const data = await dataHandle.jsonValue();

                                        console.log(`      🔎 Log Captured: ${text.substring(0, 50)}...`);

                                        capturedSuggestions.push({
                                            dataset: fileName,
                                            lang,
                                            mode: mode as 'Cloud' | 'Local',
                                            column: 'n/a',
                                            suggestion: 'Log captured (see report)',
                                            confidence: 0,
                                            timestamp: Date.now()
                                        });
                                    }
                                }
                            } catch (e) {
                                console.error('      ⚠️ Log parsing failed:', e);
                            }
                        };

                        testPage.on('console', logHandler);

                        // Wait 10s for analysis
                        await new Promise(r => setTimeout(r, 10000));

                        testPage.off('console', logHandler);

                    } catch (pageError) {
                        console.error(`      ❌ Test failed for ${fileName}/${lang}/${mode}:`, pageError);
                    } finally {
                        // 🆕 清理：关闭当前测试的 Page 实例
                        if (testPage) {
                            await testPage.close().catch((e: unknown) => console.error('      ⚠️ Page close error:', e));
                        }
                    }
                }
            }
        }

    } catch (e) {
        console.error('Fatal Error:', e);
    } finally {
        await browser.close();
    }

    // Generate Report based on captured data (Mocked for now as I need to debug log format first)
    console.log('Generating report...');
    // ...
})();
