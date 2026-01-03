/**
 * L1 响应校验工具
 * 用于验证 AI 返回的推荐是否符合预期格式
 * 
 * 设计文档: docs/04-技术专题/64-技术专题-Prompt库MVP功能设计总纲.md §8.5
 */

import { promptRegistry } from '@/services/promptRegistry';
import { L1Response, L1Recommendation } from '@/types/insightTree';
import { logger } from '@/utils/logger';
import { PROMPT_IDS } from '@/constants/promptIds';  // v2.1: 使用ID常量

/**
 * 验证单个推荐项
 */
function validateRecommendation(item: L1Recommendation): boolean {
    // 1. promptId 必须存在于注册表
    if (!promptRegistry.hasPrompt(item.promptId)) {
        logger.log('AI服务', `[L1校验] 无效的 promptId: ${item.promptId}`);
        return false;
    }

    // 2. params 必须包含必需参数
    const prompt = promptRegistry.getPrompt(item.promptId);
    if (!prompt) {
        return false;
    }

    const missingParams = prompt.inputVariables.filter(
        v => v !== 'df_summary' && v !== 'history' && !(v in item.params)
    );

    if (missingParams.length > 0) {
        logger.log('AI服务', `[L1校验] 缺少参数: ${missingParams.join(', ')}`);
        return false;
    }

    // 3. reason 不能为空
    if (!item.reason || item.reason.trim().length === 0) {
        logger.log('AI服务', '[L1校验] reason 为空');
        return false;
    }

    return true;
}

/**
 * 验证 drillHint (如果存在)
 */
function validateDrillHint(drillHint: L1Recommendation['drillHint']): boolean {
    if (!drillHint) return true; // drillHint 是可选的

    // promptId 必须存在于注册表
    if (!promptRegistry.hasPrompt(drillHint.promptId)) {
        logger.log('AI服务', `[L1校验] drillHint 无效: ${drillHint.promptId}`);
        return false;
    }

    // label 必须存在
    if (!drillHint.label || drillHint.label.trim().length === 0) {
        logger.log('AI服务', '[L1校验] drillHint.label 为空');
        return false;
    }

    return true;
}

/**
 * 验证完整的 L1 响应
 * @param response AI 返回的原始响应
 * @returns 过滤后的有效推荐列表
 */
export function validateL1Response(response: L1Response | null): L1Recommendation[] {
    if (!response || !response.recommendations) {
        logger.log('AI服务', '[L1校验] 响应格式无效');
        return [];
    }

    if (!Array.isArray(response.recommendations)) {
        logger.log('AI服务', '[L1校验] recommendations 不是数组');
        return [];
    }

    const validRecommendations = response.recommendations.filter(item => {
        // 验证推荐项本身
        if (!validateRecommendation(item)) {
            return false;
        }

        // 验证 drillHint (如果有)
        if (!validateDrillHint(item.drillHint)) {
            // drillHint 无效时，移除它但保留推荐项
            item.drillHint = undefined;
        }

        return true;
    });

    logger.log('AI服务', `[L1校验] 通过 ${validRecommendations.length}/${response.recommendations.length} 条推荐`);

    return validRecommendations;
}

/**
 * 生成兜底推荐 (当 AI 失败或返回空时使用)
 * 
 * 规则优先级 (设计文档 §8.2):
 * 1. 日期/时间列 → 时序趋势分析
 * 2. 数值列有离群值 → 异常值分析
 * 3. 数值列 → 分布分析
 * 4. 两个数值列 → 相关性分析
 * 5. 分类列 + 数值列 → 分组对比分析
 * 
 * @param columns 数据集的列名列表
 * @param columnTypes 列类型映射 (可选)
 * @param columnStats 列统计信息 (可选，用于检测离群值)
 */
