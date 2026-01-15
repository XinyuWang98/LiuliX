import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 单数据集测试（验证双重执行修复）
const DATASET = {
    path: 'test_datasets/small_sales_100.csv',
    expectedTime: 30
};

const BASE_URL = 'http://localhost:5173';

console.log('\n🔍 单数据集验证测试 - 检查双重执行修复\n');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    try {
        const page = await browser.newPage();
        const logs: string[] = [];

        // 监听控制台，收集所有包含 "批次ID" 或 "Inflater" 的日志
        page.on('console', async msg => {
            const text = msg.text();
            if (text.includes('批次ID') || text.includes('[Inflater]') || text.includes('Strict Mode')) {
                logs.push(text);
                console.log(`  [LOG] ${text}`);
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

        console.log(`📤 上传文件: ${DATASET.path}`);
        const uploadStartTime = Date.now();
        await inputUploadHandle.uploadFile(filePath);

        // 等待洞察完成（最多60秒）
        await new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
                const elapsed = Date.now() - uploadStartTime;
                if (elapsed > 60000 || logs.some(log => log.includes('膨胀完成'))) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
        });

        await page.close();

        // 分析日志
        console.log('\n📊 日志分析结果:\n');

        const batchStartLogs = logs.filter(log => log.includes('开始批量膨胀'));
        const batchEndLogs = logs.filter(log => log.includes('膨胀完成'));
        const strictModeLogs = logs.filter(log => log.includes('Strict Mode'));

        console.log(`  ✅ 批次开始日志数: ${batchStartLogs.length}`);
        console.log(`  ✅ 批次完成日志数: ${batchEndLogs.length}`);
        console.log(`  ✅ Strict Mode拦截日志数: ${strictModeLogs.length}`);

        if (batchStartLogs.length > 1) {
            console.log(`\n  ⚠️  检测到双重执行！`);
            batchStartLogs.forEach((log, idx) => {
                console.log(`    批次 ${idx + 1}: ${log}`);
            });
        } else {
            console.log(`\n  🎉 未检测到双重执行，修复成功！`);
        }

        if (strictModeLogs.length > 0) {
            console.log('\n  📝 Strict Mode 拦截详情:');
            strictModeLogs.forEach(log => console.log(`    ${log}`));
        }

    } finally {
        await browser.close();
    }
})();
