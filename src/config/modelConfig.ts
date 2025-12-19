export const MODEL_CONFIG = {
    // 默认超时时间（增加到60秒以支持DeepSeek等大模型）
    TIMEOUT_MS: 60000,

    // 代理服务器配置
    PROXY_BASE_URL: 'http://localhost:5000/api/proxy',
    USE_PROXY: true, // 开关：是否使用代理

    // ANTHROPIC 配置
    ANTHROPIC: {
        URL: 'http://localhost:5000/api/proxy/claude/v1/messages',
        DIRECT_URL: 'https://api.anthropic.com/v1/messages', // 备用直连URL
        DEFAULT_MODEL: 'claude-3-5-sonnet-20241022',
        VERSION: '2023-06-01',
        MAX_TOKENS: 4096,
        CSS_VAR_MODEL: '--preferred-claude-model'
    },

    // GEMINI 配置
    GEMINI: {
        URL: 'http://localhost:5000/api/proxy/gemini/v1/models/gemini-2.5-flash:generateContent',
        DIRECT_URL: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'
    },

    // GROK 配置
    GROK: {
        URL: 'http://localhost:5000/api/proxy/openai/v1/chat/completions', // Grok使用OpenAI格式
        DIRECT_URL: 'https://api.x.ai/v1/chat/completions',
        DEFAULT_MODEL: 'grok-4-1-fast-reasoning',
        CSS_VAR_MODEL: '--preferred-grok-model'
    },

    // DEEPSEEK 配置
    DEEPSEEK: {
        URL: 'http://localhost:5000/api/proxy/deepseek/v1/chat/completions',
        DIRECT_URL: 'https://api.deepseek.com/v1/chat/completions',
        DEFAULT_MODEL: 'deepseek-chat',
        CSS_VAR_MODEL: '--preferred-deepseek-model'
    }
} as const;
