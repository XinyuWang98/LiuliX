import path from 'path';
import { fileURLToPath } from 'url';
// 尝试从根目录加载 .env.local (假设 CWD 是根目录)
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('正在加载环境变量:', envPath);
import dotenv from 'dotenv';
dotenv.config({ path: envPath });
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3001;

// 读取环境变量（支持通道拆分）
const DEEPSEEK_CLEANING_KEY = process.env.DEEPSEEK_API_KEY_CLEANING || process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_INSIGHT_KEY = process.env.DEEPSEEK_API_KEY_INSIGHT || process.env.DEEPSEEK_API_KEY;

// 免费试用配置（测试阶段默认关闭）
const ENABLE_FREE_TRIAL_LIMIT = process.env.ENABLE_FREE_TRIAL_LIMIT === 'true';
const FREE_TRIAL_CLEANING_LIMIT = parseInt(process.env.FREE_TRIAL_CLEANING_LIMIT) || 5;
const FREE_TRIAL_INSIGHT_LIMIT = parseInt(process.env.FREE_TRIAL_INSIGHT_LIMIT) || 5;
const INVITE_CODE_TOTAL_LIMIT = parseInt(process.env.INVITE_CODE_TOTAL_LIMIT) || 20;

// 邀请码白名单
const validInviteCodes = new Set(
    (process.env.VALID_INVITE_CODES || '').split(',').map(c => c.trim().toUpperCase()).filter(c => c)
);

// 用户使用计数器（内存存储，重启重置）
const userUsageCounter = new Map();

// 调试：检查环境变量是否加载（脱敏输出）
if (DEEPSEEK_CLEANING_KEY) {
    console.log('✅ 清洗建议 API Key:', DEEPSEEK_CLEANING_KEY.substring(0, 10) + '...');
} else {
    console.error('❌ 严重警告: DEEPSEEK_API_KEY_CLEANING 环境变量未设置！');
}
console.log('🎁 免费试用限制:', ENABLE_FREE_TRIAL_LIMIT ? '启用' : '关闭（测试模式）');
if (validInviteCodes.size > 0) {
    console.log('🔑 邀请码数量:', validInviteCodes.size);
}

// CORS 配置（支持环境变量白名单）
const allowedOrigins = [
    'http://localhost:5173',  // Vite 开发服务器
    'http://localhost:4173',  // 🆕 Vite 生产预览服务器
    'https://liulix.vercel.app',
    'https://dataprism.vercel.app',
    'https://liulix.com',
    'https://www.liulix.com'
];

