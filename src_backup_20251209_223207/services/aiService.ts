// src/services/aiService.ts
import ky from 'ky';
import { MODEL_CONFIG } from '../config/modelConfig';

// ==================== 配置类型定义 ====================
interface ModelConfig {
    url: string;
    key: () => string;
    model?: string;
    modelVar?: string; // CSS 变量名，支持运行时动态读取模型
}

export type AIModel = 'gemini' | 'grok' | 'claude' | 'deepseek';

// ==================== 辅助函数：动态获取模型名 ====================
const getModelName = (defaultModel: string, cssVar?: string): string => {
    if (!cssVar) return defaultModel;
    if (typeof window === 'undefined') return defaultModel;

    const style = getComputedStyle(document.documentElement);
    const val = style.getPropertyValue(cssVar).trim();
    return val || defaultModel; // 如果没定义变量，回退到默认值
};

// ==================== 配置区 ====================
const CONFIG: Record<AIModel, ModelConfig> = {
    gemini: {
        url: MODEL_CONFIG.GEMINI.URL,
        key: () => sessionStorage.getItem('gemini_key') || ''
    },
    grok: {
        url: MODEL_CONFIG.GROK.URL,
        key: () => sessionStorage.getItem('grok_key') || '',
        model: MODEL_CONFIG.GROK.DEFAULT_MODEL,
        modelVar: MODEL_CONFIG.GROK.CSS_VAR_MODEL
    },
    claude: {
        url: MODEL_CONFIG.ANTHROPIC.URL,
        key: () => sessionStorage.getItem('claude_key') || '',
        model: MODEL_CONFIG.ANTHROPIC.DEFAULT_MODEL,
        modelVar: MODEL_CONFIG.ANTHROPIC.CSS_VAR_MODEL
    },
    deepseek: {
        url: MODEL_CONFIG.DEEPSEEK.URL,
        key: () => sessionStorage.getItem('deepseek_key') || '',
        model: MODEL_CONFIG.DEEPSEEK.DEFAULT_MODEL,
        modelVar: MODEL_CONFIG.DEEPSEEK.CSS_VAR_MODEL
    }
};

// 优先级顺序
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
        t?: (key: string) => string;
    } = {}
) => {
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
            // 动态读取当前模型名
            const currentModelName = cfg.model ? getModelName(cfg.model, cfg.modelVar) : '';

            // Gemini 专用格式
            if (model === 'gemini') {
                const res = await ky
                    .post(`${cfg.url}?key=${key}`, {
                        json: { contents: [{ parts: [{ text: prompt }] }] },
                        timeout: MODEL_CONFIG.TIMEOUT_MS
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
                            'anthropic-version': MODEL_CONFIG.ANTHROPIC.VERSION,
                            'content-type': 'application/json'
                        },
                        json: {
                            model: currentModelName,
                            max_tokens: MODEL_CONFIG.ANTHROPIC.MAX_TOKENS,
                            messages: [{ role: 'user', content: prompt }]
                        },
                        timeout: MODEL_CONFIG.TIMEOUT_MS
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
                        model: currentModelName,
                        messages: [{ role: 'user', content: prompt }],
                        stream: false
                    },
                    timeout: MODEL_CONFIG.TIMEOUT_MS
                })
                .json<any>();

            const content =
                res.choices?.[0]?.message?.content ||
                res.message?.content ||
                t('settings.errorModelEmpty');

            return { content, model };
        } catch (err: any) {
            console.warn(`${model} 挂了:`, err.message);
            continue;
        }
    }

    throw new Error(t('settings.errorAllFailed'));
};

/**
 * 专门用于生成数据清洗 SQL 的辅助函数
 * 强制输出纯净 SQL
 */
export const generateCleaningSQL = async (
    tableName: string,
    schema: string,
    intent: string
) => {
    const prompt = `
You are a DuckDB SQL Expert.
Goal: Generate a SINGLE executable SQL statement to clean/transform the table.
Table: "${tableName}"
Columns: ${schema}
User Request: ${intent}

Requirements:
1. Return ONLY the SQL string. No markdown, no "Here is the code".
2. Use "CREATE OR REPLACE TABLE ${tableName} AS ..." if modifying data unless it's a DELETE/UPDATE statement.
3. Ensure syntax is valid DuckDB SQL.

SQL:`;

    const { content } = await askAI(prompt, { modelHint: 'grok' });
    return content.replace(/```sql/g, '').replace(/```/g, '').trim();
};