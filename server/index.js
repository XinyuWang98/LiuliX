const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3001;

// 读取环境变量（支持通道拆分）
const DEEPSEEK_CLEANING_KEY = process.env.DEEPSEEK_API_KEY_CLEANING || process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_INSIGHT_KEY = process.env.DEEPSEEK_API_KEY_INSIGHT || 'sk-33b37922d18d4783a4664b86022c5e5e';

// 调试：检查环境变量是否加载（脱敏输出）
if (DEEPSEEK_CLEANING_KEY) {
    console.log('✅ 清洗建议 API Key:', DEEPSEEK_CLEANING_KEY.substring(0, 10) + '...');
} else {
    console.log('❌ 警告: DEEPSEEK_API_KEY_CLEANING 环境变量未设置');
}
if (DEEPSEEK_INSIGHT_KEY) {
    console.log('✅ 洞察建议 API Key:', DEEPSEEK_INSIGHT_KEY.substring(0, 10) + '...');
}

// 启用 CORS，允许前端请求
app.use(cors());

// 🔧 增加body size限制以支持大数据集洞察生成（从1mb增加到10mb）
app.use(express.json({ limit: '10mb' }));  // 增加JSON body限制
app.use(express.urlencoded({ limit: '10mb', extended: true }));  // 增加URL-encoded限制

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 🆕 清洗建议专用通道（快速响应）
app.post('/api/proxy/deepseek-cleaning', async (req, res) => {
    const { data } = req.body;
    // 优先使用客户端Key
    const clientKey = req.headers['x-api-key'];
    const finalKey = (clientKey && clientKey !== 'default') ? clientKey : DEEPSEEK_CLEANING_KEY;

    try {
        console.log('[代理-清洗] 转发请求至 DeepSeek');

        const config = {
            method: 'POST',
            url: 'https://api.deepseek.com/v1/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalKey}`
            },
            data,
            timeout: 30000 // 清洗：30秒超时
        };

        const response = await axios(config);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('[代理-清洗错误]', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: error.message, channel: 'cleaning' });
        }
    }
});

// 🆕 洞察建议专用通道（深度分析）
app.post('/api/proxy/deepseek-insight', async (req, res) => {
    const { data } = req.body;
    // 优先使用客户端Key
    const clientKey = req.headers['x-api-key'];
    const finalKey = (clientKey && clientKey !== 'default') ? clientKey : DEEPSEEK_INSIGHT_KEY;

    try {
        console.log('[代理-洞察] 转发请求至 DeepSeek');

        const config = {
            method: 'POST',
            url: 'https://api.deepseek.com/v1/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalKey}`
            },
            data,
            timeout: 120000 // 洞察：120秒超时
        };

        const response = await axios(config);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('[代理-洞察错误]', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: error.message, channel: 'insight' });
        }
    }
});

// 🆕 Skills模式专用通道（Function Calling）
app.post('/api/proxy/deepseek-skills', async (req, res) => {
    const { data } = req.body;
    // 优先使用客户端Key
    const clientKey = req.headers['x-api-key'];
    const finalKey = (clientKey && clientKey !== 'default') ? clientKey : DEEPSEEK_INSIGHT_KEY;

    try {
        console.log('[代理-Skills] 转发请求至 DeepSeek (Function Calling)');

        const config = {
            method: 'POST',
            url: 'https://api.deepseek.com/v1/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalKey}`
            },
            data,
            timeout: 120000 // Skills：120秒超时
        };

        const response = await axios(config);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('[代理-Skills错误]', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: error.message, channel: 'skills' });
        }
    }
});

// 通用代理接口
app.post('/api/proxy', async (req, res) => {
    const { targetUrl, method = 'POST', headers = {}, data } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing targetUrl in request body' });
    }

    try {
        console.log(`[代理] 转发请求至: ${targetUrl}`);

        // 🚀 处理环境变量 API Key（当前端传递 'default' 时）
        let finalHeaders = { ...headers };
        if (headers['x-api-key'] === 'default' || headers['Authorization'] === 'Bearer default') {
            console.log('[代理] 使用环境变量中的 DeepSeek API Key');
            const envKey = process.env.DEEPSEEK_API_KEY;
            if (envKey) {
                if (headers['x-api-key'] === 'default') {
                    finalHeaders['x-api-key'] = envKey;
                }
                if (headers['Authorization'] === 'Bearer default') {
                    finalHeaders['Authorization'] = `Bearer ${envKey}`;
                }
            } else {
                console.warn('[代理警告] 环境变量 DEEPSEEK_API_KEY 未设置');
            }
        }

        // 构建转发请求配置
        const config = {
            method,
            url: targetUrl,
            headers: {
                ...finalHeaders,
                // 确保移除主机相关的头，防止目标服务器拒绝
                host: undefined,
                origin: undefined,
                referer: undefined
            },
            data,
            timeout: 120000 // 后端也同步增加到120秒
        };

        const response = await axios(config);
        res.status(response.status).json(response.data);

    } catch (error) {
        console.error('[代理错误]', error.message);
        if (error.response) {
            // 目标服务器返回的错误
            console.error('[代理错误详情]', error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            // 代理服务器自身的错误（如网络不通）
            res.status(500).json({ error: error.message });
        }
    }
});

app.listen(port, () => {
    console.log(`\n🚀 后端代理服务器运行于 http://localhost:${port}`);
    console.log(`   - 健康检查: http://localhost:${port}/health`);
    console.log(`   - 代理端点: http://localhost:${port}/api/proxy\n`);
});
