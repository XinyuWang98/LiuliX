import { SimpleSuggestion } from '../types/cleaning.types';

/**
 * 建议过滤和排序工具
 * 职责：去重、优先级排序、合并建议
 */

/**
 * 合并并排序建议列表
 * AI建议优先，然后按置信度排序
 */
export function mergeSuggestions(
    aiSuggestions: SimpleSuggestion[],
    ruleSuggestions: SimpleSuggestion[]
): SimpleSuggestion[] {
    const allSuggestions = [...aiSuggestions, ...ruleSuggestions];

    return allSuggestions.sort((a, b) => {
        // AI建议优先
        if (a.id.startsWith('ai_') && !b.id.startsWith('ai_')) return -1;
        if (!a.id.startsWith('ai_') && b.id.startsWith('ai_')) return 1;
        return b.confidence - a.confidence;
    });
}

/**
 * 过滤掉已存在的AI建议，避免重复
 */
export function filterDuplicateAISuggestions(
    currentSuggestions: SimpleSuggestion[]
): SimpleSuggestion[] {
    return currentSuggestions.filter(s => !s.id.startsWith('ai_'));
}

/**
 * 映射AI原始建议到SimpleSuggestion格式
 */
export function mapAISuggestions(
    rawAISuggestions: any[],
    defaultConfidence: number = 0.8
): SimpleSuggestion[] {
    return rawAISuggestions.map((s: any) => {
        const mapped: SimpleSuggestion = {
            id: s.id.startsWith('ai_') ? s.id : `ai_${s.id}`,
            label: s.label,
            reason: s.reason,
            confidence: s.confidence || defaultConfidence,
            action: s.action || 'normalize',
            category: s.category || 'normalize',
            column: s.column,
            sql: s.sql,
            expectedImpact: s.expectedImpact,
            dryRunStatus: s.dryRunStatus,
            source: s.source as ('router' | 'ai' | undefined)  // 🔧 显式类型断言保留source
        };

        // 🐛 DEBUG: 验证source传递
        if (s.source || mapped.source) {
            console.log(`[mapAISuggestions] ${s.id} -> source: ${s.source} => ${mapped.source}`);
        }

        return mapped;
    });
}

/**
 * 检查缓存是否新鲜（24小时内）
 */
export function isCacheFresh(timestamp?: number): boolean {
    if (!timestamp) return false;
    const AGE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24小时
    return (Date.now() - timestamp) < AGE_THRESHOLD_MS;
}
