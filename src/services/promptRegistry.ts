import { IPromptRegistry, UserPrompt, PromptFilter, DimensionKey } from '../types/prompt';
import { logger } from '../utils/logger';

/**
 * Prompt 注册表 (单例)
 * 负责管理所有已加载的 Prompt (L1 & L2)
 */
class PromptRegistry implements IPromptRegistry {
    private static instance: PromptRegistry;
    private prompts: Map<string, UserPrompt> = new Map();

    private constructor() {
        // 初始化时可以加载种子 Prompt (后续会改为动态加载)
        // this.log('PromptRegistry', '初始化完成');
    }

    public static getInstance(): PromptRegistry {
        if (!PromptRegistry.instance) {
            PromptRegistry.instance = new PromptRegistry();
        }
        return PromptRegistry.instance;
    }

    /**
     * 获取单个 Prompt
     */
    public getPrompt(id: string): UserPrompt | undefined {
        return this.prompts.get(id);
    }

    /**
     * 检查 Prompt 是否存在
     */
    public hasPrompt(id: string): boolean {
        return this.prompts.has(id);
    }

    /**
     * 获取 Prompt 列表 (支持筛选)
     */
    public listPrompts(filter?: PromptFilter): UserPrompt[] {
        let results = Array.from(this.prompts.values());

        if (filter) {
            if (filter.layer) {
                results = results.filter(p => p.layer === filter.layer);
            }
            if (filter.tagCategory && filter.tagValue) {
                results = results.filter(p =>
                    p.dimensions.some(d => d.category === filter.tagCategory && d.value === filter.tagValue)
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

        return results;
    }

    /**
     * 注册/更新 Prompt
     */
    public register(prompt: UserPrompt): void {
        this.prompts.set(prompt.id, prompt);
        // logger.log('AI服务', `[PromptRegistry] 注册: ${prompt.title}`);
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
