/**
 * 清洗建议服务（两层架构）
 * 
 * 架构层级：
 * - Layer 2 (优先): Router模式 → Prompt库模板（快速标准化）
 * - Layer 1 (兜底): AI直接生成SQL（深度分析）
 */

import { CleaningRouter } from './prompts/cleaningRouter';
import { generateAICleaningSuggestions } from './aiCleaningService';
import type { CleaningSuggestion } from './aiService';
import { logger } from '@/utils/logger';

/**
 * 清洗服务配置
 */
export interface CleaningServiceConfig {
    enableRouter: boolean;      // 是否启用Router模式（Layer 2）
    enableAIGeneration: boolean; // 是否启用AI直接生成（Layer 1兜底）
    minSuggestions: number;      // 最少建议数量（触发AI补充的阈值）
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: CleaningServiceConfig = {
    enableRouter: true,
    enableAIGeneration: true,
    minSuggestions: 3
};

/**
 * 生成清洗建议（两层架构版本）
 * 
 * @param tableName 表名
 * @param columns 列信息
 * @param stats 统计信息
 * @param t i18n函数
 * @param duckdbEngine DuckDB引擎
 * @param onProgress 进度回调
 * @param onSuggestionUpdate 建议更新回调
 * @param signal 中止信号
 * @param language 语言
 * @param config 配置
 */
export async function generateCleaningSuggestionsV2(
    tableName: string,
    columns: any[],
    stats: any[],
    t: (key: string, params?: Record<string, any>) => string,
    duckdbEngine?: any,
    onProgress?: (progressMsg: string) => void,
    _onSuggestionUpdate?: (suggestions: CleaningSuggestion[]) => void,
    signal?: AbortSignal,
    language?: string,
    config: Partial<CleaningServiceConfig> = {}
): Promise<CleaningSuggestion[]> {

    const finalConfig: CleaningServiceConfig = { ...DEFAULT_CONFIG, ...config };
    const allSuggestions: CleaningSuggestion[] = [];

    logger.group('AI清洗', '两层架构流程');

    try {
        // === Layer 2: Router模式（优先） ===
        if (finalConfig.enableRouter) {
            logger.log('AI清洗', 'Layer 2: 尝试Router模式');
            onProgress?.('Router模式生成中...');

            try {
                const router = new CleaningRouter();

                // AI服务函数（调用现有AI服务）
                const aiService = async (prompt: string): Promise<string> => {
                    const { askAICleaning } = await import('./aiService');
                    const { content } = await askAICleaning(prompt);
                    return content;
                };

                const routerSuggestions = await router.generate(
                    tableName,
                    columns,
                    stats,
                    aiService
                );

                allSuggestions.push(...routerSuggestions);
                logger.log('AI清洗', `Router返回 ${routerSuggestions.length} 条`);

            } catch (error) {
                logger.warn('AI清洗', `Router失败: ${error}`);
            }
        }

        // === Layer 1: AI直接生成SQL（兜底） ===
        if (finalConfig.enableAIGeneration && allSuggestions.length < finalConfig.minSuggestions) {
            logger.log('AI清洗', 'Layer 1: AI直接生成SQL（兜底）');
            onProgress?.('AI生成补充建议中...');

            try {
                const aiSuggestions = await generateAICleaningSuggestions(
                    tableName,
                    columns,
                    stats,
                    t,
                    duckdbEngine,
                    onProgress,
                    undefined, // 不需要实时更新
                    signal,
                    language
                );

                // 去重（避免与Router重复）
                const uniqueAI = deduplicateSuggestions(aiSuggestions, allSuggestions);
                allSuggestions.push(...uniqueAI);
                logger.log('AI清洗', `AI生成 ${aiSuggestions.length} 条 (去重后${uniqueAI.length}条新增)`);

            } catch (error) {
                logger.warn('AI清洗', `AI生成失败: ${error}`);
            }
        }



        // 排序: Router > AI, 然后按confidence
        const sorted = sortSuggestions(allSuggestions);

        logger.log('AI清洗', `两层架构完成: 总计 ${sorted.length} 条建议`);
        logger.groupEnd();

        return sorted;

    } catch (error) {
        logger.groupEnd();
        logger.error('AI清洗', `两层架构失败: ${error}`);
        return [];
    }
}

/**
 * 去重逻辑
 */
function deduplicateSuggestions(
    newSuggestions: CleaningSuggestion[],
    existing: CleaningSuggestion[]
): CleaningSuggestion[] {
    const existingIds = new Set(existing.map(s => s.id));
    const existingSQLs = new Set(existing.map(s => normalizeSQL(s.sql)));

    return newSuggestions.filter(s =>
        !existingIds.has(s.id) &&
        !existingSQLs.has(normalizeSQL(s.sql))
    );
}

/**
 * SQL标准化（用于去重判断）
 */
function normalizeSQL(sql: string): string {
    return sql
        .replace(/\s+/g, ' ') // 合并空格
        .replace(/"/g, '') // 移除引号
        .trim()
        .toLowerCase();
}

/**
 * 排序建议
 * 
 * 优先级: Router > AI
 * 同优先级按confidence降序
 */
function sortSuggestions(suggestions: CleaningSuggestion[]): CleaningSuggestion[] {
    const sourcePriority = {
        'router': 2,
        'ai': 1
    };

    return suggestions.sort((a, b) => {
        // 优先按来源排序
        const sourceA = (a as any).source || 'ai';
        const sourceB = (b as any).source || 'ai';
        const priorityDiff = (sourcePriority[sourceB as keyof typeof sourcePriority] || 0) - (sourcePriority[sourceA as keyof typeof sourcePriority] || 0);

        if (priorityDiff !== 0) return priorityDiff;

        // 同来源按confidence排序
        return (b.confidence || 0) - (a.confidence || 0);
    });
}

/**
 * 获取清洗服务配置（从LocalStorage）
 */
export function getCleaningServiceConfig(): CleaningServiceConfig {
    return {
        enableRouter: localStorage.getItem('cleaning_router') !== 'false',
        enableAIGeneration: localStorage.getItem('cleaning_ai') !== 'false',
        minSuggestions: parseInt(localStorage.getItem('min_suggestions') || '3')
    };
}
