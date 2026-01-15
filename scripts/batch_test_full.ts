#!/usr/bin/env node
/**
 * 批量洞察分析全量测试 - 中英文自动化测试主控脚本
 * 
 * 功能：
 * 1. 自动运行中文全量测试
 * 2. 自动切换界面语言
 * 3. 自动运行英文全量测试
 * 4. 恢复中文语言设置
 * 
 * 预计总耗时：30-45分钟
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function runTest(locale: string, reportSuffix: string) {
    log(`\n${'='.repeat(60)}`, colors.bright);
    log(`  开始 ${locale === 'zh-CN' ? '中文' : '英文'} 测试`, colors.cyan);
    log(`${'='.repeat(60)}\n`, colors.bright);

    const startTime = Date.now();

    try {
        // 运行测试脚本，传入语言参数
        execSync(
            `npx tsx scripts/batch_test_insights_single.ts ${locale} ${reportSuffix}`,
            {
                cwd: path.resolve(__dirname, '..'),
                stdio: 'inherit', // 实时显示输出
            }
        );

        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        log(`\n✅ ${locale === 'zh-CN' ? '中文' : '英文'}测试完成 (耗时: ${duration}分钟)\n`, colors.green);
        return true;
    } catch (error) {
        log(`\n❌ ${locale === 'zh-CN' ? '中文' : '英文'}测试失败`, colors.yellow);
        console.error(error);
        return false;
    }
}

async function main() {
    log('\n📊 批量洞察分析全量测试 - 中英文自动化测试', colors.bright);
    log('预计总耗时: 30-45分钟\n', colors.yellow);

    const overallStart = Date.now();

    // 1. 运行中文测试
    const zhSuccess = runTest('zh-CN', 'zh-CN-Full');

    if (!zhSuccess) {
        log('\n⚠️  中文测试失败，跳过英文测试', colors.yellow);
        process.exit(1);
    }

    // 等待一下，确保资源释放
    log('\n等待5秒后开始英文测试...\n', colors.cyan);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. 运行英文测试
    const enSuccess = runTest('en-US', 'en-US-Full');

    // 总结
    const totalDuration = ((Date.now() - overallStart) / 1000 / 60).toFixed(1);

    log('\n' + '='.repeat(60), colors.bright);
    log('  测试汇总', colors.cyan);
    log('='.repeat(60), colors.bright);
    log(`  中文测试: ${zhSuccess ? '✅ 成功' : '❌ 失败'}`, zhSuccess ? colors.green : colors.yellow);
    log(`  英文测试: ${enSuccess ? '✅ 成功' : '❌ 失败'}`, enSuccess ? colors.green : colors.yellow);
    log(`  总耗时: ${totalDuration}分钟`, colors.cyan);
    log('='.repeat(60) + '\n', colors.bright);

    log('📄 生成的报告:', colors.bright);
    if (zhSuccess) {
        log('  - docs/03-测试验证/48-测试-批量洞察分析测试报告-zh-CN-Full.md', colors.green);
    }
    if (enSuccess) {
        log('  - docs/03-测试验证/48-测试-批量洞察分析测试报告-en-US-Full.md', colors.green);
    }
    log('');

    process.exit(zhSuccess && enSuccess ? 0 : 1);
}

main().catch(err => {
    console.error('主控脚本执行失败:', err);
    process.exit(1);
});
