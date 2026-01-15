import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';

// 测试数据集
const DATASETS = [
    {
        name: 'Small',
        path: 'test_datasets/small_sales_100.csv',
        expectedTime: 30
    },
    {
        name: 'Mega',
        path: 'test_datasets/mega_ecommerce_600k.csv',
        expectedTime: 120
    }
];

// 定义返回类型接口
interface TestResult {
    dataset: string;
    concurrentMode: boolean;
    batchId: string | null;
    inflateDuration: number | null;
    success: boolean;
}

console.log('\n🧪 代码膨胀并发化验证测试\n');

async function testDataset(dataset: typeof DATASETS[0]): Promise<TestResult | null> {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 测试数据集: ${dataset.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    try {
        const page = await browser.newPage();

        let concurrentModeDetected = false;
        let inflateStartTime: number | null = null;
        let inflateEndTime: number | null = null;
        let batchId: string | null = null;
        let inflateDuration: number | null = null;

        // 监听关键日志
        page.on('console', async msg => {
            const text = msg.text();

            // 检测并发模式启用
            if (text.includes('使用限流并发模式')) {
                concurrentModeDetected = true;
                console.log('  ✅ 检测到并发模式启用');
            }

            // 捕获膨胀开始
            if (text.includes('[Inflater] 🚀 开始批量膨胀')) {
                inflateStartTime = Date.now();
                const match = text.match(/batchId:\s*"([^"]+)"/);
                if (match) {
                    batchId = match[1];
                    console.log(`  🔄 膨胀开始 (批次ID: ${batchId})`);
                }
            }

            // 捕获膨胀完成
            if (text.includes('[Inflater] 🏁 膨胀完成')) {
                inflateEndTime = Date.now();
                const match = text.match(/总耗时:\s*([\d.]+)ms/);
                if (match) {
                    inflateDuration = parseFloat(match[1]);
                    console.log(`  ✅ 膨胀完成 (耗时: ${inflateDuration.toFixed(1)}ms)`);
                }
            }
        });

        await page.goto(BASE_URL);
        await page.evaluate(() => {
            localStorage.setItem('dataprism_language', 'zh-CN');
        });
        await page.reload();

        const filePath = path.resolve(process.cwd(), dataset.path);
        const inputUploadHandle = await page.$('input[type=file]');

        if (!inputUploadHandle) {
            console.error('  ❌ Upload input not found');
            return null;
        }

        console.log(`  📤 上传文件: ${dataset.path}`);
        await inputUploadHandle.uploadFile(filePath);

        // 等待膨胀完成（最多等待预期时间）
        await new Promise<void>((resolve) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                if (elapsed > dataset.expectedTime * 1000 || inflateEndTime) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
        });

        await page.close();

        // 返回结果
        return {
            dataset: dataset.name,
            concurrentMode: concurrentModeDetected,
            batchId,
            inflateDuration,
            success: concurrentModeDetected && inflateEndTime !== null
        };

    } finally {
        await browser.close();
    }
}

(async () => {
    const results: TestResult[] = [];

    for (const dataset of DATASETS) {
        const result = await testDataset(dataset);
        if (result) {
            results.push(result);
        }
    }

    // 输出汇总
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 测试结果汇总');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    results.forEach(r => {
        console.log(`${r.dataset} 数据集:`);
        console.log(`  并发模式: ${r.concurrentMode ? '✅ 已启用' : '❌ 未检测到'}`);
        console.log(`  批次ID: ${r.batchId || 'N/A'}`);
        console.log(`  膨胀耗时: ${r.inflateDuration !== null ? r.inflateDuration.toFixed(1) + 'ms' : 'N/A'}`);
        console.log(``);
    });

    // 性能对比
    const smallResult = results.find(r => r.dataset === 'Small');
    const megaResult = results.find(r => r.dataset === 'Mega');

    if (smallResult?.inflateDuration !== null && smallResult?.inflateDuration !== undefined &&
        megaResult?.inflateDuration !== null && megaResult?.inflateDuration !== undefined) {
        console.log('💡 性能参考:');
        console.log(`  Small: ${smallResult.inflateDuration.toFixed(1)}ms`);
        console.log(`  Mega: ${megaResult.inflateDuration.toFixed(1)}ms`);
        console.log(`\n  预期优化: 串行模式通常需要 1000-1500ms`);
        console.log(`  如果看到 600-800ms，说明并发优化生效！`);
    }

    console.log('\n');
})();
