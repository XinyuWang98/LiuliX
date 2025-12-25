const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // Vercel injects envs automatically, but this doesn't hurt

const app = express();

// 读取环境变量（支持通道拆分）
const DEEPSEEK_CLEANING_KEY = process.env.DEEPSEEK_API_KEY_CLEANING || process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_INSIGHT_KEY = process.env.DEEPSEEK_API_KEY_INSIGHT || 'sk-33b37922d18d4783a4664b86022c5e5e';

// 启用 CORS
app.use(cors());

// 🔧 增加body size限制
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// 🆕 清洗建议专用通道
app.post('/api/proxy/deepseek-cleaning', async (req, res) => {
    const { data } = req.body;
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
            timeout: 30000
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

// 🆕 洞察建议专用通道
app.post('/api/proxy/deepseek-insight', async (req, res) => {
    const { data } = req.body;
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
            timeout: 120000
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

// 🆕 Skills模式专用通道
app.post('/api/proxy/deepseek-skills', async (req, res) => {
    const { data } = req.body;
    const clientKey = req.headers['x-api-key'];
    const finalKey = (clientKey && clientKey !== 'default') ? clientKey : DEEPSEEK_INSIGHT_KEY;

    try {
        console.log('[代理-Skills] 转发请求至 DeepSeek');
        const config = {
            method: 'POST',
            url: 'https://api.deepseek.com/v1/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalKey}`
            },
            data,
            timeout: 120000
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
    if (!targetUrl) return res.status(400).json({ error: 'Missing targetUrl' });

    try {
        console.log(`[代理] 转发请求至: ${targetUrl}`);
        let finalHeaders = { ...headers };
        if (headers['x-api-key'] === 'default' || headers['Authorization'] === 'Bearer default') {
            const envKey = process.env.DEEPSEEK_API_KEY;
            if (envKey) {
                if (headers['x-api-key'] === 'default') finalHeaders['x-api-key'] = envKey;
                if (headers['Authorization'] === 'Bearer default') finalHeaders['Authorization'] = `Bearer ${envKey}`;
            }
        }

        const config = {
            method,
            url: targetUrl,
            headers: {
                ...finalHeaders,
                host: undefined,
                origin: undefined,
                referer: undefined
            },
            data,
            timeout: 120000
        };
        const response = await axios(config);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('[代理错误]', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// 导出 app 供 Vercel 使用
module.exports = app;
