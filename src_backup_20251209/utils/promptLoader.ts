/**
 * Prompt 配置加载器
 * 从 JSON 文件加载 Prompt 配置，支持多语言
 */

import promptsConfig from '@/config/prompts.json';

export interface PromptConfig {
    id: string;
    category: 'analysis' | 'cleaning' | 'visualization';
    tags: string[];
    translations: {
        [locale: string]: {
            title: string;
            description: string;
            content: string;
        };
    };
}

export interface LocalizedPrompt {
    id: string;
    title: string;
    description: string;
    content: string;
    tags: string[];
    category: 'analysis' | 'cleaning' | 'visualization';
}

/**
 * 加载所有 Prompts（根据当前语言）
 */
export function loadPrompts(locale: string = 'zh-CN'): LocalizedPrompt[] {
    return (promptsConfig as PromptConfig[]).map(prompt => {
        const translation = prompt.translations[locale] || prompt.translations['zh-CN'];

        return {
            id: prompt.id,
            title: translation.title,
            description: translation.description,
            content: translation.content,
            tags: prompt.tags,
            category: prompt.category,
        };
    });
}

/**
 * 根据 ID 获取单个 Prompt
 */
export function getPromptById(id: string, locale: string = 'zh-CN'): LocalizedPrompt | null {
    const prompt = (promptsConfig as PromptConfig[]).find(p => p.id === id);

    if (!prompt) {
        return null;
    }

    const translation = prompt.translations[locale] || prompt.translations['zh-CN'];

    return {
        id: prompt.id,
        title: translation.title,
        description: translation.description,
        content: translation.content,
        tags: prompt.tags,
        category: prompt.category,
    };
}

/**
 * 根据分类获取 Prompts
 */
export function getPromptsByCategory(
    category: 'analysis' | 'cleaning' | 'visualization',
    locale: string = 'zh-CN'
): LocalizedPrompt[] {
    return loadPrompts(locale).filter(p => p.category === category);
}

/**
 * 搜索 Prompts
 */
export function searchPrompts(query: string, locale: string = 'zh-CN'): LocalizedPrompt[] {
    const lowerQuery = query.toLowerCase();

    return loadPrompts(locale).filter(prompt =>
        prompt.title.toLowerCase().includes(lowerQuery) ||
        prompt.description.toLowerCase().includes(lowerQuery) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}
