// src/services/aiService.ts
import ky from 'ky';

// ==================== 配置类型定义 ====================
interface ModelConfig {
    url: string;
    key: () => string;
    model?: string;  // 加了 ? 可选，防 Claude/Gemini 没 model
}

export type AIModel = 'gemini' | 'grok' | 'claude' | 'deepseek';

// ==================== 配置区 ====================
const CONFIG: Record<AIModel, ModelConfig> = {
    gemini: {
        url: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',
        key: () => sessionStorage.getItem('gemini_key') || ''
    },
    grok: {
        url: 'https://api.x.ai/v1/chat/completions',
        key: () => sessionStorage.getItem('grok_key') || '',
        model: 'grok-4-1-fast-reasoning' // 2025 最新最强版
    },
    claude: {
        url: 'https://api.anthropic.com/v1/messages',
        key: () => sessionStorage.getItem('claude_key') || '',
        model: 'claude-3-5-sonnet-20241022'
    },
    deepseek: {
        url: 'https://api.deepseek.com/v1/chat/completions',
        key: () => sessionStorage.getItem('deepseek_key') || '',
        model: 'deepseek-chat'
    }
};

// 优先级顺序（可拖拽改）
const getPriority = (): AIModel[] => {
    try {
        return JSON.parse(localStorage.getItem('ai_priority') || '["grok","gemini","claude","deepseek"]');
    } catch {
        return ['grok', 'gemini', 'claude', 'deepseek'];
    }
};

// ==================== 核心调用函数 ====================
export const askAI = async (
    prompt: string,
    options: {
        stream?: boolean;
        modelHint?: AIModel;
        t?: (key: string) => string; // Insert translator
    } = {}
) => {
    // Default translator if not provided (safe fallback)
    const t = options.t || ((path: string) => {
        const fallbacks: Record<string, string> = {
            'settings.errorGeminiEmpty': 'Gemini 没说话',
            'settings.errorClaudeEmpty': 'Claude 哑巴了',
            'settings.errorModelEmpty': '没内容',
            'settings.errorAllFailed': '所有 AI 都挂了，明天再来吧'
        };
        return fallbacks[path] || path;
    });

    const priority = options.modelHint ? [options.modelHint] : getPriority();

    for (const model of priority) {
        const cfg = CONFIG[model];
        const key = cfg.key();
        if (!key) continue;

        try {
            // Gemini 专用格式
            if (model === 'gemini') {
                const res = await ky
                    .post(`${cfg.url}?key=${key}`, {
                        json: { contents: [{ parts: [{ text: prompt }] }] },
                        timeout: 15000
                    })
                    .json<any>();
                return {
                    content:
                        res.candidates?.[0]?.content?.parts?.[0]?.text ||
                        t('settings.errorGeminiEmpty'),
                    model
                };
            }

            // Claude 专用格式
            if (model === 'claude') {
                const res = await ky
                    .post(cfg.url, {
                        headers: {
                            'x-api-key': key,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        },
                        json: {
                            model: cfg.model,  // 现在有类型保护
                            max_tokens: 4096,
                            messages: [{ role: 'user', content: prompt }]
                        },
                        timeout: 15000
                    })
                    .json<any>();
                return { content: res.content?.[0]?.text || t('settings.errorClaudeEmpty'), model };
            }

            // Grok + DeepSeek 通用 OpenAI 格式
            const res = await ky
                .post(cfg.url, {
                    headers: {
                        Authorization: `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    },
                    json: {
                        model: cfg.model,  // 现在有类型保护
                        messages: [{ role: 'user', content: prompt }],
                        stream: false
                    },
                    timeout: 15000
                })
                .json<any>();

            const content =
                res.choices?.[0]?.message?.content ||
                res.message?.content ||
                t('settings.errorModelEmpty');

            return { content, model };
        } catch (err: any) {
            console.warn(`${model} 挂了:`, err.message);
            continue; // 直接切下一个
        }
    }

    throw new Error(t('settings.errorAllFailed'));
};