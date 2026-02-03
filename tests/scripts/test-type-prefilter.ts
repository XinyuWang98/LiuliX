#!/usr/bin/env tsx
/**
 * 类型预过滤测试脚本 (简化版)
 * 
 * 功能：快速验证 ENABLE_TYPE_CONTEXT_PASSING 的效果
 * 运行：tsx tests/scripts/test-type-prefilter.ts
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试数据集路径
const TEST_DATASETS_DIR = path.resolve(__dirname, '../../test_datasets');

// 模拟的类型约束信息（从实际代码推导）
const TEMPLATE_TYPE_CONSTRAINTS: Record<string, string[] | undefined> = {
    'cleaner-standardize-date-v1': ['VARCHAR', 'TEXT'],
    'cleaner-remove-duplicates-v1': undefined,  // 无类型约束
    'cleaner-fill-null-median-v1': ['INTEGER', 'BIGINT', 'DOUBLE', 'DECIMAL'],
    'cleaner-uppercase-v1': ['VARCHAR', 'TEXT'],
    'cleaner-lowercase-v1': ['VARCHAR', 'TEXT'],
    'cleaner-trim-whitespace-v1': ['VARCHAR', 'TEXT'],
};

// 测试结果接口
interface TestResult {
    dataset: string;
    columnTypes: string[];
    flagOff: {
        templates: string[];
        count: number;
    };
    flagOn: {
        templates: string[];
        count: number;
    };
    filterEffect: number;
    filterRate: string;
}

/**
 * 模拟类型预过滤逻辑
 */
function filterTemplatesByType(
    templates: string[],
    columnTypes: string[],
    enableFilter: boolean
): string[] {
    if (!enableFilter) {
        return templates;
    }

    const availableTypes = new Set(columnTypes);

    return templates.filter(templateId => {
        const requiredTypes = TEMPLATE_TYPE_CONSTRAINTS[templateId];

        // 无类型约束的模板默认兼容
        if (!requiredTypes || requiredTypes.length === 0) {
            return true;
        }

        // 检查是否有任何一列类型匹配模板要求
        return requiredTypes.some(requiredType => availableTypes.has(requiredType));
    });
}

/**
 * 从CSV推断列类型（简化版）
 */
function inferColumnTypes(csvPath: string): string[] {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        return [];
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const firstDataRow = lines[1].split(',');

    return headers.map((header, index) => {
        const value = firstDataRow[index]?.trim().replace(/['"]/g, '');

        // 简单的类型推断
        if (!value || value === '') {
            return 'VARCHAR';
        }

        // 数字
        if (!isNaN(Number(value))) {
            return value.includes('.') ? 'DOUBLE' : 'INTEGER';
        }

        // 日期（简单检测）
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            return 'DATE';
        }

        if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(value)) {
            return 'TIMESTAMP';
        }

        return 'VARCHAR';
    });
}

async function main() {
    console.log('='.repeat(80));
    console.log('📊 类型预过滤功能测试');
    console.log('='.repeat(80));
    console.log();

    // 获取所有CSV文件（排除超大文件以加快测试）
    const datasets = fs.readdirSync(TEST_DATASETS_DIR)
        .filter(file => file.endsWith('.csv'))
        .filter(file => !file.includes('2m') && !file.includes('600k') && !file.includes('1m'))  // 排除超大文件
        .slice(0, 5)  // 限制测试数量
        .map(file => ({
            name: file,
            path: path.join(TEST_DATASETS_DIR, file)
        }));

    console.log(`📁 测试数据集数量: ${datasets.length}`);
    console.log(`📋 模板类型约束: ${Object.keys(TEMPLATE_TYPE_CONSTRAINTS).length} 个模板`);
    console.log();

    const results: TestResult[] = [];
    const allTemplates = Object.keys(TEMPLATE_TYPE_CONSTRAINTS);

    // 测试每个数据集
    for (const dataset of datasets) {
        try {
            console.log(`\n${'─'.repeat(80)}`);
            console.log(`📄 ${dataset.name}`);
            console.log(`${'─'.repeat(80)}`);

            // 推断列类型
            const columnTypes = inferColumnTypes(dataset.path);
            const uniqueTypes = Array.from(new Set(columnTypes));

            console.log(`  列数: ${columnTypes.length}`);
            console.log(`  类型分布: ${uniqueTypes.join(', ')}`);

            // Feature Flag OFF
            const templatesOff = filterTemplatesByType(allTemplates, uniqueTypes, false);

            // Feature Flag ON
            const templatesOn = filterTemplatesByType(allTemplates, uniqueTypes, true);

            const filterEffect = templatesOff.length - templatesOn.length;
            const filterRate = ((filterEffect / templatesOff.length) * 100).toFixed(1);

            console.log();
            console.log(`  ⚙️  Flag OFF: ${templatesOff.length} 模板`);
            console.log(`     ${templatesOff.join(', ')}`);
            console.log();
            console.log(`  ⚙️  Flag ON:  ${templatesOn.length} 模板`);
            console.log(`     ${templatesOn.join(', ')}`);
            console.log();

            if (filterEffect > 0) {
                const filtered = templatesOff.filter(t => !templatesOn.includes(t));
                console.log(`  ✅ 过滤效果: -${filterEffect} 模板 (${filterRate}%)`);
                console.log(`     已过滤: ${filtered.join(', ')}`);
            } else if (filterEffect === 0) {
                console.log(`  ℹ️  未过滤: 所有模板均兼容当前列类型`);
            } else {
                console.log(`  ❌ 异常: Flag开启后模板数量增加 (+${Math.abs(filterEffect)})`);
            }

            results.push({
                dataset: dataset.name,
                columnTypes: uniqueTypes,
                flagOff: {
                    templates: templatesOff,
                    count: templatesOff.length
                },
                flagOn: {
                    templates: templatesOn,
                    count: templatesOn.length
                },
                filterEffect,
                filterRate
            });

        } catch (error: any) {
            console.error(`  ❌ 错误: ${error.message}`);
        }
    }

    // 生成汇总报告
    console.log('\n\n' + '='.repeat(80));
    console.log('📈 汇总统计');
    console.log('='.repeat(80));

    const totalDatasets = results.length;
    const datasetsWithFilter = results.filter(r => r.filterEffect > 0).length;
    const avgFilterRate = results.reduce((sum, r) => sum + parseFloat(r.filterRate), 0) / totalDatasets;
    const maxFilterRate = Math.max(...results.map(r => parseFloat(r.filterRate)));
    const minFilterRate = Math.min(...results.map(r => parseFloat(r.filterRate)));

    console.log();
    console.log(`  总数据集数: ${totalDatasets}`);
    console.log(`  触发过滤的数据集: ${datasetsWithFilter} (${((datasetsWithFilter / totalDatasets) * 100).toFixed(1)}%)`);
    console.log(`  平均过滤率: ${avgFilterRate.toFixed(1)}%`);
    console.log(`  最大过滤率: ${maxFilterRate.toFixed(1)}%`);
    console.log(`  最小过滤率: ${minFilterRate.toFixed(1)}%`);

    // 按过滤效果排序
    const sortedResults = results.sort((a, b) => b.filterEffect - a.filterEffect);

    console.log();
    console.log('  🏆 过滤效果排行:');
    sortedResults.slice(0, 5).forEach((r, index) => {
        console.log(`    ${index + 1}. ${r.dataset.padEnd(35)} -${r.filterEffect} 模板 (${r.filterRate}%)`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ 测试完成');
    console.log('='.repeat(80));
}

// 运行测试
main().catch(console.error);
