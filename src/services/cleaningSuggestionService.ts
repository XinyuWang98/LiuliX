/**
 * 清洗建议服务（两层架构 - 并行优化版）
 * 
 * 架构层级：
 * - Layer 2 (Router模式): Prompt库模板（快速标准化）
 * - Layer 1 (AI直接生成): AI生成SQL（深度分析）
 * 
 * 优化策略：
 * - 数据分析师角色：并行执行Layer 1 & Layer 2
 * - 业务专家角色：串行执行，Layer 2优先，Layer 1兜底
 */

import { CleaningRouter } from './prompts/cleaningRouter';
import { generateAICleaningSuggestions } from './aiCleaningService';
import type { CleaningSuggestion } from './aiService';
import { getCurrentUserRole, getCurrentRoleConfig } from '@/config/userRolePresets';
import { logger } from '@/utils/logger';

/**
 * 清洗服务配置
 */
export interface CleaningServiceConfig {
    enableRouter: boolean;       // 是否启用Router模式（Layer 2）
    enableAIGeneration: boolean; // 是否启用AI直接生成（Layer 1）
    minSuggestions: number;      // 最少建议数量（串行模式下的兜底阈值）
    parallelMode: boolean;       // ✅ 新增：是否并行执行两层
}

/**
 * 默认配置（业务专家模式）
 */
const DEFAULT_CONFIG: CleaningServiceConfig = {
    enableRouter: true,
    enableAIGeneration: false,  // ✅ 禁用AI生成式（仅使用Router模式）
    minSuggestions: 1,
    parallelMode: false  // 默认串行
};

/**
 * 根据用户角色获取清洗服务配置
 */
export function getCleaningConfigByRole(): CleaningServiceConfig {
    const role = getCurrentUserRole();
    const roleConfig = getCurrentRoleConfig();

    if (role === 'analyst') {
        // 数据分析师：并行执行，获取更全面的建议
        return {
            enableRouter: roleConfig.cleaning.enableRouter,
            enableAIGeneration: roleConfig.cleaning.enableAI,
            minSuggestions: roleConfig.cleaning.minSuggestions,
            parallelMode: true  // ✅ 分析师模式开启并行
        };
    }

    // 业务专家：串行执行，Router优先 + AI兜底
    return {
        enableRouter: roleConfig.cleaning.enableRouter,
        enableAIGeneration: roleConfig.cleaning.enableAI,
        minSuggestions: roleConfig.cleaning.minSuggestions,
        parallelMode: false
    };
}

/**
 * 扩展的清洗建议类型（包含来源标识）
 */
export interface CleaningSuggestionWithSource extends CleaningSuggestion {
    source: 'router' | 'ai';  // ✅ 新增：来源标识
}

/**
 * 生成清洗建议（两层架构版本 - 支持并行）
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
 * @param config 配置（可选，默认根据用户角色自动获取）
 */
export async function generateCleaningSuggestionsV2(
    tableName: string,
    columns: any[],
    stats: any[],
    t: (key: string, params?: Record<string, any>) => string,
    duckdbEngine?: any,
    onProgress?: (progressMsg: string) => void,
    _onSuggestionUpdate?: (suggestions: CleaningSuggestionWithSource[]) => void,
    signal?: AbortSignal,
    language?: string,
    config?: Partial<CleaningServiceConfig>
): Promise<CleaningSuggestionWithSource[]> {

    // 合并配置：传入配置 > 角色配置 > 默认配置
    const roleConfig = getCleaningConfigByRole();
    const finalConfig: CleaningServiceConfig = {
        ...DEFAULT_CONFIG,
        ...roleConfig,
        ...config
    };

    const role = getCurrentUserRole();
    logger.group('AI清洗', `两层架构流程 (${role === 'analyst' ? '分析师模式-并行' : '专家模式-串行'})`);

    try {
        // ==================== 并行模式（数据分析师） ====================
        if (finalConfig.parallelMode && finalConfig.enableRouter && finalConfig.enableAIGeneration) {
            logger.log('AI清洗', '并行执行 Layer 1 & Layer 2');
            onProgress?.('并行生成建议中...');

            const [routerResult, aiResult] = await Promise.allSettled([
                // Layer 2: Router模式
                executeRouterLayer(tableName, columns, stats),
                // Layer 1: AI直接生成
                executeAILayer(tableName, columns, stats, t, duckdbEngine, onProgress, signal, language)
            ]);

            const allSuggestions: CleaningSuggestionWithSource[] = [];

            // 处理Router结果
            if (routerResult.status === 'fulfilled') {
                allSuggestions.push(...routerResult.value);
                logger.log('AI清洗', `Router返回 ${routerResult.value.length} 条`);
            } else {
                logger.warn('AI清洗', `Router失败: ${routerResult.reason}`);
            }

            // 处理AI结果
            if (aiResult.status === 'fulfilled') {
                const uniqueAI = deduplicateSuggestions(aiResult.value, allSuggestions);
                allSuggestions.push(...uniqueAI);
                logger.log('AI清洗', `AI生成 ${aiResult.value.length} 条 (去重后${uniqueAI.length}条)`);
            } else {
                logger.warn('AI清洗', `AI生成失败: ${aiResult.reason}`);
            }

            const sorted = sortSuggestions(allSuggestions);
            logger.log('AI清洗', `并行模式完成: 总计 ${sorted.length} 条建议`);
            logger.groupEnd();
            return sorted;
        }

        // ==================== 串行模式（业务专家） ====================
        const allSuggestions: CleaningSuggestionWithSource[] = [];

        // === Layer 2: Router模式（优先） ===
        if (finalConfig.enableRouter) {
            logger.log('AI清洗', 'Layer 2: Router模式');
            onProgress?.('Router模式生成中...');

            try {
                const routerSuggestions = await executeRouterLayer(tableName, columns, stats);
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
                const aiSuggestions = await executeAILayer(
                    tableName, columns, stats, t, duckdbEngine, onProgress, signal, language
                );

                const uniqueAI = deduplicateSuggestions(aiSuggestions, allSuggestions);
                allSuggestions.push(...uniqueAI);
                logger.log('AI清洗', `AI生成 ${aiSuggestions.length} 条 (去重后${uniqueAI.length}条新增)`);
            } catch (error) {
                logger.warn('AI清洗', `AI生成失败: ${error}`);
            }
        }

        const sorted = sortSuggestions(allSuggestions);
        logger.log('AI清洗', `串行模式完成: 总计 ${sorted.length} 条建议`);
        logger.groupEnd();
        return sorted;

    } catch (error) {
        logger.groupEnd();
        logger.error('AI清洗', `两层架构失败: ${error}`);
        return [];
    }
}