export function generateFallbackRecommendations(
    columns: string[],
    columnTypes?: Record<string, string>,
    columnStats?: Record<string, { hasOutliers?: boolean; min?: number; max?: number; mean?: number }>
): L1Recommendation[] {
    const recommendations: L1Recommendation[] = [];

    // 辅助函数: 判断是否为日期类型
    const isDateColumn = (col: string): boolean => {
        if (!columnTypes) {
            // 无类型信息时，通过列名猜测
            const lowerName = col.toLowerCase();
            return lowerName.includes('date') ||
                lowerName.includes('time') ||
                lowerName.includes('日期') ||
                lowerName.includes('时间') ||
                lowerName.includes('created') ||
                lowerName.includes('updated');
        }
        const dtype = columnTypes[col];
        return dtype?.includes('datetime') || dtype?.includes('date') || dtype?.includes('timestamp');
    };

    // 辅助函数: 判断是否为数值类型
    const isNumericColumn = (col: string): boolean => {
        if (!columnTypes) return true; // 无类型信息时假设可能是数值
        const dtype = columnTypes[col];
        return dtype?.includes('int') || dtype?.includes('float') || dtype?.includes('number');
    };

    // 辅助函数: 判断是否为分类类型
    const isCategoricalColumn = (col: string): boolean => {
        if (!columnTypes) return false;
        const dtype = columnTypes[col];
        return dtype?.includes('string') || dtype?.includes('object') || dtype?.includes('category');
    };

    // 规则1: 检测日期列 → 时序分析
    const dateColumn = columns.find(isDateColumn);
    const numericColumns = columns.filter(isNumericColumn);
    if (dateColumn && numericColumns.length > 0 && promptRegistry.hasPrompt(PROMPT_IDS.TREND)) {
        recommendations.push({
            promptId: PROMPT_IDS.TREND,
            params: { date_col: dateColumn, value_col: numericColumns[0] },
            reason: `${dateColumn} 是日期列，建议查看 ${numericColumns[0]} 的时序趋势`
        });
    }

    // 规则2: 检测离群值 → 异常值分析 (预留 Prompt ID)
    if (columnStats) {
        const outlierColumn = columns.find(col => columnStats[col]?.hasOutliers);
        if (outlierColumn && promptRegistry.hasPrompt(PROMPT_IDS.OUTLIER)) {
            recommendations.push({
                promptId: PROMPT_IDS.OUTLIER,
                params: { column_name: outlierColumn },
                reason: `${outlierColumn} 存在离群值，建议进行异常值分析`
            });
        }
    }

    // 规则3: 数值列 → 分布分析 (已有 Prompt)
    if (numericColumns.length > 0) {
        const targetColumn = numericColumns[0];
        recommendations.push({
            promptId: PROMPT_IDS.DISTRIBUTION,
            params: { column_name: targetColumn },
            reason: `${targetColumn} 是数值列，建议查看其分布情况`
        });
    }

    // 规则4: 两个数值列 → 相关性分析 (已有 Prompt)
    if (numericColumns.length >= 2) {
        recommendations.push({
            promptId: PROMPT_IDS.CORRELATION,
            params: { col_x: numericColumns[0], col_y: numericColumns[1] },
            reason: `探索 ${numericColumns[0]} 与 ${numericColumns[1]} 之间的关系`
        });
    }

    // 规则5: 分类列 + 数值列 → 分组对比
    const categoricalColumn = columns.find(isCategoricalColumn);
    if (categoricalColumn && numericColumns.length > 0 && promptRegistry.hasPrompt(PROMPT_IDS.GROUPBY)) {
        recommendations.push({
            promptId: PROMPT_IDS.GROUPBY,
            params: { group_col: categoricalColumn, value_col: numericColumns[0], agg_func: 'mean' },
            reason: `按 ${categoricalColumn} 分组对比 ${numericColumns[0]} 的均值`
        });
    }

    logger.log('AI服务', `[兜底推荐] 生成 ${recommendations.length} 条规则推荐`);
    return recommendations;
}

