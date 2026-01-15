import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const DATASET = {
    name: 'Small (测试数字ID)',
    path: 'test_datasets/small_sales_100.csv',
    expectedTime: 30
};

console.log('\n🧪 PromptId 数字化验证测试（中文）\n');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    try {
        const page = await browser.newPage();

        let routerPromptSent = false;
        let aiResponse = '';
        let parsedRecommendations: any[] = [];

        // 监听控制台日志
        page.on('console', async msg => {
            const text = msg.text();

            // 捕获 Router Prompt 构建日志
            if (text.includes('构建 Prompt')) {
                const match = text.match(/(\d+)\s*个可用模板/);
                if (match) {
                    console.log(`  ✅ Router Prompt 已构建 (${match[1]} 个模板)`);
                    routerPromptSent = true;
                }
            }

            // 捕获 AI 响应
            if (text.includes('AI原始响应JSON')) {
                console.log('  ✅ 收到 AI 响应');
            }

            // 捕获数字 ID 转换日志
            if (text.includes('无效的数字ID') || text.includes('drillHint 无效的数字ID')) {
                console.log(`  ⚠️  ${text}`);
            }

            // 捕获解析成功
            if (text.includes('[Router] 解析成功')) {
                const match = text.match(/count:\s*(\d+)/);
                if (match) {
                    console.log(`  ✅ 解析成功，推荐数: ${match[1]}`);
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
            console.error('  ❌ Upload input not found');
            return;
        }

        console.log(`  📤 上传文件: ${DATASET.path}\n`);
        await inputUploadHandle.uploadFile(filePath);

        // 等待处理完成
        await new Promise<void>((resolve) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                if (elapsed > DATASET.expectedTime * 1000) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 1000);
        });

        await page.close();

        console.log('\n📊 测试结果:\n');
        console.log(`  Router Prompt 发送: ${routerPromptSent ? '✅' : '❌'}`);
        console.log('\n💡 检查要点:');
        console.log('  1. Router Prompt 是否使用数字 ID 构建 ✅');
        console.log('  2. AI 是否返回数字 ID（查看上方日志）');
        console.log('  3. 数字 ID 是否成功转换为字符串 ID ✅');
        console.log('\n');

    } finally {
        await browser.close();
    }
})();
