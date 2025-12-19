// 建议生成和分组工具

import { SimpleSuggestion } from '../types/cleaning.types';

/**
 * 按类型分组建议并排序
 * @param suggestions 建议列表
 * @returns 分组后的建议数组 [类型, 建议列表][]
 */
export const groupByCategory = (suggestions: SimpleSuggestion[]): [string, SimpleSuggestion[]][] => {
    const grouped: Record<string, SimpleSuggestion[]> = {};

    // 按类型分组
    suggestions.forEach(s => {
        if (!grouped[s.category]) grouped[s.category] = [];
        grouped[s.category].push(s);
    });

    // 类型内按置信度降序排序
    Object.keys(grouped).forEach(cat => {
        grouped[cat].sort((a, b) => b.confidence - a.confidence);
    });

    // 按建议数量降序排序类型
    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
};

/**
 * 生成操作描述文本
 * @param sugg 建议对象
 * @param rowBefore 操作前行数
 * @param rowAfter 操作后行数
 * @returns 操作描述文本
 */
export const renderActionText = (sugg: SimpleSuggestion, rowBefore: number, rowAfter: number): string => {
    if (sugg.action === 'dedup') {
        if (rowBefore > 0 && rowAfter > 0) {
            return `去重 (${rowBefore}→${rowAfter})`;
        }
        return sugg.label;
    }
    return sugg.label;
};
