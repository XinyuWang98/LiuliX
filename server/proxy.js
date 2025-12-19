/**
 * DataPrism CORS 代理服务器
 * 用于解决前端调用 OpenAI/Gemini/DeepSeek API 的跨域问题
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

// 加载环境变量（优先.env.local，回退到.env）
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config(); // 回退到.env文件

const app = express();
const PORT = process.env.PROXY_PORT || 5000;

// 中间件配置
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // 修正为Vite默认端口
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// API提供商端点映射
const API_ENDPOINTS = {
    openai: 'https://api.openai.com',
    gemini: 'https://generativelanguage.googleapis.com',
    deepseek: 'https://api.deepseek.com'
};

/**
 * 通用代理路由
 * POST /api/proxy/:provider/*
 */
app.post('/api/proxy/:provider/*', async (req, res) => {
    const { provider } = req.params;
    const path = req.params[0]; // 捕获通配符部分

    // 验证提供商
    if (!API_ENDPOINTS[provider]) {
        return res.status(400).json({
            error: 'Invalid provider',
            supported: Object.keys(API_ENDPOINTS)
        });
    }

    const targetUrl = `${API_ENDPOINTS[provider]}/${path}`;

    try {
        console.log(`[Proxy] ${provider} → ${targetUrl}`);

        // 从请求头获取 API Key（由前端传递）或使用环境变量默认值
        let apiKey = req.headers['x-api-key'];

        // DeepSeek特殊处理：如果前端未提供Key，使用环境变量中的默认Key
        if (!apiKey && provider === 'deepseek') {
            apiKey = process.env.DEEPSEEK_API_KEY;
            if (!apiKey) {
                return res.status(500).json({
                    error: 'DeepSeek API Key not found',
                    message: 'DeepSeek API Key未配置在环境变量中，请检查.env.local文件'
                });
            }
            console.log('[Proxy] 使用环境变量中的DeepSeek API Key');
        }

        if (!apiKey) {
            return res.status(401).json({ error: 'Missing API key in x-api-key header' });
        }

        // 构建请求头
        const headers = {
            'Content-Type': 'application/json',
            ...getProviderHeaders(provider, apiKey)
        };

        // 转发请求
        const response = await axios({
            method: 'POST',
            url: targetUrl,
            headers,
            data: req.body,
            timeout: 60000 // 60秒超时
        });

        // 返回响应
        res.status(response.status).json(response.data);

    } catch (error) {
        console.error(`[Proxy Error] ${provider}:`, error.message);

        if (error.response) {
            // API 返回错误
            res.status(error.response.status).json({
                error: error.response.data,
                provider
            });
        } else if (error.code === 'ECONNABORTED') {
            // 超时
            res.status(504).json({
                error: 'Request timeout',
                message: '请求超时，请稍后重试'
            });
        } else {
            // 其他错误
            res.status(500).json({
                error: 'Proxy server error',
                message: error.message
            });
        }
    }
});

/**
 * 根据提供商生成对应的请求头
 */
function getProviderHeaders(provider, apiKey) {
    switch (provider) {
        case 'openai':
            return {
                'Authorization': `Bearer ${apiKey}`
            };
        case 'gemini':
            return {
                'x-goog-api-key': apiKey
            };
        case 'deepseek':
            return {
                'Authorization': `Bearer ${apiKey}`
            };
        default:
            return {};
    }
}

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        providers: Object.keys(API_ENDPOINTS)
    });
});

/**
 * 根路由
 */
app.get('/', (req, res) => {
    res.json({
        name: 'DataPrism CORS Proxy',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            proxy: 'POST /api/proxy/:provider/*'
        },
        supportedProviders: Object.keys(API_ENDPOINTS)
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 DataPrism Proxy Server running on http://localhost:${PORT}`);
    console.log(`📍 Supported providers: ${Object.keys(API_ENDPOINTS).join(', ')}`);
    console.log(`🔗 Frontend origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

    // 验证DeepSeek Key是否加载
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    if (deepseekKey) {
        console.log(`✅ DeepSeek API Key已加载: ${deepseekKey.substring(0, 10)}...`);
    } else {
        console.log(`⚠️  警告：DeepSeek API Key未找到，请检查.env.local文件`);
    }
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM signal received: closing HTTP server');
    process.exit(0);
});
