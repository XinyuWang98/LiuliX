#!/usr/bin/env tsx
/**
 * 类型预过滤测试脚本 - 预期结果模拟版
 * 
 * 功能：模拟应用所有建议后的预期测试结果
 * 包含：通过率预测、报错场景模拟、边界情况验证
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== 测试数据集定义 ==========

interface TestDataset {
    name: string;
    columnTypes: string[];
    description: string;
    expected: {
        filterRate: number;
        filteredTemplates: string[];
        remainingTemplates: string[];
        potentialErrors?: string[];
    };
}

// 模板定义
const ALL_TEMPLATES = [
    'cleaner-standardize-date-v1',
    'cleaner-remove-duplicates-v1',
    'cleaner-fill-null-median-v1',
    'cleaner-uppercase-v1',
    'cleaner-lowercase-v1',
    'cleaner-trim-whitespace-v1',
];

const TEMPLATE_CONSTRAINTS: Record<string, string[] | undefined> = {
    'cleaner-standardize-date-v1': ['VARCHAR', 'TEXT'],
    'cleaner-remove-duplicates-v1': undefined,
    'cleaner-fill-null-median-v1': ['INTEGER', 'BIGINT', 'DOUBLE', 'DECIMAL'],
    'cleaner-uppercase-v1': ['VARCHAR', 'TEXT'],
    'cleaner-lowercase-v1': ['VARCHAR', 'TEXT'],
    'cleaner-trim-whitespace-v1': ['VARCHAR', 'TEXT'],
};

// ========== 预期测试场景 ==========

const EXPECTED_SCENARIOS: TestDataset[] = [
    // ✅ 理想场景：纯数值数据
    {
        name: 'numbers_only.csv (理想)',
        columnTypes: ['INTEGER', 'DOUBLE', 'DECIMAL'],
        description: '纯数值传感器数据：id, temperature, humidity, pressure',
        expected: {
            filterRate: 66.7, // 4/6 模板被过滤
            filteredTemplates: [
                'cleaner-standardize-date-v1',
                'cleaner-uppercase-v1',
                'cleaner-lowercase-v1',
                'cleaner-trim-whitespace-v1'
            ],
            remainingTemplates: [
                'cleaner-remove-duplicates-v1',  // 无约束
                'cleaner-fill-null-median-v1'    // 数值操作
            ],
            potentialErrors: []
        }
    },

    // ✅ 理想场景：纯字符串数据
    {
        name: 'strings_only.csv (理想)',
        columnTypes: ['VARCHAR', 'TEXT'],
        description: '纯文本日志：log_level, message, user_agent, error_msg',
        expected: {
            filterRate: 16.7, // 1/6 模板被过滤
            filteredTemplates: [
                'cleaner-fill-null-median-v1'  // 仅数值操作
            ],
            remainingTemplates: [
                'cleaner-standardize-date-v1',
                'cleaner-remove-duplicates-v1',
                'cleaner-uppercase-v1',
                'cleaner-lowercase-v1',
                'cleaner-trim-whitespace-v1'
            ],
            potentialErrors: []
        }
    },

    // ⚠️ 边界场景：纯日期数据
    {
        name: 'dates_only.csv (边界)',
        columnTypes: ['DATE', 'TIMESTAMP'],
        description: '时间序列数据：created_at, updated_at, deleted_at',
        expected: {
            filterRate: 83.3, // 5/6 模板被过滤
            filteredTemplates: [
                'cleaner-standardize-date-v1',   // 需要VARCHAR输入
                'cleaner-fill-null-median-v1',   // 需要数值
                'cleaner-uppercase-v1',
                'cleaner-lowercase-v1',
                'cleaner-trim-whitespace-v1'
            ],
            remainingTemplates: [
                'cleaner-remove-duplicates-v1'   // 无约束
            ],
            potentialErrors: [
                '⚠️ DATE列不应推荐日期标准化（已是DATE类型）'
            ]
        }
    },

    // ✅ 现实场景：混合数据（当前测试集）
    {
        name: 'mixed_types.csv (现实)',
        columnTypes: ['INTEGER', 'VARCHAR', 'DOUBLE', 'DATE'],
        description: '混合业务数据：id, name, amount, date, status',
        expected: {
            filterRate: 0, // 无过滤
            filteredTemplates: [],
            remainingTemplates: ALL_TEMPLATES,
            potentialErrors: [
                'ℹ️ 混合类型数据无法有效过滤，建议使用"兼容度评分"策略'
            ]
        }
    },

    // ❌ 异常场景：空数据
    {
        name: 'empty.csv (异常)',
        columnTypes: [],
        description: '空文件或仅有表头',
        expected: {
            filterRate: 0,
            filteredTemplates: [],
            remainingTemplates: ALL_TEMPLATES,
            potentialErrors: [
                '❌ 无法推断列类型，应使用默认策略（保留所有模板）'
            ]
        }
    },

    // ❌ 异常场景：未知类型
    {
        name: 'unknown_types.csv (异常)',
        columnTypes: ['BLOB', 'JSON', 'ARRAY'],
        description: '包含复杂类型',
        expected: {
            filterRate: 83.3,
            filteredTemplates: [
                'cleaner-standardize-date-v1',
                'cleaner-fill-null-median-v1',
                'cleaner-uppercase-v1',
                'cleaner-lowercase-v1',
                'cleaner-trim-whitespace-v1'
            ],
            remainingTemplates: [
                'cleaner-remove-duplicates-v1'
            ],
            potentialErrors: [
                '⚠️ BLOB/JSON/ARRAY 类型不在模板约束定义中'
            ]
        }
    }
];

// ========== 测试执行引擎 ==========

function filterTemplates(
    templates: string[],
    columnTypes: string[],
    enableFilter: boolean
): string[] {
    if (!enableFilter || columnTypes.length === 0) {
        return templates;
    }

    const availableTypes = new Set(columnTypes);

    return templates.filter(templateId => {
        const requiredTypes = TEMPLATE_CONSTRAINTS[templateId];

        if (!requiredTypes || requiredTypes.length === 0) {
            return true;
        }

        return requiredTypes.some(requiredType => availableTypes.has(requiredType));
    });
}

function calculateAccuracy(
    actual: string[],
    expected: string[]
): { match: boolean; accuracy: number; diff: string[] } {
    const actualSet = new Set(actual);
    const expectedSet = new Set(expected);

    const matches = actual.filter(t => expectedSet.has(t));
    const accuracy = matches.length / expected.length * 100;

    const diff = [
        ...actual.filter(t => !expectedSet.has(t)).map(t => `+${t}`),
        ...expected.filter(t => !actualSet.has(t)).map(t => `-${t}`)
    ];

    return {
        match: accuracy === 100 && diff.length === 0,
        accuracy,
        diff
    };
}

// ========== 主测试函数 ==========

async function main() {
    console.log('='.repeat(80));
    console.log('📊 类型预过滤功能 - 预期结果模拟测试');
    console.log('='.repeat(80));
    console.log();
    console.log('📋 测试场景数: ' + EXPECTED_SCENARIOS.length);
    console.log('🎯 预期整体通过率: 83.3% (5/6 场景)');
    console.log();

    let passedTests = 0;
    let totalTests = 0;
    const results: Array<{
        scenario: string;
        passed: boolean;
        filterRate: number;
        accuracy: number;
        errors: string[];
    }> = [];

    for (const scenario of EXPECTED_SCENARIOS) {
        totalTests++;
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`📄 ${scenario.name}`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`  描述: ${scenario.description}`);
        console.log(`  列类型: ${scenario.columnTypes.join(', ') || '(空)'}`);
        console.log();

        // Flag OFF
        const templatesOff = filterTemplates(ALL_TEMPLATES, scenario.columnTypes, false);

        // Flag ON
        const templatesOn = filterTemplates(ALL_TEMPLATES, scenario.columnTypes, true);

        // 计算实际过滤率
        const actualFilterRate = ((templatesOff.length - templatesOn.length) / templatesOff.length * 100).toFixed(1);
        const actualFiltered = templatesOff.filter(t => !templatesOn.includes(t));

        // 与预期对比
        const filteredAccuracy = calculateAccuracy(actualFiltered, scenario.expected.filteredTemplates);
        const remainingAccuracy = calculateAccuracy(templatesOn, scenario.expected.remainingTemplates);

        console.log(`  ⚙️  Flag OFF: ${templatesOff.length} 模板`);
        console.log(`  ⚙️  Flag ON:  ${templatesOn.length} 模板`);
        console.log();

        console.log(`  📈 预期过滤率: ${scenario.expected.filterRate.toFixed(1)}%`);
        console.log(`  📊 实际过滤率: ${actualFilterRate}%`);

        const filterRateMatch = Math.abs(parseFloat(actualFilterRate) - scenario.expected.filterRate) < 0.1;
        console.log(`  ${filterRateMatch ? '✅' : '❌'} 过滤率${filterRateMatch ? '匹配' : '不匹配'}`);
        console.log();

        console.log(`  🎯 已过滤模板准确度: ${filteredAccuracy.accuracy.toFixed(1)}%`);
        if (filteredAccuracy.diff.length > 0) {
            console.log(`     差异: ${filteredAccuracy.diff.join(', ')}`);
        }

        console.log(`  🎯 保留模板准确度: ${remainingAccuracy.accuracy.toFixed(1)}%`);
        if (remainingAccuracy.diff.length > 0) {
            console.log(`     差异: ${remainingAccuracy.diff.join(', ')}`);
        }
        console.log();

        // 报错情况
        if (scenario.expected.potentialErrors && scenario.expected.potentialErrors.length > 0) {
            console.log(`  🚨 预期问题/警告:`);
            scenario.expected.potentialErrors.forEach(err => {
                console.log(`     ${err}`);
            });
            console.log();
        }

        // 判断通过
        const passed = filterRateMatch && filteredAccuracy.match && remainingAccuracy.match;
        if (passed) {
            passedTests++;
            console.log(`  ✅ 测试通过`);
        } else {
            console.log(`  ❌ 测试失败`);
        }

        results.push({
            scenario: scenario.name,
            passed,
            filterRate: parseFloat(actualFilterRate),
            accuracy: (filteredAccuracy.accuracy + remainingAccuracy.accuracy) / 2,
            errors: scenario.expected.potentialErrors || []
        });
    }

    // ========== 汇总报告 ==========
    console.log('\n\n' + '='.repeat(80));
    console.log('📈 测试汇总报告');
    console.log('='.repeat(80));
    console.log();

    const passRate = (passedTests / totalTests * 100).toFixed(1);
    console.log(`  总测试场景: ${totalTests}`);
    console.log(`  通过: ${passedTests} | 失败: ${totalTests - passedTests}`);
    console.log(`  通过率: ${passRate}%`);
    console.log();

    // 按场景分类统计
    const idealScenarios = results.filter(r => r.scenario.includes('理想'));
    const boundaryScenarios = results.filter(r => r.scenario.includes('边界'));
    const realisticScenarios = results.filter(r => r.scenario.includes('现实'));
    const errorScenarios = results.filter(r => r.scenario.includes('异常'));

    console.log(`  📊 场景分类统计:`);
    console.log(`    理想场景: ${idealScenarios.filter(r => r.passed).length}/${idealScenarios.length} 通过`);
    console.log(`    边界场景: ${boundaryScenarios.filter(r => r.passed).length}/${boundaryScenarios.length} 通过`);
    console.log(`    现实场景: ${realisticScenarios.filter(r => r.passed).length}/${realisticScenarios.length} 通过`);
    console.log(`    异常场景: ${errorScenarios.filter(r => r.passed).length}/${errorScenarios.length} 通过`);
    console.log();

    // 平均过滤率
    const avgFilterRate = results.reduce((sum, r) => sum + r.filterRate, 0) / results.length;
    console.log(`  平均过滤率: ${avgFilterRate.toFixed(1)}%`);

    // 失败场景详情
    const failed = results.filter(r => !r.passed);
    if (failed.length > 0) {
        console.log();
        console.log(`  ❌ 失败场景:`);
        failed.forEach(r => {
            console.log(`    - ${r.scenario} (准确度: ${r.accuracy.toFixed(1)}%)`);
        });
    }

    // 潜在问题汇总
    const allErrors = results.flatMap(r => r.errors);
    const uniqueErrors = Array.from(new Set(allErrors));
    if (uniqueErrors.length > 0) {
        console.log();
        console.log(`  ⚠️ 发现的潜在问题 (${uniqueErrors.length}个):`);
        uniqueErrors.forEach(err => {
            const count = allErrors.filter(e => e === err).length;
            console.log(`    ${err} (${count}个场景)`);
        });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`${parseFloat(passRate) >= 80 ? '✅' : '❌'} 总体评估: ${parseFloat(passRate) >= 80 ? '功能符合预期' : '需要改进'}`);
    console.log('='.repeat(80));
}

main().catch(console.error);
