/**
 * 流式处理优化验证 - 快速测试脚本
 * 仅测试 small 和 mega 数据集
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const DATASET_DIR = path.resolve(__dirname, '../test_datasets');

// 测试数据集
const DATASETS = [
    {
        name: 'Small',
        file: 'small_sales_100.csv',
        path: path.join(DATASET_DIR, 'small_sales_100.csv')
    },
    {
        name: 'Mega',
        file: 'mega_ecommerce_600k.csv',
        path: path.join(DATASET_DIR, 'mega_ecommerce_600k.csv')
    }
];

async function testDataset(page: any, dataset: any) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 测试数据集: ${dataset.name} (${dataset.file})`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();

    // 导航到首页
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // 上传文件
    console.log('⬆️  上传文件...');
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) throw new Error('找不到文件上传输入');

    await fileInput.uploadFile(dataset.path);

    // 等待数据上传完成
    await page.waitForSelector('[data-stage="complete"]', { timeout: 300000 });
    const uploadTime = Date.now() - startTime;
    console.log(`✅ 数据上传完成 (${(uploadTime / 1000).toFixed(1)}s)`);

    // 点击洞察标签
    console.log('📈 切换到洞察标签...');
    await page.click('[data-tab="insights"]');

    // 开始计时 TTFI
    const insightStartTime = Date.now();

    // 等待第一个洞察卡片出现
    console.log('⏳ 等待第一个洞察...');
    await page.waitForSelector('.insight-card', { timeout: 120000 });

    const ttfi = Date.now() - insightStartTime;
    console.log(`\n⭐ TTFI: ${(ttfi / 1000).toFixed(1)}s\n`);

    // 等待所有洞察完成
    await page.waitForFunction(() => {
        const cards = document.querySelectorAll('.insight-card');
        return cards.length >= 4; // 假设至少4个洞察
    }, { timeout: 180000 });

    const totalTime = Date.now() - insightStartTime;
    console.log(`✅ 所有洞察完成 (${(totalTime / 1000).toFixed(1)}s)`);

    // 抓取 Console 日志
    const logs: string[] = [];
    page.on('console', (msg: any) => {
        const text = msg.text();
        if (text.includes('[流式处理]') || text.includes('⭐')) {
            logs.push(text);
        }
    });

    return {
        dataset: dataset.name,
        ttfi: (ttfi / 1000).toFixed(1),
        totalTime: (totalTime / 1000).toFixed(1),
        uploadTime: (uploadTime / 1000).toFixed(1),
        logs
    };
}

async function main() {
    console.log('\n🚀 流式处理优化验证测试');
    console.log(`🔗 URL: ${BASE_URL}`);
    console.log(`⏰ 开始时间: ${new Date().toLocaleString('zh-CN')}\n`);

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // 收集控制台日志
    const allLogs: string[] = [];
    page.on('console', (msg: any) => {
        const text = msg.text();
        allLogs.push(`[${new Date().toISOString()}] ${text}`);

        // 实时打印流式处理日志
        if (text.includes('[流式处理]') || text.includes('⭐') || text.includes('TTFI')) {
            console.log(`  📝 ${text}`);
        }
    });

    const results = [];

    for (const dataset of DATASETS) {
        try {
            const result = await testDataset(page, dataset);
            results.push(result);
        } catch (error) {
            console.error(`❌ 测试失败: ${dataset.name}`, error);
            results.push({
                dataset: dataset.name,
                error: String(error)
            });
        }

        // 清理：刷新页面准备下一个测试
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 打印结果汇总
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(60) + '\n');

    results.forEach(r => {
        if ('error' in r) {
            console.log(`❌ ${r.dataset}: 失败`);
            console.log(`   错误: ${r.error}\n`);
        } else {
            console.log(`✅ ${r.dataset}:`);
            console.log(`   ⭐ TTFI: ${r.ttfi}s`);
            console.log(`   ⏱️  总时间: ${r.totalTime}s`);
            console.log(`   ⬆️  上传: ${r.uploadTime}s\n`);
        }
    });

    await browser.close();

    console.log('✨ 测试完成！\n');
}

main().catch(console.error);
