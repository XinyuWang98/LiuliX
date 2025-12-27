const axios = require('axios');

async function testOllama() {
    try {
        console.log('1. 连接 Ollama 服务...');
        await axios.get('http://localhost:11434');
        console.log('✅ Ollama 服务在线');

        console.log('2. 检查模型 qwen2.5-coder:3b...');
        const list = await axios.get('http://localhost:11434/api/tags');
        const hasModel = list.data.models.some(m => m.name.includes('qwen2.5-coder:3b'));

        if (hasModel) {
            console.log('✅ 模型已下载');

            console.log('3. 测试推理 (1+1=?)...');
            const res = await axios.post('http://localhost:11434/api/generate', {
                model: 'qwen2.5-coder:3b',
                prompt: '1+1=?',
                stream: false
            });
            console.log('✅ 推理成功:', res.data.response);
        } else {
            console.log('⚠️ 模型未找到，请运行: ollama pull qwen2.5-coder:3b');
        }

    } catch (e) {
        console.error('❌ 测试失败:', e.message);
        if (e.code === 'ECONNREFUSED') {
            console.log('💡 请确保 Ollama 已安装并运行');
        }
    }
}

testOllama();
