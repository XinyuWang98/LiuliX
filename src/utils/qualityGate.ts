/**
 * 质量门控（Quality Gate）
 * 过滤低质量洞察，确保展示给用户的都是高置信度结果
 */

import { logger } from './logger';
import { InsightSuggestion } from '@/services/prompts/library/insight';

/** 洞察结果（用于验证）- 与InsightSuggestion相同 */
export type InsightForValidation = InsightSuggestion;

/** 质量评分结果 */
export interface QualityScore {
    /** 总分（0-100） */
    total: number;
    /** 代码质量（0-30分） */
    codeQuality: number;
    /** AI置信度（0-40分） */
    aiConfidence: number;
    /** 数据覆盖率（0-20分） */
    dataCoverage: number;
    /** 统计显著性（0-10分） */
    significance: number;
    /** 是否通过（≥60分） */
    passed: boolean;
    /** 拒绝原因（未通过时） */
    reasons?: string[];
}

const QUALITY_THRESHOLD = 60; // 最低置信度阈值

/**
 * 验证洞察质量
 * @param insight 洞察建议
 * @returns 质量评分
 */
export function validateInsight(insight: InsightForValidation): QualityScore {
    const scores: QualityScore = {
        total: 0,
        codeQuality: 0,
        aiConfidence: 0,
        dataCoverage: 0,
        significance: 0,
        passed: false,
        reasons: []
    };

    // 1. 代码质量评分（0-30分）
    scores.codeQuality = evaluateCodeQuality(insight);

    // 2. AI置信度评分（0-40分）
    scores.aiConfidence = evaluateAIConfidence(insight);

    // 3. 数据覆盖率评分（0-20分）
    scores.dataCoverage = evaluateDataCoverage(insight);

    // 4. 统计显著性评分（0-10分）
    scores.significance = evaluateSignificance(insight);

    // 计算总分
    scores.total =
        scores.codeQuality +
        scores.aiConfidence +
        scores.dataCoverage +
        scores.significance;

    // 判断是否通过
    scores.passed = scores.total >= QUALITY_THRESHOLD;

    // 记录拒绝原因
    if (!scores.passed) {
        if (scores.codeQuality < 15) {
            scores.reasons!.push('代码质量不足');
        }
        if (scores.aiConfidence < 20) {
            scores.reasons!.push('AI置信度过低');
        }
        if (scores.dataCoverage < 10) {
            scores.reasons!.push('数据覆盖不足');
        }
    }

    logger.log('质量门控', `评分: ${scores.total}/100 ${scores.passed ? '✅通过' : '❌拒绝'}`, {
        data: {
            title: insight.title,
            breakdown: {
                code: scores.codeQuality,
                ai: scores.aiConfidence,
                coverage: scores.dataCoverage,
                sig: scores.significance
            },
            reasons: scores.reasons
        }
    });

    return scores;
}

/**
 * 评估代码质量（0-30分）
 */
function evaluateCodeQuality(insight: InsightForValidation): number {
    let score = 0;
    const code = insight.full_mode.code;

    // 基础检查：代码长度合理（5分）
    if (code.length > 100 && code.length < 5000) {
        score += 5;
    }

    // 包含必要导入（5分）
    const hasImports = code.includes('import') &&
        code.includes('matplotlib') &&
        code.includes('base64');
    if (hasImports) {
        score += 5;
    }

    // 包含数据处理逻辑（10分）
    const hasDataProcessing = code.includes('df') || code.includes('DataFrame');
    if (hasDataProcessing) {
        score += 10;
    }

    // 包含可视化代码（10分）
    const hasVisualization = code.includes('plt.') || code.includes('fig');
    if (hasVisualization) {
        score += 10;
    }

    return score;
}

/**
 * 评估AI置信度（0-40分）
 */
function evaluateAIConfidence(insight: InsightForValidation): number {
    let score = 0;

    // 标题合理（10分）
    if (insight.title.length > 3 && insight.title.length < 50) {
        score += 10;
    }

    // 描述详细（10分）
    if (insight.description.length > 10 && insight.description.length < 200) {
        score += 10;
    }

    // ⚠️ 严格要求：必须双模式完整（20分）
    const hasBothModes =
        insight.full_mode?.code &&
        insight.aggregated_mode?.sql &&
        insight.aggregated_mode?.viz_code;

    if (hasBothModes) {
        score += 20; // 双模式完整
    } else {
        // ❌ 缺少双模式直接置0，拒绝此洞察
        logger.warn('质量门控', 'AI未生成双模式Skills，直接拒绝', {
            data: {
                title: insight.title,
                hasFull: !!insight.full_mode?.code,
                hasAggSQL: !!insight.aggregated_mode?.sql,
                hasAggViz: !!insight.aggregated_mode?.viz_code
            }
        });
        return 0; // 直接返回0分，必定不通过
    }

    return score;
}

/**
 * 评估数据覆盖率（0-20分）
 */
function evaluateDataCoverage(insight: InsightForValidation): number {
    let score = 0;

    // 使用的列数（最多20分）
    const columnsUsed = insight.columns_used?.length || 0;
    if (columnsUsed > 0) {
        score = Math.min(columnsUsed * 10, 20); // 每个列10分，最多20分
    }

    return score;
}

/**
 * 评估统计显著性（0-10分）
 */
function evaluateSignificance(_insight: InsightForValidation): number {
    // 保留参数供未来基于统计检验的评分扩展
    void _insight;

    let score = 10; // 默认给满分（暂时无法判断统计显著性）

    // TODO: 未来可以基于代码中的统计检验（如 ttest, chi2）加分

    return score;
}

/**
 * 批量验证洞察
 * @param insights 洞察列表
 * @returns 通过和被拒绝的洞察及其评分
 */
export function batchValidateInsights(
    insights: InsightForValidation[]
): {
    passed: Array<{ insight: InsightForValidation; score: QualityScore }>;
    rejected: Array<{ insight: InsightForValidation; score: QualityScore }>;
} {
    const validated = insights.map(insightItem => ({
        insight: insightItem,
        score: validateInsight(insightItem)
    }));

    // 分组：通过 vs 被拒绝
    const passed = validated.filter(v => v.score.passed);
    const rejected = validated.filter(v => !v.score.passed);

    // 详细日志：总览
    logger.log('质量门控', `批量验证完成: ${passed.length}/${insights.length} 通过`, {
        data: {
            total: insights.length,
            passed: passed.length,
            rejected: rejected.length
        }
    });

    // 详细日志：被拒绝的洞察（用于产品分析）
    if (rejected.length > 0) {
        logger.groupCollapsed('质量门控', '🔍 被拒绝洞察详情（产品分析）');

        rejected.forEach((item, index) => {
            logger.log('质量门控', `被拒绝 #${index + 1}: ${item.insight.title}`, {
                data: {
                    title: item.insight.title,
                    totalScore: item.score.total,
                    breakdown: {
                        codeQuality: item.score.codeQuality,
                        aiConfidence: item.score.aiConfidence,
                        dataCoverage: item.score.dataCoverage,
                        significance: item.score.significance
                    },
                    reasons: item.score.reasons,
                    hasFullMode: !!item.insight.full_mode?.code,
                    hasAggregatedMode: !!(
                        item.insight.aggregated_mode?.sql &&
                        item.insight.aggregated_mode?.viz_code
                    )
                }
            });
        });

        logger.groupEnd();
    }

    return { passed, rejected };
}
