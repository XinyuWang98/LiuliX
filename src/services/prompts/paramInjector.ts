/**
 * 参数注入器模块 (v2.3)
 * 
 * 功能：从 DuckDB ColumnStats 中提取精确统计值，注入到 Router 推荐的 Prompt 参数中
 * 架构：基于 Prompt 模板的 statsInjection 声明动态执行，支持用户自定义配置
 */

import { logger } from '@/utils/logger';
import { promptRegistry } from '@/services/promptRegistry';
import type { ColumnStats } from '@/types/prompt';  // 使用 prompt.ts 中定义的 ColumnStats

/**
 * Router 推荐结果接口
 */
export interface RouterRecommendation {
    promptId: string;
    params: Record<string, any>;
    reason: string;
}

/**
 * 动态参数注入器
 * 
 * 工作流程：
 * 1. 遍历 Router 推荐列表
 * 2. 从 PromptRegistry 获取 Prompt 模板定义
 * 3. 读取模板的 statsInjection 配置
 * 4. 根据配置从 ColumnStats 提取精确值并注入
 * 
 * @param recommendations - Router 输出的推荐列表
 * @param columnStats - DuckDB 计算的列统计信息
 * @returns 注入精确参数后的推荐列表
 */
export function injectStatsParams(
    recommendations: RouterRecommendation[],
    columnStats: any[]  // 使用 any[] 兼容现有 stats 接口
): RouterRecommendation[] {

    logger.group('参数注入器', '开始注入统计参数');

    const injected = recommendations.map(rec => {
        // 获取 Prompt 模板定义
        const template = promptRegistry.getPrompt(rec.promptId);
        if (!template) {
            logger.warn('参数注入器', `Prompt ${rec.promptId} 不存在`);
            return rec;
        }

        // 检查是否有注入配置
        if (!template.statsInjection) {
            // 无需注入，直接返回
            return rec;
        }

        // 获取目标列的统计信息
        const columnName = rec.params.column_name;
        if (!columnName) {
            logger.warn('参数注入器', `${rec.promptId} 缺少 column_name，跳过注入`);
            return rec;
        }

        // 查找列统计信息（兼容多种字段名）
        const stats = columnStats.find(s =>
            s.name === columnName || s.column_name === columnName
        );

        if (!stats) {
            logger.warn('参数注入器', `列 "${columnName}" 的统计信息不存在，保留 AI 猜测值`);
            return rec;  // 降级：保留 AI 猜测的值
        }

        // 执行动态注入
        const injectedParams = { ...rec.params };
        let injectedCount = 0;

        for (const [paramName, extractor] of Object.entries(template.statsInjection)) {
            let value: any;

            // 判断提取器类型
            if (typeof extractor === 'function') {
                // 自定义函数
                try {
                    // 构建兼容的 ColumnStats 对象
                    const normalizedStats = normalizeStats(stats);
                    value = extractor(normalizedStats);
                } catch (error) {
                    logger.warn('参数注入器', `${paramName} 计算函数执行失败: ${error}`);
                    continue;
                }
            } else {
                // 字符串映射（直接取字段）
                value = extractStatField(stats, extractor as string);
            }

            if (value !== undefined && value !== null) {
                injectedParams[paramName] = value;
                injectedCount++;
                logger.log('参数注入器', `注入 ${paramName} = ${value}`);
            } else {
                logger.warn('参数注入器', `参数 ${paramName} 无法提取，保留原值`);
            }
        }

        if (injectedCount > 0) {
            logger.log('参数注入器', `${rec.promptId} 注入 ${injectedCount} 个精确参数`);
        }

        return {
            ...rec,
            params: injectedParams
        };
    });

    logger.groupEnd();
    return injected;
}

/**
 * 标准化 ColumnStats 对象
 * 
 * 兼容不同的 stats 数据结构：
 * - { name, numeric_stats: { median, mean, ... } }  // data.ts 格式
 * - { name, median, mean, ... }  // 扁平格式
 */
function normalizeStats(stats: any): ColumnStats {
    // 如果有 numeric_stats 嵌套结构，展开它
    if (stats.numeric_stats) {
        return {
            name: stats.column_name || stats.name,
            dtype: stats.data_type || stats.dtype || 'unknown',
            total: stats.total || 0,
            nullCount: stats.missing_count || stats.nullCount || 0,
            ...stats.numeric_stats,  // 展开 numeric_stats
            mode: stats.categorical_stats?.top_values?.[0]?.value
        } as ColumnStats;
    }

    // 否则直接返回（已经是扁平格式）
    return stats as ColumnStats;
}

/**
 * 从统计对象中提取字段值
 * 
 * 兼容多种数据结构
 */
function extractStatField(stats: any, fieldName: string): any {
    // 尝试直接访问
    if (stats[fieldName] !== undefined) {
        return stats[fieldName];
    }

    // 尝试从 numeric_stats 中获取
    if (stats.numeric_stats && stats.numeric_stats[fieldName] !== undefined) {
        return stats.numeric_stats[fieldName];
    }

    // 特殊处理 mode（可能在 categorical_stats 中）
    if (fieldName === 'mode' && stats.categorical_stats?.top_values?.length > 0) {
        return stats.categorical_stats.top_values[0].value;
    }

    return undefined;
}

/**
 * 验证 Prompt 的注入配置是否合法
 * 
 * 用于用户编辑 Prompt 时的实时校验
 * 
 * @param statsInjection - 用户配置的注入规则
 * @param inputVariables - Prompt 声明的输入变量
 * @returns 校验结果
 */
export function validateStatsInjection(
    statsInjection: Record<string, any>,
    inputVariables: string[]
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查所有注入的参数是否在 inputVariables 中声明
    for (const paramName of Object.keys(statsInjection)) {
        if (!inputVariables.includes(paramName)) {
            errors.push(`参数 "${paramName}" 未在 inputVariables 中声明`);
        }
    }

    // 检查提取器类型
    for (const [paramName, extractor] of Object.entries(statsInjection)) {
        if (typeof extractor !== 'string' && typeof extractor !== 'function') {
            errors.push(`参数 "${paramName}" 的提取器类型无效（必须是字符串或函数）`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
