/**
 * WebLLM模型缓存诊断工具
 * 自动在页面加载时检查并输出到Console
 */

export async function diagnoseWebLLMCache() {
    console.log('=== 🔍 WebLLM模型缓存诊断 ===');

    try {
        // 1. 检查本地模型开关
        const useLocalModel = localStorage.getItem('use_local_model');
        console.log('1️⃣ 本地模型开关:', useLocalModel || '未设置');

        if (!useLocalModel) {
            console.warn('⚠️ 建议设置: localStorage.setItem("use_local_model", "true")');
        }

        // 2. 列出所有IndexedDB数据库
        const databases = await indexedDB.databases();
        console.log('2️⃣ IndexedDB数据库列表:', databases);

        const webllmDB = databases.find(db =>
            db.name?.toLowerCase().includes('webllm') ||
            db.name?.toLowerCase().includes('model') ||
            db.name?.toLowerCase().includes('mlc')
        );

        if (webllmDB) {
            console.log('✅ 找到WebLLM数据库:', webllmDB.name, '版本:', webllmDB.version);
        } else {
            console.log('❌ 未找到WebLLM相关数据库');
            console.log('💡 这可能是首次使用，需要下载约2.5GB模型文件');
        }

        // 3. 检查浏览器存储使用情况
        const estimate = await navigator.storage.estimate();
        const usageMB = (estimate.usage! / 1024 / 1024).toFixed(0);
        const quotaGB = (estimate.quota! / 1024 / 1024 / 1024).toFixed(1);
        const usagePercent = ((estimate.usage! / estimate.quota!) * 100).toFixed(1);

        console.log('3️⃣ 浏览器存储使用:', {
            已使用: `${usageMB} MB`,
            总配额: `${quotaGB} GB`,
            使用率: `${usagePercent}%`
        });

        // 4. 检查模型配置
        console.log('4️⃣ 当前模型配置:', 'Qwen2.5-7B-Instruct-q4f16_1-MLC');

        // 5. 给出建议
        console.log('\n📋 诊断结果:');
        if (!webllmDB && parseInt(usageMB) < 100) {
            console.log('❌ 模型未缓存，需要首次下载（约2.5GB）');
            console.log('💡 建议:');
            console.log('   1. 确保网络通畅（或开启代理）');
            console.log('   2. 触发AI功能时会自动下载');
            console.log('   3. 下载完成后会永久缓存');
        } else if (webllmDB) {
            console.log('✅ 模型已缓存，应该可以离线使用');
            console.log('💡 如果仍然下载，可能是：');
            console.log('   1. 浏览器缓存损坏，需要清理重新下载');
            console.log('   2. IndexedDB权限问题');
        } else {
            console.log('⚠️ 有存储占用但未找到WebLLM数据库');
            console.log('💡 可能需要清理浏览器缓存后重新下载');
        }

        console.log('\n=== 诊断完成 ===\n');

    } catch (error) {
        console.error('❌ 诊断过程出错:', error);
    }
}
