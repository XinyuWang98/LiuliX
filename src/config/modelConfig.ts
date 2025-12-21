export const MODEL_CONFIG = {
    // 默认超时时间（增加到120秒以支持DeepSeek等大模型处理完整数据集）
    TIMEOUT_MS: 120000,

    // ANTHROPIC 配置
    ANTHROPIC: {
        URL: 'https://api.anthropic.com/v1/messages',
        DEFAULT_MODEL: 'claude-3-5-sonnet-20241022',
        VERSION: '2023-06-01',
        MAX_TOKENS: 4096,
        CSS_VAR_MODEL: '--preferred-claude-model'
    },

    // GEMINI 配置
    GEMINI: {
        URL: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'
    },

    // GROK 配置
    GROK: {
        URL: 'https://api.x.ai/v1/chat/completions',
        DEFAULT_MODEL: 'grok-4-1-fast-reasoning',
        CSS_VAR_MODEL: '--preferred-grok-model'
    },

    // DEEPSEEK 配置
    DEEPSEEK: {
        URL: 'https://api.deepseek.com/v1/chat/completions',
        DEFAULT_MODEL: 'deepseek-chat',
        CSS_VAR_MODEL: '--preferred-deepseek-model'
    }
} as const;
