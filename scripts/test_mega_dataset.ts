import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mega 数据集测试
const DATASET = {
    path: 'test_datasets/mega_ecommerce_600k.csv',
    expectedTime: 120
};

const BASE_URL = 'http://localhost:5173';

console.log('\n🔥 Mega 数据集性能测试 - 验证 TTFI 改善\n');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    try {
        const page = await browser.newPage();
        const timeline: Array<{ time: string, event: string }> = [];
        let batchCount = 0;

        // 监听关键事件
        page.on('console', async msg => {
            const text = msg.text();
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

            if (text.includes('[Inflater] 🚀 开始批量膨胀')) {
                batchCount++;
                timeline.push({ time: timestamp, event: '🔄 代码膨胀开始' });
                console.log(`  [${timestamp}] 🔄 代码膨胀开始 (批次 #${batchCount})`);
            }

            if (text.includes('[Inflater] 🏁 膨胀完成')) {
                timeline.push({ time: timestamp, event: '🔄 代码膨胀完成' });
                console.log(`  [${timestamp}] 🔄 代码膨胀完成`);
            }

            if (text.includes('CSV导入成功')) {
                timeline.push({ time: timestamp, event: '✅ 数据导入完成' });
                console.log(`  [${timestamp}] ✅ 数据导入完成`);
            }

            if (text.includes('Router Prompt 模式')) {
                timeline.push({ time: timestamp, event: '🤖 AI建议返回' });
                console.log(`  [${timestamp}] 🤖 AI建议返回`);
            }

            if (text.includes('[TestProbe] InsightExecution')) {
                if (timeline.filter(t => t.event.includes('第一个洞察')).length === 0) {
                    timeline.push({ time: timestamp, event: '⭐ 第一个洞察成功 (TTFI)' });
                    console.log(`  [${timestamp}] ⭐ 第一个洞察成功 (TTFI)`);
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

        console.log(`📤 开始上传: ${DATASET.path}`);
        const uploadStartTime = Date.now();
        timeline.push({ time: new Date(uploadStartTime).toLocaleTimeString('en-US', { hour12: false }), event: '📥 文件上传开始' });

        await inputUploadHandle.uploadFile(filePath);

        // 等待TTFI（最多120秒）
        await new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
                const elapsed = Date.now() - uploadStartTime;
                if (elapsed > 120000 || timeline.some(t => t.event.includes('TTFI'))) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
        });

        await page.close();

        // 计算关键时间差
        const uploadStart = timeline.find(t => t.event.includes('上传开始'));
        const importDone = timeline.find(t => t.event.includes('导入完成'));
        const aiReturn = timeline.find(t => t.event.includes('AI建议返回'));
        const inflateStart = timeline.find(t => t.event.includes('膨胀开始'));
        const inflateDone = timeline.find(t => t.event.includes('膨胀完成'));
        const ttfi = timeline.find(t => t.event.includes('TTFI'));

        console.log('\n📊 性能分析结果:\n');
        console.log(`  批次执行次数: ${batchCount} 次 ${batchCount > 1 ? '⚠️ (仍有双重执行)' : '✅'}`);

        if (uploadStart && ttfi) {
            const uploadTime = new Date(`1970-01-01T${uploadStart.time}`).getTime();
            const ttfiTime = new Date(`1970-01-01T${ttfi.time}`).getTime();
            const totalSeconds = (ttfiTime - uploadTime) / 1000;
            console.log(`\n  ⏱️  TTFI (总耗时): ${totalSeconds.toFixed(1)}s`);

            if (totalSeconds < 25) {
                console.log(`  🎉 性能提升明显！（预期 41.5s → 实际 ${totalSeconds.toFixed(1)}s）`);
            } else {
                console.log(`  ⚠️  性能改善有限（预期 ~20s，实际 ${totalSeconds.toFixed(1)}s）`);
            }
        }

        console.log('\n📝 完整时间线:');
        timeline.forEach((t, idx) => {
            console.log(`  ${idx + 1}. [${t.time}] ${t.event}`);
        });

    } finally {
        await browser.close();
    }
})();
