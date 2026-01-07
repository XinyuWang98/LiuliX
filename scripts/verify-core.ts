/**
 * Core Simulator (verify-core.ts)
 * 核心链路验证脚本 - 无需浏览器即可验证核心业务逻辑
 */

import crypto from 'crypto';

// ------------------------------------------------------------------
// 0. Polyfill 环境准备 (Mock Browser APIs)
// ------------------------------------------------------------------
// 必须在任何业务 import 之前运行
// @ts-ignore
global.window = global;
// @ts-ignore
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { },
    length: 0,
    key: () => null
};

if (typeof global.crypto === 'undefined') {
    // @ts-ignore
    global.crypto = crypto;
}

// Mock Vite env
// @ts-ignore
if (typeof import.meta === 'undefined') {
    // @ts-ignore
    global.import.meta = { env: { DEV: true, MODE: 'development' } };
} else {
    // @ts-ignore
    if (!import.meta.env) {
        // @ts-ignore
        import.meta.env = { DEV: true, MODE: 'development' };
    }
}

console.log('🔧 Environment mocks initialized.');

// ------------------------------------------------------------------
// 1. 动态导入业务模块 
// (使用 Dynamic Import 确保 Mocks 先生效，解决 Hoisting 问题)
// ------------------------------------------------------------------

(async () => {
    console.log('\n🚀 Starting Core Verification...\n');

    try {
        // Import mocks
        const { promptRegistry } = await import('./mocks/promptRegistry');

        // Import business logic (now safe to import as mocks are ready)
        // using require-like syntax or await import via alias
        const { parseBatchInsightsResponse } = await import('@/services/prompts/library/insight/parser');

        // ------------------------------------------------------------------
        // 2. 验证模块：Prompt Registry
        // ------------------------------------------------------------------
        console.log('📦 [Module] Prompt Registry');

        promptRegistry.register({
            id: 'test-prompt-1',
            title: 'Test Prompt',
            description: 'A test prompt for verification',
            content: 'Analyze this data: ${columns}',
            layer: 'L1_DATA_CLEANING',
            dimensions: [],
            isBuiltIn: true
        });

        const prompt = promptRegistry.getPrompt('test-prompt-1');
        if (!prompt) throw new Error('Failed to retrieve registered prompt');
        if (prompt.title !== 'Test Prompt') throw new Error('Prompt data mismatch');
        console.log('✅ Prompt Registration & Retrieval passed');

        // ------------------------------------------------------------------
        // 3. 验证模块：AI Response Parsing
        // ------------------------------------------------------------------
        console.log('🧠 [Module] AI Response Parser');

        // 3.1 测试正常的 AI 响应
        const validJSON = `
        \`\`\`json
        [
            {
                "title": "Age Distribution",
                "description": "Visualize age distribution",
                "columns_used": ["age"],
                "full_mode": { "code": "plt.hist(df['age'])" },
                "aggregated_mode": { "sql": "SELECT age, count(*) ...", "viz_code": "..." }
            }
        ]
        \`\`\`
        `;
        const result = parseBatchInsightsResponse(validJSON);

        if (result.length !== 1) throw new Error(`Expected 1 insight, got ${result.length}`);
        if (result[0].title !== 'Age Distribution') throw new Error('Parsing content mismatch');
        console.log('✅ Valid JSON Parsing passed');

        console.log('\n🎉 All Core Systems Verified! (Ready for Browser Testing)');

    } catch (e: any) {
        console.error('\n❌ Verification Failed:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
