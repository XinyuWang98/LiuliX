import { IPromptRegistry, UserPrompt, PromptFilter, DimensionKey, MultiLangUserPrompt } from '../types/prompt';
import { getCurrentLanguage } from '@/contexts/I18nContext';
import { logger } from '../utils/logger';

/**
 * Prompt 注册表 (单例)
 * 负责管理所有已加载的 Prompt (L1 & L2)
 */
class PromptRegistry implements IPromptRegistry {
    private static instance: PromptRegistry;
    private prompts: Map<string, UserPrompt> = new Map();
    private customPrompts: Map<string, MultiLangUserPrompt> = new Map();

    private constructor() {
        // Load persist usage counts
        this.loadUsageCounts();
        this.loadCustomPrompts();
    }

    private loadCustomPrompts() {
        try {
            const stored = localStorage.getItem('liulix_custom_prompts');
            if (stored) {
                const prompts = JSON.parse(stored) as Record<string, MultiLangUserPrompt>;
                for (const p of Object.values(prompts)) {
                    this.customPrompts.set(p.id, p);
                }
                logger.log('AI服务', `[PromptRegistry] 加载自定义 Prompt: ${this.customPrompts.size} 个`);
            }
        } catch (e) {
            console.error('Failed to load custom prompts', e);
        }
    }

    public saveCustomPrompt(prompt: MultiLangUserPrompt) {
        this.customPrompts.set(prompt.id, prompt);
        this.persistCustomPrompts();
        logger.log('AI服务', `[PromptRegistry] 保存自定义 Prompt: ${prompt.id}`);
    }

    private persistCustomPrompts() {
        try {
            const obj = Object.fromEntries(this.customPrompts);
            localStorage.setItem('liulix_custom_prompts', JSON.stringify(obj));
        } catch (e) {
            console.error('Failed to save custom prompts', e);
        }
    }

    /**
     * 将多语言 Prompt 扁平化为当前语言的 UserPrompt
     */
    private flattenMultiLangPrompt(custom: MultiLangUserPrompt): UserPrompt {
        const lang = getCurrentLanguage(); // 'zh-CN' or 'en-US'
        const fallback = 'zh-CN';

        const title = custom.title[lang] || custom.title[fallback] || 'Untitled';
        const description = custom.description[lang] || custom.description[fallback] || '';
        const template = custom.template[lang] || custom.template[fallback] || '';

        // 分离多语言字段和其他字段
        const { title: _, description: __, template: ___, codeTemplate: ____, ...rest } = custom;

        return {
            ...rest,
            title,
            description,
            template,
            codeTemplate: custom.codeTemplate?.[lang] || custom.codeTemplate?.[fallback],
            isBuiltIn: false,
            // @ts-ignore: Inject isCustom marker related to logic not type
            isCustom: true
        } as UserPrompt;
    }