/**
 * 执行Router层
 */
async function executeRouterLayer(
    tableName: string,
    columns: any[],
    stats: any[]
): Promise<CleaningSuggestionWithSource[]> {
    const router = new CleaningRouter();

    const aiService = async (prompt: string): Promise<string> => {
        const { askAICleaning } = await import('./aiService');
        const { content } = await askAICleaning(prompt);
        return content;
    };

    const suggestions = await router.generate(tableName, columns, stats, aiService);

    // ✅ 添加来源标识
    const withSource = suggestions.map(s => ({
        ...s,
        source: 'router' as const
    }));

    // 🐛 DEBUG: 验证source字段
    logger.log('AI清洗', `Router层返回 ${withSource.length} 条建议`, {
        data: withSource.map(s => ({ id: s.id, source: s.source })).slice(0, 2)
    });

    return withSource;
}

/**
 * 执行AI直接生成层
 */
async function executeAILayer(
    tableName: string,
    columns: any[],
    stats: any[],
    t: (key: string, params?: Record<string, any>) => string,
    duckdbEngine?: any,
    onProgress?: (progressMsg: string) => void,
    signal?: AbortSignal,
    language?: string
): Promise<CleaningSuggestionWithSource[]> {
    const suggestions = await generateAICleaningSuggestions(
        tableName,
        columns,
        stats,
        t,
        duckdbEngine,
        onProgress,
        undefined,
        signal,
        language
    );

    // ✅ 添加来源标识
    const withSource = suggestions.map(s => ({
        ...s,
        source: 'ai' as const
    }));

    // 🐛 DEBUG: 验证source字段
    logger.log('AI清洗', `AI层返回 ${withSource.length} 条建议`, {
        data: withSource.map(s => ({ id: s.id, source: s.source })).slice(0, 2)
    });

    return withSource;
}

/**
 * 去重逻辑
 */
function deduplicateSuggestions(
    newSuggestions: CleaningSuggestionWithSource[],
    existing: CleaningSuggestionWithSource[]
): CleaningSuggestionWithSource[] {
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
        .replace(/\s+/g, ' ')
        .replace(/"/g, '')
        .trim()
        .toLowerCase();
}

/**
 * 排序建议
 * 
 * 优先级: Router > AI
 * 同优先级按confidence降序
 */
function sortSuggestions(suggestions: CleaningSuggestionWithSource[]): CleaningSuggestionWithSource[] {
    const sourcePriority = {
        'router': 2,
        'ai': 1
    };

    return suggestions.sort((a, b) => {
        const priorityDiff = sourcePriority[b.source] - sourcePriority[a.source];
        if (priorityDiff !== 0) return priorityDiff;
        return (b.confidence || 0) - (a.confidence || 0);
    });
}

/**
 * 获取清洗服务配置（从LocalStorage，保持向后兼容）
 */
export function getCleaningServiceConfig(): CleaningServiceConfig {
    return {
        enableRouter: localStorage.getItem('cleaning_router') !== 'false',
        enableAIGeneration: localStorage.getItem('cleaning_ai') !== 'false',
        minSuggestions: parseInt(localStorage.getItem('min_suggestions') || '1'),
        parallelMode: getCurrentUserRole() === 'analyst'
    };
}
