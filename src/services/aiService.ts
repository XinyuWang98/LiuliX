// src/services/aiService.ts
import ky from 'ky';
import { MODEL_CONFIG } from '../config/modelConfig';
import { logger } from '../utils/logger';
import { getUserId, getInviteCode } from '@/utils/userIdManager';

// ==================== 常量定义 ====================
const PROXY_URL = '/api/proxy';



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
        // DeepSeek使用环境变量默认Key（通过代理服务器）
        // 高级模式：用户可以在localStorage设置自定义Key
        key: () => {
            const advancedKey = localStorage.getItem('deepseek_advanced_key');
            if (advancedKey) {
                logger.log('AI服务', '使用高级模式DeepSeek Key');
                return advancedKey;
            }
            // 返回'default'标记，让代理服务器使用环境变量中的Key
            logger.log('AI服务', '使用环境变量默认DeepSeek Key');
            return 'default';
        },
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
                    .post(PROXY_URL, {
                        json: {
                            targetUrl: `${cfg.url}?key=${key}`,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: { contents: [{ parts: [{ text: prompt }] }] }
                        },
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
                    .post(PROXY_URL, {
                        json: {
                            targetUrl: cfg.url,
                            method: 'POST',
                            headers: {
                                'x-api-key': key,
                                'anthropic-version': MODEL_CONFIG.ANTHROPIC.VERSION,
                                'content-type': 'application/json'
                            },
                            data: {
                                model: currentModelName,
                                max_tokens: MODEL_CONFIG.ANTHROPIC.MAX_TOKENS,
                                messages: [{ role: 'user', content: prompt }]
                            }
                        },
                        timeout: MODEL_CONFIG.TIMEOUT_MS
                    })
                    .json<any>();
                return { content: res.content?.[0]?.text || t('settings.errorClaudeEmpty'), model };
            }

            // Grok + DeepSeek 通用 OpenAI 格式
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            // 添加 API Key（包括 'default' 标记，让后端识别并替换）
            if (key) {
                headers['x-api-key'] = key;
            }

            const res = await ky
                .post(PROXY_URL, {
                    json: {
                        targetUrl: cfg.url,
                        method: 'POST',
                        headers,
                        data: {
                            model: currentModelName,
                            messages: [{ role: 'user', content: prompt }],
                            stream: false
                        }
                    },
                    timeout: MODEL_CONFIG.TIMEOUT_MS
                })
                .json<any>();

            // 🎯 提取 Token 使用信息
            const usage = res.usage;
            if (usage) {
                logger.log('AI服务', 'Token消耗统计', {
                    data: {
                        input: usage.prompt_tokens || 0,
                        output: usage.completion_tokens || 0,
                        total: usage.total_tokens || 0
                    }
                });
            }

            const content =
                res.choices?.[0]?.message?.content ||
                res.message?.content ||
                t('settings.errorModelEmpty');

            logger.log('AI服务', `${model}响应成功`, { data: { length: content.length } });

            return { content, model, usage };
        } catch (err: any) {
            console.warn(`[AI服务] ⚠️ ${model} 调用失败:`, err.message);
            continue;
        }
    }

    throw new Error(t('settings.errorAllFailed'));
};

// ==================== 🆕 专用通道函数 ====================

/**
 * 清洗建议专用 AI 调用（快速通道）
 * - 超时：30秒
 * - 用于：SQL生成、数据质量检测
 */
export const askAICleaning = async (prompt: string) => {
    // ⏱️ 性能监控开始
    const perfStart = performance.now();
    const perfMarks: { phase: string; duration: number }[] = [];

    try {
        const key = CONFIG.deepseek.key();

        // ⏱️ 阶段1：请求准备
        const reqPrepStart = performance.now();
        const requestPayload = {
            headers: {
                'x-api-key': key,
                'x-user-id': getUserId(),
                'x-invite-code': getInviteCode() || '',
            },
            json: {
                data: {
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                }
            },
            timeout: 60000
        };
        const reqPrepTime = performance.now() - reqPrepStart;
        perfMarks.push({ phase: '请求准备', duration: reqPrepTime });

        // ⏱️ 阶段2：网络请求
        logger.log('AI服务', '发送请求到DeepSeek API');
        const networkStart = performance.now();
        const res = await ky.post('/api/proxy/deepseek-cleaning', requestPayload).json<any>();
        const networkTime = performance.now() - networkStart;
        perfMarks.push({ phase: '网络请求+响应', duration: networkTime });

        // ⏱️ 阶段3：响应处理
        const processingStart = performance.now();

        // ✅ 处理超限错误
        if (res.error && res.userType) {
            throw new Error(res.message || '免费试用次数已用完');
        }

        // ✅ 更新本地使用次数
        if (res.usage) {
            localStorage.setItem('free_trial_usage', JSON.stringify(res.usage));
            window.dispatchEvent(new Event('free-trial-update'));
        }

        const content = res.choices?.[0]?.message?.content || '';
        const processingTime = performance.now() - processingStart;
        perfMarks.push({ phase: '响应处理+解析', duration: processingTime });

        // ⏱️ 总耗时
        const totalTime = performance.now() - perfStart;

        // 📊 详细性能日志
        logger.log('AI清洗', '响应成功', {
            data: {
                length: content.length,
                totalTime: `${(totalTime / 1000).toFixed(2)}s`,
                breakdown: perfMarks.map(m => `${m.phase}: ${m.duration.toFixed(0)}ms`).join(' | ')
            }
        });

        return { content, model: 'deepseek-cleaning' };
    } catch (err: any) {
        // ✅ 特殊处理429错误
        if (err.message.includes('免费试用') || err.message.includes('邀请码')) {
            throw err; // 直接抛出，让上层显示友好提示
        }
        console.warn('[AI服务-清洗] ⚠️ 调用失败:', err.message);
        throw new Error('清洗建议 AI 调用失败');
    }
};