app.use(cors({
    origin: (origin, callback) => {
        // 允许无 origin 的请求（如 Postman、curl）
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] 拒绝来自 ${origin} 的请求`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🆕 Vercel 兼容性路由重构
const apiRouter = express.Router();

/**
 * 免费试用计数器中间件
 * @param {string} type -类型 'cleaning' | 'insight'
 */
function checkFreeTrialLimit(type) {
    return (req, res, next) => {
        // 测试阶段跳过限制
        if (!ENABLE_FREE_TRIAL_LIMIT) return next();

        const userId = req.headers['x-user-id'] || 'anonymous';
        const clientKey = req.headers['x-api-key'];
        const inviteCode = req.headers['x-invite-code'];

        // 用户有自己的Key，不限制
        if (clientKey && clientKey !== 'default') return next();

        // 获取或初始化用户使用记录
        let usage = userUsageCounter.get(userId);
        const upperInviteCode = inviteCode ? inviteCode.toUpperCase().trim() : '';

        // 验证函数 (复用逻辑)
        const isCodeValid = (code) => {
            if (!code) return false;
            // 1. 静态白名单
            if (validInviteCodes.has(code)) return true;
            // 2. 动态日期码 (新增 VIP/SPONSOR 前缀)
            const DYNAMIC_PREFIXES = ['REDDIT', 'LIULI', 'PH', 'VIP', 'SPONSOR'];
            const now = new Date();
            // 使用 US Pacific Time (America/Los_Angeles)
            const formatter = new Intl.DateTimeFormat('en-CA', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                timeZone: 'America/Los_Angeles'
            });
            const [yyyy, mm, dd] = formatter.format(now).split('-');
            const todaySuffix = `${yyyy}${mm}${dd}`;
            return DYNAMIC_PREFIXES.some(prefix => code === `${prefix}${todaySuffix}`);
        };

        // 场景 A: 首次访问 (内存中无记录)
        if (!usage) {
            if (isCodeValid(upperInviteCode)) {
                // 有效邀请码 -> 初始化 invite类型
                usage = { type: 'invite', inviteCode: upperInviteCode, total: 0 };
                console.log(`[计数] 新邀请码用户: ${userId}, 码: ${upperInviteCode}`);
            } else {
                // 无码或无效码 -> 初始化 free类型
                usage = { type: 'free', cleaning: 0, insight: 0 };
                console.log(`[计数] 新免费用户: ${userId}`);
            }
            userUsageCounter.set(userId, usage);
        }
        // 场景 B: 已有记录，但用户提供了新的有效邀请码 (如第二天的码) -> 重置额度
        else if (upperInviteCode && usage.inviteCode !== upperInviteCode && isCodeValid(upperInviteCode)) {
            console.log(`[计数] 用户 ${userId} 更新邀请码: ${usage.inviteCode} -> ${upperInviteCode}. 重置额度.`);
            usage = { type: 'invite', inviteCode: upperInviteCode, total: 0 };
            userUsageCounter.set(userId, usage);
        }

        // 检查额度
        if (usage.type === 'invite') {
            // 邀请码用户：检查总次数
            if (usage.total >= INVITE_CODE_TOTAL_LIMIT) {
                return res.status(429).json({
                    error: '邀请码额度已用完',
                    message: '今日额度已用完，请明天获取新邀请码',
                    usage: usage.total,
                    limit: INVITE_CODE_TOTAL_LIMIT,
                    userType: 'invite'
                });
            }
            usage.total++;
        } else {
            // 免费用户：分别检查清洗和洞察次数
            const limit = type === 'cleaning' ? FREE_TRIAL_CLEANING_LIMIT : FREE_TRIAL_INSIGHT_LIMIT;

            if (usage[type] >= limit) {
                return res.status(429).json({
                    error: `免费${type === 'cleaning' ? '清洗' : '洞察'}次数已用完`,
                    message: '请输入邀请码或配置 API Key 以继续使用',
                    usage: usage[type],
                    limit,
                    userType: 'free',
                    totalUsage: { cleaning: usage.cleaning, insight: usage.insight }
                });
            }
            usage[type]++;
            // 同步增加总计数 (用于邀请码用户显示)
            if (typeof usage.total === 'number') {
                usage.total++;
            }
        }

        userUsageCounter.set(userId, usage);

        // 调试日志
        console.log(`[计数] 用户: ${userId}, 类型: ${usage.type}, Code: ${upperInviteCode || 'None'}, Total: ${usage.total}, Cleaning: ${usage.cleaning}, Insight: ${usage.insight}`);

        // 确保 total 字段总是存在 (增强前端兼容性)
        if (usage.type === 'free' || usage.total === undefined) {
            usage.total = (usage.cleaning || 0) + (usage.insight || 0);
        }

        // 在响应中返回使用情况
        res.locals.usage = usage;
        next();
    };
}

// 🆕 Feature Flags 配置路由（2026-01-08 新增）
import { registerConfigRoutes } from './configRoutes.js';
registerConfigRoutes(apiRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 辅助函数：注入使用情况头
function injectUsageHeader(res) {
    if (res.locals && res.locals.usage) {
        res.setHeader('X-Liuli-Usage', JSON.stringify(res.locals.usage));
        // 暴露自定义头给前端（CORS）
        res.setHeader('Access-Control-Expose-Headers', 'X-Liuli-Usage');
    }
}

// 🆕 清洗建议专用通道（快速响应）
apiRouter.post('/proxy/deepseek-cleaning', checkFreeTrialLimit('cleaning'), async (req, res) => {
    const { data } = req.body;
    const clientKey = req.headers['x-api-key'];
    // 逻辑：如果客户端传了真实Key则用客户端的，否则用服务端的。排除 'default'。
    const finalKey = (clientKey && clientKey !== 'default') ? clientKey : DEEPSEEK_CLEANING_KEY;

    if (!finalKey) {
        console.error('[代理-清洗] ❌ 失败: 未配置 API Key');
        return res.status(500).json({
            error: 'Server Misconfiguration: No DeepSeek API Key found. Please check .env.local on server.',
            channel: 'cleaning'
        });
    }

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
            timeout: 60000 // 清洗：60秒超时（增加以适应DeepSeek响应时间）
        };

        const response = await axios(config);
        injectUsageHeader(res); // 注入使用情况头
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('[代理-清洗错误]', error.message);
        injectUsageHeader(res); // 即使出错也尝试返回使用情况
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: error.message, channel: 'cleaning' });
        }
    }
});

// 🆕 洞察建议专用通道（深度分析）
apiRouter.post('/proxy/deepseek-insight', checkFreeTrialLimit('insight'), async (req, res) => {
    const { data } = req.body;
    // 优先使用客户端Key
    const clientKey = req.headers['x-api-key'];
    const finalKey = (clientKey && clientKey !== 'default') ? clientKey : DEEPSEEK_INSIGHT_KEY;

    if (!finalKey) {
        console.error('[代理-洞察] ❌ 失败: 未配置 API Key');
        return res.status(500).json({
            error: 'Server Misconfiguration: No DeepSeek API Key found.',
            channel: 'insight'
        });
    }

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
        injectUsageHeader(res); // 注入使用情况头
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('[代理-洞察错误]', error.message);
        injectUsageHeader(res); // 即使出错也尝试返回使用情况
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: error.message, channel: 'insight' });
        }
    }
});

// 🆕 Skills模式专用通道（Function Calling）
apiRouter.post('/proxy/deepseek-skills', async (req, res) => {
    const { data } = req.body;
    // 优先使用客户端Key
    const clientKey = req.headers['x-api-key'];
    const finalKey = (clientKey && clientKey !== 'default') ? clientKey : DEEPSEEK_INSIGHT_KEY;

    if (!finalKey) {
        console.error('[代理-Skills] ❌ 失败: 未配置 API Key');
        return res.status(500).json({
            error: 'Server Misconfiguration: No DeepSeek API Key found.',
            channel: 'skills'
        });
    }

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
apiRouter.post('/proxy', async (req, res) => {
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

// 🆕 本地模型服务 API
import modelService from './modelService.js';

// 模型加载
apiRouter.post('/model/load', async (req, res) => {
    try {
        const { modelId } = req.body;
        const result = await modelService.loadModel(modelId);
        res.json(result);
    } catch (error) {
        console.error('[API-Model] 加载失败:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 文本生成（应用免费试用限制）
apiRouter.post('/model/generate', async (req, res) => {
    try {
        const { prompt, maxTokens, temperature, type = 'insight' } = req.body;

        // 动态应用计数中间件
        const middleware = checkFreeTrialLimit(type);
        await new Promise((resolve, reject) => {
            middleware(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const result = await modelService.generate(prompt, { maxTokens, temperature });
        injectUsageHeader(res); // 注入使用情况头
        res.json(result);
    } catch (error) {
        console.error('[API-Model] 生成失败:', error.message);
        injectUsageHeader(res); // 即使出错也尝试返回使用情况
        res.status(500).json({ error: error.message });
    }
});

// 模型状态查询
apiRouter.get('/model/status', (req, res) => {
    const status = modelService.getStatus();
    res.json(status);
});

// 🆕 获取已安装的 Ollama 模型列表
apiRouter.get('/model/list', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:11434/api/tags');
        const models = response.data.models || [];
        // 返回简化的模型信息
        const simplifiedModels = models.map(m => ({
            name: m.name,
            size: m.size,
            modifiedAt: m.modified_at
        }));
        res.json({
            available: true,
            models: simplifiedModels,
            currentModel: modelService.getStatus().currentModel
        });
    } catch (error) {
        // Ollama 未运行或未安装
        res.json({
            available: false,
            models: [],
            error: 'Ollama 服务未运行。请安装并启动 Ollama。'
        });
    }
});

// 🆕 邀请码验证接口
apiRouter.post('/validate-invite-code', (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: '请输入邀请码' });
    }

    const upperCode = code.toUpperCase().trim();

    // Debug: 打印验证详情
    console.log(`[验证] 收到: "${upperCode}", 白名单:`, Array.from(validInviteCodes));

    // 1. 检查静态白名单
    if (validInviteCodes.has(upperCode)) {
        return res.json({
            valid: true,
            message: '邀请码验证成功 (静态)',
            quota: INVITE_CODE_TOTAL_LIMIT
        });
    }

    // 2. 检查动态日期码 (格式: 前缀 + YYYYMMDD, e.g., REDDIT20260115)
    // 允许的前缀列表 (新增 VIP/SPONSOR)
    const DYNAMIC_PREFIXES = ['REDDIT', 'LIULI', 'PH', 'VIP', 'SPONSOR'];

    // 获取服务器当前日期 (UTC-8 US Pacific Time)
    const now = new Date();
    // 使用 Intl.DateTimeFormat 获取准确的 YYYYMMDD
    const formatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        timeZone: 'America/Los_Angeles'
    });
    const [yyyy, mm, dd] = formatter.format(now).split('-');
    const todaySuffix = `${yyyy}${mm}${dd}`;

    // 检查是否匹配任意动态规则
    const isDynamicValid = DYNAMIC_PREFIXES.some(prefix => {
        const expectedCode = `${prefix}${todaySuffix}`;
        return upperCode === expectedCode;
    });

    if (isDynamicValid) {
        return res.json({
            valid: true,
            message: '邀请码验证成功 (动态)',
            quota: INVITE_CODE_TOTAL_LIMIT
        });
    }

    console.log(`[验证] 失败: "${upperCode}" 不在白名单且不符合动态规则 (今日后缀: ${todaySuffix})`);
    res.status(400).json({
        error: 'INVITE_CODE_INVALID',
        message: '邀请码无效或已过期',
        valid: false
    });
});

// 注册 Router (顺序很重要：先 /api 匹配完整路径，再 / 匹配 Stripped 路径)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// [Debug] 如果上述路由都未匹配，打印日志并返回 404 (帮助调试 Vercel 路径问题)
app.use('*', (req, res) => {
    console.error(`[404 Debug] 未找到路由: ${req.method} ${req.url} (Original: ${req.originalUrl})`);
    res.status(404).json({
        error: 'Route Not Found (Backend)',
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Export app for Vercel Serverless
export default app;

// Only start server if run directly (local dev or traditional hosting)
// ESM alternative to if (require.main === module)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(port, () => {
        console.log(`\n🚀 后端代理服务器运行于 http://localhost:${port}`);
        console.log(`   - 健康检查: http://localhost:${port}/health`);
        console.log(`   - Feature Flags: http://localhost:${port}/api/config`);
        console.log(`   - 代理端点: http://localhost:${port}/api/proxy`);
        console.log(`   - 模型服务: http://localhost:${port}/api/model/*\n`);
    });
}

