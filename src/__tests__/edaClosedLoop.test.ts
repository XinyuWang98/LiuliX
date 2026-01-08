/**
 * EDA 闭环单元测试
 * 
 * 测试模块：
 * 1. InsightExtractor - 洞察提取
 * 2. ContextInjector - Prompt 注入
 * 3. AnalysisContext 类型验证
 * 
 * 运行方式: npx tsx src/__tests__/edaClosedLoop.test.ts
 */

// ========== Mock localStorage ==========
const mockLocalStorage: Record<string, string> = {};
(global as any).localStorage = {
    getItem: (key: string) => mockLocalStorage[key] || null,
    setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
    removeItem: (key: string) => { delete mockLocalStorage[key]; },
    clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }
};

// ========== 导入测试模块 ==========
import { extractAdoptedInsight } from '../utils/insightExtractor';
import { injectContextToPrompt, buildChainedContext } from '../services/prompts/contextInjector';
import type { AdoptedInsight } from '../contexts/AnalysisContext';

// ========== 测试数据 ==========
const mockInsightNode = {
    id: 'test-node-001',
    title: '数据缺失分析',
    depth: 0,
    columnsUsed: ['age', 'income'],
    result: {
        summary: '发现 age 列存在 15% 缺失值'
    },
    params: {
        threshold: 0.1,
        column_name: 'age'
    },
    metadata: {}
};

const mockL1InsightNode = {
    id: 'test-node-002',
    title: '收入分布分析',
    conclusion: '收入呈右偏分布，存在异常值',
    depth: 1,
    columnsUsed: ['income'],
    code: 'import pandas as pd\ndf.income.hist()',
    params: {},
    metadata: { parentNodeId: 'test-node-001' }
};

// ========== 测试用例 ==========
let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passCount++;
    } catch (error: any) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        failCount++;
    }
}

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(message);
    }
}

// ========== Test Suite: InsightExtractor ==========
console.log('\n📋 测试 InsightExtractor\n');

test('extractAdoptedInsight - L0 节点提取', () => {
    const result = extractAdoptedInsight(mockInsightNode);

    assert(result.id === 'adopted_test-node-001', 'ID 格式正确');
    assert(result.depth === 0, 'depth 为 0');
    assert(result.type === 'data_quality', '类型推断为 data_quality');
    assert(result.description.includes('缺失'), 'description 包含关键词');
    assert(result.structuredData?.column === 'age', '列名提取正确');
    assert(result.timestamp > 0, 'timestamp 存在');
});

test('extractAdoptedInsight - L1 节点提取', () => {
    const result = extractAdoptedInsight(mockL1InsightNode);

    assert(result.id === 'adopted_test-node-002', 'ID 格式正确');
    assert(result.depth === 1, 'depth 为 1');
    assert(result.type === 'distribution', '类型推断为 distribution');
    assert(result.description.includes('分布') || result.description.includes('偏'), 'description 包含关键词');
});

test('extractAdoptedInsight - 隐私模式', () => {
    mockLocalStorage['privacy_mode'] = 'sanitized';

    const result = extractAdoptedInsight(mockInsightNode);

    assert(result.structuredData?.column === 'age', '隐私模式保留列名');
    assert(result.structuredData?.values === undefined, '隐私模式不包含 values');

    // 清理
    delete mockLocalStorage['privacy_mode'];
});

// ========== Test Suite: ContextInjector ==========
console.log('\n📋 测试 ContextInjector\n');

const mockAdoptedInsights: AdoptedInsight[] = [
    {
        id: 'adopted_001',
        depth: 0,
        type: 'data_quality',
        description: 'age 列存在 15% 缺失值',
        structuredData: { column: 'age', issues: ['missing_values'] },
        timestamp: Date.now()
    },
    {
        id: 'adopted_002',
        depth: 1,
        parentId: 'adopted_001',
        type: 'distribution',
        description: '收入呈右偏分布',
        structuredData: { column: 'income' },
        timestamp: Date.now()
    }
];

test('injectContextToPrompt - 空 context 不修改 prompt', () => {
    const basePrompt = '## Task\nAnalyze the data.';
    const result = injectContextToPrompt(basePrompt, []);

    assert(result === basePrompt, 'Prompt 未被修改');
});

test('injectContextToPrompt - 注入 context 到 Task 前', () => {
    const basePrompt = '# Data Analysis\n\n## Task\nAnalyze the data.';
    const result = injectContextToPrompt(basePrompt, mockAdoptedInsights);

    assert(result.includes('Previous Insights'), '包含 Previous Insights 标题');
    assert(result.includes('age 列存在 15% 缺失值'), '包含第一个洞察描述');
    assert(result.includes('Column: `age`'), '包含列名格式');
    assert(result.indexOf('Previous Insights') < result.indexOf('## Task'), 'Context 在 Task 之前');
});

test('injectContextToPrompt - 按 depth 排序', () => {
    const basePrompt = '## Task\nAnalyze.';
    const result = injectContextToPrompt(basePrompt, [
        { id: '2', depth: 1, type: 'distribution', description: 'B', timestamp: 1 },
        { id: '1', depth: 0, type: 'data_quality', description: 'A', timestamp: 2 }
    ]);

    const indexA = result.indexOf('A');
    const indexB = result.indexOf('B');
    assert(indexA < indexB, 'depth=0 的洞察在 depth=1 之前');
});

test('buildChainedContext - 构建链式 context', () => {
    const result = buildChainedContext(mockAdoptedInsights);

    assert(result.includes('Analysis Chain'), '包含 Analysis Chain 标题');
    assert(result.includes('Initial Finding'), '包含 Initial Finding');
    assert(result.includes('Follow-up'), '包含 Follow-up');
    assert(result.includes('Level 0'), '包含 Level 0');
    assert(result.includes('Level 1'), '包含 Level 1');
});

// ========== Test Suite: Type Validation ==========
console.log('\n📋 测试类型验证\n');

test('AdoptedInsight - 必填字段验证', () => {
    const insight: AdoptedInsight = {
        id: 'test',
        depth: 0,
        type: 'other',
        description: 'Test description',
        timestamp: Date.now()
    };

    assert(insight.id !== undefined, 'id 必填');
    assert(insight.depth !== undefined, 'depth 必填');
    assert(insight.type !== undefined, 'type 必填');
    assert(insight.description !== undefined, 'description 必填');
    assert(insight.timestamp !== undefined, 'timestamp 必填');
});

test('AdoptedInsight - 可选字段验证', () => {
    const insight: AdoptedInsight = {
        id: 'test',
        depth: 1,
        parentId: 'parent-001',
        type: 'correlation',
        description: 'Test',
        structuredData: {
            column: 'x',
            issues: ['outliers'],
            values: { mean: 10 }
        },
        timestamp: Date.now()
    };

    assert(insight.parentId === 'parent-001', 'parentId 可选');
    assert(insight.structuredData?.column === 'x', 'structuredData.column 可选');
    assert(insight.structuredData?.issues?.[0] === 'outliers', 'structuredData.issues 可选');
    assert((insight.structuredData?.values as any)?.mean === 10, 'structuredData.values 可选');
});

// ========== 测试结果汇总 ==========
console.log('\n' + '='.repeat(50));
console.log(`📊 测试结果: ${passCount} 通过, ${failCount} 失败`);
console.log('='.repeat(50));

if (failCount > 0) {
    process.exit(1);
}
