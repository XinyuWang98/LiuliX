/**
 * Skills 手动测试脚本
 * 
 * 使用方法：
 * 1. 打开浏览器 http://localhost:5173/
 * 2. 打开 F12 Console
 * 3. 复制下面的代码到 Console 执行
 */

console.log('='.repeat(60));
console.log('🚀 Skills 架构测试开始');
console.log('='.repeat(60));

// ============================================================
// Test 1: Skills Registry
// ============================================================
async function test1_registry() {
    console.log('\n📋 Test 1: Skills Registry');
    console.log('-'.repeat(40));

    try {
        const { skillRegistry } = await import('/src/services/skills/registry.ts');

        const allSkills = skillRegistry.getAllEnabled();
        console.log(`✅ 成功加载 ${allSkills.length} 个 Skills`);
        console.log('Skills 列表:', allSkills.map(s => s.name));

        // 测试 OpenAI Tools 格式
        const tools = skillRegistry.toOpenAITools();
        console.log(`✅ OpenAI Tools 格式生成成功 (${tools.length} 个工具)`);
        console.log('第一个工具示例:', JSON.stringify(tools[0], null, 2));

        // 测试 Prompt Shim 格式
        const shim = skillRegistry.toPromptShim();
        console.log(`✅ Prompt Shim 格式生成成功 (${shim.length} 字符)`);
        console.log('Shim 预览 (前 300 字符):\n', shim.substring(0, 300) + '...');

        return { success: true, skillCount: allSkills.length };
    } catch (error) {
        console.error('❌ Test 1 失败:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// Test 2: Dispatcher (需要已上传的 CSV 文件)
// ============================================================
async function test2_dispatcher() {
    console.log('\n🔧 Test 2: Dispatcher');
    console.log('-'.repeat(40));

    try {
        const { skillsDispatcher } = await import('/src/services/skills/dispatcher.ts');

        // 尝试从 localStorage 或 IndexedDB 获取已上传的表名
        // 这里需要用户手动提供表名
        console.log('⚠️  请先上传一个 CSV 文件，然后运行:');
        console.log('   skillsDispatcher.setCurrentTable("你的表名");');
        console.log('   例如: skillsDispatcher.setCurrentTable("t_1734794567890_working");');
        console.log('\n然后执行测试:');
        console.log(`   await skillsDispatcher.execute('viz_create_chart', {
     type: 'bar',
     x: '你的列名1',
     y: '你的列名2',
     agg: 'sum'
   });`);

        // 暴露 dispatcher 到全局方便测试
        window.skillsDispatcher = skillsDispatcher;
        console.log('✅ Dispatcher 已暴露到 window.skillsDispatcher');

        return { success: true, message: '等待手动测试' };
    } catch (error) {
        console.error('❌ Test 2 失败:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// Test 3: LLM Adapter
// ============================================================
async function test3_llmAdapter() {
    console.log('\n🤖 Test 3: LLM Adapter');
    console.log('-'.repeat(40));

    try {
        const { llmAdapter } = await import('/src/services/ai/llmAdapter.ts');

        // 检查 DeepSeek API Key
        const apiKey = localStorage.getItem('deepseek_advanced_key');
        if (!apiKey) {
            console.warn('⚠️  未找到 DeepSeek API Key');
            console.log('设置方法: localStorage.setItem("deepseek_advanced_key", "sk-xxx...")');
        } else {
            console.log(`✅ DeepSeek API Key 已设置 (${apiKey.substring(0, 10)}...)`);
        }

        // 暴露 adapter 到全局
        window.llmAdapter = llmAdapter;
        console.log('✅ LLM Adapter 已暴露到 window.llmAdapter');

        console.log('\n手动测试 DeepSeek:');
        console.log(`   const result = await window.llmAdapter.call(
     '帮我统计各类别的销售额，画个柱状图',
     'deepseek',
     localStorage.getItem('deepseek_advanced_key')
   );
   console.log('LLM 响应:', result);`);

        return { success: true, hasApiKey: !!apiKey };
    } catch (error) {
        console.error('❌ Test 3 失败:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// 执行所有测试
// ============================================================
async function runAllTests() {
    const results = {
        test1: await test1_registry(),
        test2: await test2_dispatcher(),
        test3: await test3_llmAdapter()
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(60));
    console.log('Test 1 (Registry):', results.test1.success ? '✅ 通过' : '❌ 失败');
    console.log('Test 2 (Dispatcher):', results.test2.success ? '⏳ 待手动测试' : '❌ 失败');
    console.log('Test 3 (LLM Adapter):', results.test3.success ? '⏳ 待手动测试' : '❌ 失败');

    if (results.test1.success) {
        console.log(`\n✨ Skills 基础设施已就绪！共 ${results.test1.skillCount} 个 Skills 可用。`);
    }

    console.log('\n💡 提示: 现在可以测试完整的 Skills 调用流程');
    console.log('   1. 上传一个 CSV 文件');
    console.log('   2. 使用 window.skillsDispatcher.setCurrentTable("表名")');
    console.log('   3. 调用 await window.skillsDispatcher.execute(...)');
    console.log('='.repeat(60));

    return results;
}

// 自动执行
runAllTests().then(results => {
    console.log('\n🎉 测试完成！检查上方输出了解详情。');
});