    private loadUsageCounts() {
        try {
            const usageData = localStorage.getItem('prompt_usage_counts');
            if (usageData) {
                const counts = JSON.parse(usageData);
                for (const [id, count] of Object.entries(counts)) {
                    if (this.prompts.has(id)) {
                        const p = this.prompts.get(id);
                        if (p) p.usageCount = count as number;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load usage counts', e);
        }
    }

    private saveUsageCounts() {
        try {
            const counts: Record<string, number> = {};
            this.prompts.forEach(p => {
                if (p.usageCount && p.usageCount > 0) {
                    counts[p.id] = p.usageCount;
                }
            });
            localStorage.setItem('prompt_usage_counts', JSON.stringify(counts));
        } catch (e) {
            console.error('Failed to save usage counts', e);
        }
    }

    public static getInstance(): PromptRegistry {
        if (!PromptRegistry.instance) {
            PromptRegistry.instance = new PromptRegistry();
        }
        return PromptRegistry.instance;
    }

    /**
     * Increment usage count for a prompt
     */
    public recordUsage(id: string): void {
        const prompt = this.prompts.get(id);
        if (prompt) {
            prompt.usageCount = (prompt.usageCount || 0) + 1;
            this.saveUsageCounts();
            logger.log('AI服务', `Prompt 使用: ${prompt.title} (Total: ${prompt.usageCount})`);
        }
    }

    /**
     * 获取单个 Prompt（支持ID或slug）
     * v2.1: 增强支持slug查询，向后兼容
     */
    public getPrompt(idOrSlug: string): UserPrompt | undefined {
        // 1. 先尝试标准 Prompt (内置)
        let prompt = this.prompts.get(idOrSlug) || this.getPromptBySlug(idOrSlug);
        if (prompt) return prompt;

        // 2. 再尝试自定义 Prompt (并执行扁平化)
        const custom = this.customPrompts.get(idOrSlug) || this.getCustomPromptBySlug(idOrSlug);
        if (custom) {
            return this.flattenMultiLangPrompt(custom);
        }

        return undefined;
    }

    private getCustomPromptBySlug(slug: string): MultiLangUserPrompt | undefined {
        for (const prompt of this.customPrompts.values()) {
            if (prompt.slug === slug) return prompt;
        }
        return undefined;
    }

    /**
     * 按slug查询Prompt（v2.1新增）
     * 用于向后兼容语义化ID引用
     */
    public getPromptBySlug(slug: string): UserPrompt | undefined {
        for (const prompt of this.prompts.values()) {
            if (prompt.slug === slug) {
                return prompt;
            }
        }
        return undefined;
    }

    /**
     * 检查 Prompt 是否存在（支持ID或slug）
     */
    public hasPrompt(idOrSlug: string): boolean {
        return this.prompts.has(idOrSlug) ||
            this.customPrompts.has(idOrSlug) ||
            this.getPromptBySlug(idOrSlug) !== undefined ||
            this.getCustomPromptBySlug(idOrSlug) !== undefined;
    }

    /**
     * 获取 Prompt 列表 (支持筛选)
     */
    public listPrompts(filter?: PromptFilter): UserPrompt[] {
        // 1. 获取所有内置 Prompt
        let results = Array.from(this.prompts.values());

        // 2. 合并自定义 Prompt (扁平化)
        const customFlatted = Array.from(this.customPrompts.values()).map(p => this.flattenMultiLangPrompt(p));
        results = [...results, ...customFlatted];

        if (filter) {
            if (filter.layer) {
                results = results.filter(p => p.layer === filter.layer);
            }
            if (filter.tagCategory && filter.tagValue) {
                results = results.filter(p =>
                    p.dimensions.some(d => d.category === filter.tagCategory && d.value === filter.tagValue)
                );
            } else if (filter.tagValue) {
                results = results.filter(p =>
                    p.dimensions.some(d => d.value === filter.tagValue)
                );
            }
            if (filter.search) {
                const lowerSearch = filter.search.toLowerCase();
                results = results.filter(p =>
                    p.title.toLowerCase().includes(lowerSearch) ||
                    p.description.toLowerCase().includes(lowerSearch)
                );
            }
        }

        // Default sort by usage count desc, then title
        return results.sort((a, b) => {
            const usageA = a.usageCount || 0;
            const usageB = b.usageCount || 0;
            if (usageA !== usageB) return usageB - usageA;
            return a.title.localeCompare(b.title);
        });
    }

    /**
     * 注册/更新 Prompt
     */
    public register(prompt: UserPrompt): void {
        if (prompt.isBuiltIn && prompt.isOfficial === undefined) {
            prompt.isOfficial = true; // 内置默认为官方
        }

        // Preserve existing usage count if already loaded
        const existing = this.prompts.get(prompt.id);
        if (existing && existing.usageCount) {
            prompt.usageCount = existing.usageCount;
        } else if (prompt.usageCount === undefined) {
            prompt.usageCount = 0; // 默认为0
        }

        this.prompts.set(prompt.id, prompt);
        // logger.log('AI服务', `[PromptRegistry] 注册: ${prompt.title}`);

        // Re-apply persisted counts in case register happens after load
        this.loadUsageCounts();
    }

    /**
     * 批量注册
     */
    public registerBatch(prompts: UserPrompt[]): void {
        prompts.forEach(p => this.register(p));
        logger.log('AI服务', `[PromptRegistry] 批量注册完成，共 ${prompts.length} 个`);
    }

    /**
     * 获取所有可用标签 (用于 UI 筛选器)
     */
    public getAvailableTags(): Record<DimensionKey, string[]> {
        const tags: Record<DimensionKey, Set<string>> = {
            industry: new Set(),
            intent: new Set(),
            method: new Set(),
            output: new Set()
        };

        this.prompts.forEach(p => {
            p.dimensions.forEach(d => {
                if (tags[d.category]) {
                    tags[d.category].add(d.value);
                }
            });
        });

        // 转换 Set 为 Array
        return {
            industry: Array.from(tags.industry),
            intent: Array.from(tags.intent),
            method: Array.from(tags.method),
            output: Array.from(tags.output)
        };
    }



    /**
     * 获取维度计数 (用于侧边栏 Faceted Filter)
     */
    public getPromptCounts(): Record<DimensionKey | 'cleaning' | 'analysis', Record<string, number>> {
        const counts: any = {
            industry: {},
            intent: {},
            method: {},
            output: {},
            cleaning: { total: 0 }, // 特殊分类
            analysis: { total: 0 }  // 特殊分类
        };

        this.prompts.forEach(p => {
            // 维度计数
            p.dimensions.forEach(d => {
                if (!counts[d.category][d.value]) {
                    counts[d.category][d.value] = 0;
                }
                counts[d.category][d.value]++;
            });

            // 业务分类计数 (根据是否有 cleaning 标签或 ID 判断)
            // 简单规则：L2_EXECUTION 且 method != 'cleaning' 归为 analysis
            // method == 'cleaning' 或 L1 归为 cleaning (这里根据现有Prompt特征暂定)
            const isCleaning = p.dimensions.some(d => d.value === 'cleaning' || d.category === 'method' && d.value === 'cleaning');

            if (isCleaning) {
                if (!counts.cleaning['all']) counts.cleaning['all'] = 0;
                counts.cleaning['all']++;
            } else {
                if (!counts.analysis['all']) counts.analysis['all'] = 0;
                counts.analysis['all']++;
            }
        });

        return counts as Record<DimensionKey | 'cleaning' | 'analysis', Record<string, number>>;
    }

    /**
     * 清空注册表 (用于热更/测试)
     */
    public clear(): void {
        this.prompts.clear();
        logger.log('AI服务', '[PromptRegistry] 注册表已清空');
    }
}

// 导出单例实例
export const promptRegistry = PromptRegistry.getInstance();

// 挂载到 window 对象以便控制台调试 (仅开发环境)
// @ts-ignore
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.PromptRegistry = promptRegistry;
}