/**
 * 洞察建议专用 AI 调用（深度通道）
 * - 超时：120秒
 * - 用于：Python代码生成、复杂数据分析
 */
export const askAIInsight = async (prompt: string) => {
    try {
        const key = CONFIG.deepseek.key();
        const res = await ky.post('/api/proxy/deepseek-insight', {
            headers: {
                'x-api-key': key,
                'x-user-id': getUserId(),                    // ✅ 免费试用计数
                'x-invite-code': getInviteCode() || '',      // ✅ 邀请码验证
            },
            json: {
                data: {
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                }
            },
            timeout: 180000  // ✅ 增加到3分钟，支持大数据集
        }).json<any>();

        // ✅ 处理超限错误
        if (res.error && res.userType) {
            throw new Error(res.message || '免费试用次数已用完');
        }

        // ✅ 更新本地使用次数
        if (res.usage) {
            localStorage.setItem('free_trial_usage', JSON.stringify(res.usage));
            window.dispatchEvent(new Event('free-trial-update'));
        }

        const content = res.choices?.[0]?.message?.content || '';
        logger.log('AI洞察', '响应成功', { data: { length: content.length } });

        return { content, model: 'deepseek-insight' };
    } catch (err: any) {
        // ✅ 特殊处理429错误
        if (err.message.includes('免费试用') || err.message.includes('邀请码')) {
            throw err; // 直接抛出，让上层显示友好提示
        }
        console.warn('[AI服务-洞察] ⚠️ 调用失败:', err.message);
        throw new Error('洞察建议 AI 调用失败');
    }
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

// ==================== 数据清洗建议服务 ====================

// ==================== 数据清洗建议服务 ====================

export interface CleaningSuggestion {
    id: string;
    type: 'dedup' | 'fill' | 'filter' | 'normalize' | 'prompt';
    column?: string;
    label: string;
    reason: string;
    confidence: number;
    sql: string;
    isPromptLib?: boolean; // 是否来自 Prompt 库
    expectedImpact?: string;
    dryRunStatus?: 'pending' | 'success' | 'failed';
}

/**
 * 生成清洗建议 (Mock + Rules + LLM)
 * 目前 MVP 阶段包含：
 * 1. 规则检测 (全空列、重复行)
 * 2. Prompt 库匹配
 * 3. 模拟 LLM 建议
 */
export const generateCleaningSuggestions = async (
    tableName: string,
    columns: any[], // Column Metadata
    stats: any[],   // Column Stats
    t: (key: string) => string
): Promise<CleaningSuggestion[]> => {
    const suggestions: CleaningSuggestion[] = [];

    // 示例 A: 日期格式标准化 (Rule: detect date col)
    const dateCol = columns.find(c => c.type.includes('DATE') || c.name.toLowerCase().includes('date') || c.name.toLowerCase().includes('time'));
    if (dateCol) {
        suggestions.push({
            id: 'prompt-date-fmt',
            type: 'prompt',
            label: t('cleaning.promptStandardizeDate') || '标准化日期格式',
            column: dateCol.name,
            reason: t('cleaning.reasonDate') || '检测到日期字段，建议统一格式 (YYYY-MM-DD)。',
            confidence: 0.95,
            isPromptLib: true,
            sql: `UPDATE ${tableName} SET "${dateCol.name}" = strptime("${dateCol.name}", '%Y-%m-%d') WHERE regexp_matches("${dateCol.name}", '^\\d{4}-\\d{2}-\\d{2}$')` // Mock SQL, safe for dry run
        });
    }

    // 示例 B: 邮箱格式修正 (Rule: detect email col)
    const emailCol = columns.find(c => c.name.toLowerCase().includes('email'));
    if (emailCol) {
        suggestions.push({
            id: 'prompt-email-fmt',
            type: 'prompt',
            label: '标准化邮箱格式',
            column: emailCol.name,
            reason: '检测到邮箱字段，建议转为小写并去除空格。',
            confidence: 0.90,
            isPromptLib: true, // Assign to Prompt Lib for visibility
            sql: `UPDATE ${tableName} SET "${emailCol.name}" = lower(trim("${emailCol.name}"))`
        });
    }


    // 2. 基于统计的规则检测 (Rule-Based)

    // (A) 重复行检测
    // 简单假设：没有主键且行数 > 0
    suggestions.push({
        id: 'rule-dedup',
        type: 'dedup',
        label: t('cleaning.removeDuplicates') || '删除重复行',
        reason: '检测到可能存在的完全重复记录。',
        confidence: 0.85,
        sql: `CREATE OR REPLACE TABLE ${tableName} AS SELECT DISTINCT * FROM ${tableName}`
    });

    // (B) 缺失值检测
    stats.forEach(stat => {
        if (stat.nullCount > 0 && stat.total > 0) {
            const nullRate = stat.nullCount / stat.total;
            if (nullRate > 0.01) { // >1% missing
                // 数值列：中位数填充
                if (stat.type.includes('DOUBLE') || stat.type.includes('INT') || stat.type.includes('FLOAT')) {
                    suggestions.push({
                        id: `rule-fill-${stat.name}`,
                        type: 'fill',
                        column: stat.name,
                        label: `${t('cleaning.fillNull')} ${stat.name} (中位数)`,
                        reason: `列 "${stat.name}" 缺失 ${(nullRate * 100).toFixed(1)}%，建议用中位数填充。`,
                        confidence: 0.88,
                        sql: `UPDATE ${tableName} SET "${stat.name}" = ${stat.median || stat.min || 0} WHERE "${stat.name}" IS NULL`
                    });
                }
                // 文本列：Unknown 填充
                else if (stat.type.includes('VARCHAR')) {
                    suggestions.push({
                        id: `rule-fill-${stat.name}`,
                        type: 'fill',
                        column: stat.name,
                        label: `${t('cleaning.fillNull')} ${stat.name}`,
                        reason: `列 "${stat.name}" 缺失 ${(nullRate * 100).toFixed(1)}%，建议标记为 'Unknown'。`,
                        confidence: 0.88,
                        sql: `UPDATE ${tableName} SET "${stat.name}" = 'Unknown' WHERE "${stat.name}" IS NULL`
                    });
                }
            }
        }
    });

    // (C) 模拟 LLM 建议 (针对特定列名)
    // 假设有名为 'price' or 'amount' -> 标准化金额
    const moneyCol = columns.find(c => c.name.toLowerCase().includes('price') || c.name.toLowerCase().includes('amount') || c.name.toLowerCase().includes('salary'));
    if (moneyCol) {
        suggestions.push({
            id: 'ai-normalize-money',
            type: 'normalize',
            column: moneyCol.name,
            label: '标准化金额 (2位小数)',
            reason: '识别为金额字段，建议统一保留两位小数。',
            confidence: 0.75,
            sql: `UPDATE ${tableName} SET "${moneyCol.name}" = ROUND(CAST("${moneyCol.name}" AS DOUBLE), 2)`
        });
    }

    // 排序：Prompt (Tag=Prompt) > Confidence Desc
    return suggestions.sort((a, b) => {
        if (a.isPromptLib && !b.isPromptLib) return -1;
        if (!a.isPromptLib && b.isPromptLib) return 1;
        return b.confidence - a.confidence;
    });
};

// ==================== 洞察链 AI 服务 ====================

/**
 * 生成分析假设
 * @param 数据摘要 - 数据集元信息
 * @returns 3 条假设数组
 */
export const generateHypotheses = async (
    数据摘要: {
        columns?: string[];
        rowCount?: number;
        sampleData?: any[];
    },
    _t: (key: string) => string  // 保留参数以兼容，但不再使用
): Promise<Array<{ assumption: string; verification: string }>> => {
    const { 生成假设Prompt, 解析假设结果 } = await import('@/services/prompts/hypothesis/index');

    const prompt = 生成假设Prompt(数据摘要);
    const { content } = await askAI(prompt);
    return 解析假设结果(content);
};

/**
 * 生成洞察分析
 * @param 假设描述 - 当前假设
 * @param 数据字段列表 - 可用字段
 * @param 用户指令 - 深挖指令
 * @param 代码语言 - python 或 sql
 * @returns 洞察结果（图表类型、数据、结论、代码）
 */
export const generateInsight = async (
    假设描述: string,
    数据字段列表: string[],
    用户指令: string,
    代码语言: 'python' | 'sql' = 'python',
    _t: (key: string) => string  // 保留参数以兼容现有调用，但不再使用
): Promise<any> => {
    const { 生成洞察Prompt, 解析洞察结果 } = await import('@/services/prompts/insightGenerator/index');

    const prompt = 生成洞察Prompt(假设描述, 数据字段列表, 用户指令, 代码语言);
    const { content } = await askAI(prompt);
    return 解析洞察结果(content);
};
