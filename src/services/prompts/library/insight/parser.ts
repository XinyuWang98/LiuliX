/**
 * Batch Insight Generator - Parser Module
 * Contains parsing and JSON repair logic
 */

import { logger } from '@/utils/logger';

/**
 * Batch Insight Suggestion Interface
 */
export interface InsightSuggestion {
    title: string;
    description: string;
    /** Columns used by AI analysis */
    columns_used: string[];
    /** Full mode */
    full_mode: {
        code: string;
    };
    /** Aggregated mode */
    aggregated_mode: {
        sql: string;
        viz_code: string;
    };
}

/**
 * Parse AI-returned batch insights
 */
export function parseBatchInsightsResponse(aiResponse: string): InsightSuggestion[] {
    try {
        // 📊 Debug: Output raw response (first 500 characters)
        logger.log('AI服务', 'AI原始响应预览', {
            data: aiResponse.substring(0, 500) + (aiResponse.length > 500 ? '...' : '')
        });

        let cleaned = aiResponse.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        // ✅ P0 Fix: Attempt to repair truncated JSON
        cleaned = attemptJSONRepair(cleaned);

        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed)) {
            logger.log('AI服务', 'AI返回格式错误：期望数组', { data: typeof parsed });
            return [];
        }

        // 📊 Debug: Output count before parsing
        logger.log('AI服务', 'JSON解析成功', { count: parsed.length });

        // 📊 Detailed filtering logs
        const filtered = parsed.filter((item: any, index: number) => {
            const checks = {
                hasTitle: !!item.title,
                hasDescription: !!item.description,
                hasColumnsUsed: !!item.columns_used,
                hasFullModeCode: !!item.full_mode?.code,
                hasAggregatedModeSQL: !!item.aggregated_mode?.sql,
                hasAggregatedModeVizCode: !!item.aggregated_mode?.viz_code
            };

            // ⚠️ Temporarily relaxed: Only require title and description (for quick validation)
            const passed = checks.hasTitle && checks.hasDescription;

            if (!passed) {
                logger.warn('AI服务', `洞察 #${index + 1} 被过滤`, {
                    data: { title: item.title || '无标题', ...checks }
                });
            }

            return passed;
        });

        logger.log('AI服务', '过滤完成', {
            count: filtered.length,
            data: { original: parsed.length, filtered: filtered.length }
        });

        return filtered;
    } catch (error) {
        logger.error('AI服务', 'AI响应解析失败', error);
        // ✅ Enhanced logging: Show truncation position
        const preview = aiResponse.substring(0, 500);
        const suffix = aiResponse.substring(Math.max(0, aiResponse.length - 100));
        logger.log('AI服务', 'AI响应预览', { data: `开头: ${preview}...\n结尾: ...${suffix}` });
        return [];
    }
}

/**
 * Attempt to repair truncated JSON response
 * If JSON string is not properly closed, attempt to complete it
 * Also fixes control character issues in AI-generated code
 */
function attemptJSONRepair(jsonStr: string): string {
    let trimmed = jsonStr.trim();

    // 🔧 Remove dangerous regex replacement logic to avoid breaking JSON structure
    // Modern LLMs can usually generate valid JSON escapes. If unescaped newlines are generated, simple regex is hard to fix perfectly
    // We trust LLM output, or only handle truncation issues

    // Check if ends with complete } or ]
    if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
        logger.warn('AI服务', 'JSON响应可能被截断，尝试修复');

        // Find last complete object (ending with },)
        const lastCompleteObj = trimmed.lastIndexOf('},');
        if (lastCompleteObj > 0) {
            // Truncate to last complete object and supplement ending
            const repaired = trimmed.substring(0, lastCompleteObj + 1) + ']';
            logger.log('AI服务', 'JSON修复成功', { data: `原长度: ${jsonStr.length}, 修复后: ${repaired.length}` });
            return repaired;
        }
    }

    return trimmed;
}
