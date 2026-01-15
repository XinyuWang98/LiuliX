import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET = {
    path: 'test_datasets/mega_ecommerce_600k.csv',
    expectedTime: 120
};

const BASE_URL = 'http://localhost:5173';

console.log('\n🔥 Mega 数据集详细性能追踪测试\n');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    try {
        const page = await browser.newPage();
        const performanceLogs: Array<{ time: number, event: string, detail?: string }> = [];
        let startTime = 0;

        // 记录所有关键日志
        page.on('console', async msg => {
            const text = msg.text();
            const now = Date.now();

            // 上传开始
            if (startTime === 0 && (text.includes('CSV导入成功') || text.includes('数据导入'))) {
                startTime = now - 2000; // 估算上传开始时间
                performanceLogs.push({ time: 0, event: '📥 文件上传开始' });
            }

            const elapsed = startTime > 0 ? (now - startTime) / 1000 : 0;

            // 数据导入
            if (text.includes('CSV导入成功')) {
                performanceLogs.push({ time: elapsed, event: '✅ 数据导入完成' });
                console.log(`  [+${elapsed.toFixed(1)}s] ✅ 数据导入完成`);
            }

            // AI 响应收到
            if (text.includes('✅ AI响应收到')) {
                performanceLogs.push({ time: elapsed, event: '🤖 AI响应收到', detail: text });
                console.log(`  [+${elapsed.toFixed(1)}s] 🤖 AI响应收到`);
            }

            // 解析开始
            if (text.includes('[性能追踪] 开始解析 Router')) {
                performanceLogs.push({ time: elapsed, event: '🔍 开始解析 Router 响应' });
                console.log(`  [+${elapsed.toFixed(1)}s] 🔍 开始解析 Router 响应`);
            }

            // parseRouterResponse 内部日志
            if (text.includes('[parseRouterResponse] 开始解析')) {
                performanceLogs.push({ time: elapsed, event: '  → parseRouterResponse 函数入口' });
                console.log(`  [+${elapsed.toFixed(1)}s]   → parseRouterResponse 函数入口`);
            }

            if (text.includes('[正则匹配] 耗时')) {
                const match = text.match(/耗时:\s*([\d.]+)s/);
                const duration = match ? match[1] : '?';
                performanceLogs.push({ time: elapsed, event: `  → 正则匹配: ${duration}s` });
                console.log(`  [+${elapsed.toFixed(1)}s]   → 正则匹配: ${duration}s`);
            }

            if (text.includes('[JSON.parse] 耗时')) {
                const match = text.match(/耗时:\s*([\d.]+)s/);
                const duration = match ? match[1] : '?';
                performanceLogs.push({ time: elapsed, event: `  → JSON.parse: ${duration}s` });
                console.log(`  [+${elapsed.toFixed(1)}s]   → JSON.parse: ${duration}s`);
            }

            // 解析完成
            if (text.includes('[性能追踪] Router 解析完成')) {
                const match = text.match(/duration:\s*"([\d.]+)s"/);
                const duration = match ? match[1] : '?';
                performanceLogs.push({ time: elapsed, event: `✅ Router 解析完成 (${duration}s)` });
                console.log(`  [+${elapsed.toFixed(1)}s] ✅ Router 解析完成 (${duration}s)`);
            }

            // 准备膨胀
            if (text.includes('准备膨胀推荐')) {
                performanceLogs.push({ time: elapsed, event: '🔍 准备膨胀推荐' });
                console.log(`  [+${elapsed.toFixed(1)}s] 🔍 准备膨胀推荐`);
            }

            // 开始膨胀
            if (text.includes('[性能追踪] 开始调用 inflateRecommendations')) {
                performanceLogs.push({ time: elapsed, event: '🚀 开始调用 inflateRecommendations' });
                console.log(`  [+${elapsed.toFixed(1)}s] 🚀 开始调用 inflateRecommendations`);
            }

            // 批次膨胀开始
            if (text.includes('[Inflater] 🚀 开始批量膨胀')) {
                const match = text.match(/batchId:\s*"([^"]+)"/);
                const batchId = match ? match[1] : 'unknown';
                performanceLogs.push({ time: elapsed, event: `  → Inflater 批次开始 (${batchId})` });
                console.log(`  [+${elapsed.toFixed(1)}s]   → Inflater 批次开始 (${batchId})`);
            }

            // 批次膨胀完成
            if (text.includes('[Inflater] 🏁 膨胀完成')) {
                const match = text.match(/总耗时:\s*([\d.]+)ms/);
                const duration = match ? match[1] : '?';
                performanceLogs.push({ time: elapsed, event: `  → Inflater 批次完成 (${duration}ms)` });
                console.log(`  [+${elapsed.toFixed(1)}s]   → Inflater 批次完成 (${duration}ms)`);
            }

            // inflateRecommendations 完成
            if (text.includes('[性能追踪] inflateRecommendations 完成')) {
                const match = text.match(/duration:\s*"([\d.]+)s"/);
                const duration = match ? match[1] : '?';
                performanceLogs.push({ time: elapsed, event: `✅ inflateRecommendations 完成 (${duration}s)` });
                console.log(`  [+${elapsed.toFixed(1)}s] ✅ inflateRecommendations 完成 (${duration}s)`);
            }

            // TTFI
            if (text.includes('[TestProbe] InsightExecution')) {
                if (performanceLogs.filter(l => l.event.includes('TTFI')).length === 0) {
                    performanceLogs.push({ time: elapsed, event: '⭐ 第一个洞察成功 (TTFI)' });
                    console.log(`  [+${elapsed.toFixed(1)}s] ⭐ 第一个洞察成功 (TTFI)`);
                }
            }
        });

        await page.goto(BASE_URL);
        await page.evaluate(() => {
            localStorage.setItem('dataprism_language', 'zh-CN');
        });
        await page.reload();

        const filePath = path.resolve(process.cwd(), DATASET.path);
        const inputUploadHandle = await page.$('input[type=file]');

        if (!inputUploadHandle) {
            console.error('❌ Upload input not found');
            return;
        }

        console.log(`📤 开始上传: ${DATASET.path}\n`);
        await inputUploadHandle.uploadFile(filePath);

        // 等待TTFI（最多120秒）
        await new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
                const now = Date.now();
                if ((now - (startTime || now)) > 120000 || performanceLogs.some(l => l.event.includes('TTFI'))) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
        });

        await page.close();

        // 分析空白期
        console.log('\n\n📊 空白期分析:\n');

        for (let i = 1; i < performanceLogs.length; i++) {
            const prev = performanceLogs[i - 1];
            const curr = performanceLogs[i];
            const gap = curr.time - prev.time;

            if (gap > 5) {  // 超过 5 秒的空白期
                console.log(`  ⚠️  空白期 ${gap.toFixed(1)}s:`);
                console.log(`      从: [+${prev.time.toFixed(1)}s] ${prev.event}`);
                console.log(`      到: [+${curr.time.toFixed(1)}s] ${curr.event}`);
                console.log('');
            }
        }

        const ttfi = performanceLogs.find(l => l.event.includes('TTFI'));
        if (ttfi) {
            console.log(`\n  🏁 总 TTFI: ${ttfi.time.toFixed(1)}s\n`);
        }

    } finally {
        await browser.close();
    }
})();
