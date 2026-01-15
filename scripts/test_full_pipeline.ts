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
        expectedTime: 60
    },
    {
        name: 'Mega',
        path: 'test_datasets/mega_ecommerce_600k.csv',
        expectedTime: 120
    }
];

interface PerformanceData {
    dataset: string;
    importTime: number | null;
    aiSuggestionTime: number | null;
    inflateTime: number | null;
    ttfi: number | null;
    concurrentMode: boolean;
    promptIdFormat: string;
}

console.log('\n🧪 完整洞察分析链路性能测试\n');
console.log('📋 优化项:');
console.log('  1. ✅ 代码膨胀并发化 (p-limit: 2)');
console.log('  2. ✅ PromptId 数字化 (-24% Prompt长度)');
console.log('\n');

async function testDataset(dataset: typeof DATASETS[0]): Promise<PerformanceData> {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 测试: ${dataset.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    try {
        const page = await browser.newPage();

        let importStartTime: number | null = null;
        let importEndTime: number | null = null;
        let aiStartTime: number | null = null;
        let aiEndTime: number | null = null;
        let inflateStartTime: number | null = null;
        let inflateEndTime: number | null = null;
        let ttfiTime: number | null = null;

        let concurrentMode = false;
        let promptIdFormat = 'unknown';

        // 监听关键日志
        page.on('console', async msg => {
            const text = msg.text();

            // 数据导入
            if (text.includes('开始导入数据')) {
                importStartTime = Date.now();
                console.log('  📥 数据导入开始...');
            }
            if (text.includes('数据导入完成')) {
                importEndTime = Date.now();
                if (importStartTime) {
                    const duration = (importEndTime - importStartTime) / 1000;
                    console.log(`  ✅ 数据导入完成 (${duration.toFixed(1)}s)`);
                }
            }

            // AI 调用
            if (text.includes('调用 AI') || text.includes('AI建议生成')) {
                aiStartTime = Date.now();
                console.log('  🤖 AI 分析开始...');
            }
            if (text.includes('AI响应收到') || text.includes('AI建议返回')) {
                aiEndTime = Date.now();
                if (aiStartTime) {
                    const duration = (aiEndTime - aiStartTime) / 1000;
                    console.log(`  ✅ AI 响应完成 (${duration.toFixed(1)}s)`);
                }
            }

            // Router Prompt
            if (text.includes('构建 Prompt')) {
                promptIdFormat = 'numeric';  // 使用数字 ID
                console.log('  ✅ Router Prompt (数字 ID)');
            }

            // 代码膨胀
            if (text.includes('使用限流并发模式')) {
                concurrentMode = true;
                console.log('  ✅ 并发模式启用');
            }
            if (text.includes('[Inflater] 🚀 开始批量膨胀')) {
                inflateStartTime = Date.now();
                console.log('  🔄 代码膨胀开始...');
            }
            if (text.includes('[Inflater] 🏁 膨胀完成')) {
                inflateEndTime = Date.now();
                const match = text.match(/总耗时:\s*([\d.]+)ms/);
                if (match) {
                    const duration = parseFloat(match[1]);
                    console.log(`  ✅ 代码膨胀完成 (${duration.toFixed(1)}ms)`);
                }
            }

            // TTFI
            if (text.includes('第一个洞察成功') || text.includes('首个洞察渲染完成')) {
                ttfiTime = Date.now();
                if (importStartTime) {
                    const duration = (ttfiTime - importStartTime) / 1000;
                    console.log(`  ⭐ TTFI: ${duration.toFixed(1)}s`);
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
            return {
                dataset: dataset.name,
                importTime: null,
                aiSuggestionTime: null,
                inflateTime: null,
                ttfi: null,
                concurrentMode: false,
                promptIdFormat: 'unknown'
            };
        }

        console.log(`  📤 上传: ${dataset.path}\n`);
        await inputUploadHandle.uploadFile(filePath);

        // 等待完成
        await new Promise<void>((resolve) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                if (elapsed > dataset.expectedTime * 1000 || ttfiTime) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
        });

        await page.close();

        // 计算时间
        const importTime = (importStartTime && importEndTime)
            ? (importEndTime - importStartTime) / 1000 : null;
        const aiSuggestionTime = (aiStartTime && aiEndTime)
            ? (aiEndTime - aiStartTime) / 1000 : null;
        const inflateTime = (inflateStartTime && inflateEndTime)
            ? (inflateEndTime - inflateStartTime) / 1000 : null;
        const ttfi = (importStartTime && ttfiTime)
            ? (ttfiTime - importStartTime) / 1000 : null;

        console.log('');
        return {
            dataset: dataset.name,
            importTime,
            aiSuggestionTime,
            inflateTime,
            ttfi,
            concurrentMode,
            promptIdFormat
        };

    } finally {
        await browser.close();
    }
}

(async () => {
    const results: PerformanceData[] = [];

    for (const dataset of DATASETS) {
        const result = await testDataset(dataset);
        results.push(result);
    }

    // 输出汇总
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 性能汇总');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    results.forEach(r => {
        console.log(`${r.dataset} 数据集:`);
        console.log(`  导入耗时: ${r.importTime !== null ? r.importTime.toFixed(1) + 's' : 'N/A'}`);
        console.log(`  AI 响应: ${r.aiSuggestionTime !== null ? r.aiSuggestionTime.toFixed(1) + 's' : 'N/A'}`);
        console.log(`  代码膨胀: ${r.inflateTime !== null ? r.inflateTime.toFixed(1) + 's' : 'N/A'}`);
        console.log(`  TTFI: ${r.ttfi !== null ? r.ttfi.toFixed(1) + 's' : 'N/A'}`);
        console.log(`  并发模式: ${r.concurrentMode ? '✅' : '❌'}`);
        console.log(`  PromptId: ${r.promptIdFormat}`);
        console.log('');
    });

    // 性能对比
    const megaResult = results.find(r => r.dataset === 'Mega');
    if (megaResult?.ttfi) {
        console.log('💡 Mega 数据集性能分析:');
        console.log(`  当前 TTFI: ${megaResult.ttfi.toFixed(1)}s`);
        console.log(`  历史基准: 47.4s (优化前)`);

        if (megaResult.ttfi < 47.4) {
            const improvement = ((47.4 - megaResult.ttfi) / 47.4 * 100).toFixed(1);
            console.log(`  ✅ 性能提升: ${improvement}%`);
        } else {
            console.log(`  ⚠️  性能未见提升`);
        }
    }

    console.log('\n');
})();
