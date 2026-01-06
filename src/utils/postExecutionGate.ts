/**
 * 执行后质量门控
 * 评估Skills执行结果的有效性和价值
 */

import { logger } from './logger';
import { InsightSuggestion } from '@/services/prompts/library/insight';

/** 执行结果（用于验证） */
export interface ExecutionResult {
    image: string;
    summary: string;
}

/** 执行后质量评分 */
export interface PostExecutionScore {
    /** 总分（0-100） */
    total: number;
    /** 执行成功性（0-30分） */
    executionSuccess: number;
    /** 可视化质量（0-40分） */
    visualQuality: number;
    /** 数据有效性（0-20分） */
    dataValidity: number;
    /** 用户价值（0-10分） */
    userValue: number;
    /** 是否通过（≥60分） */
    passed: boolean;
    /** 拒绝原因（未通过时） */
    reasons?: string[];
}

const POST_QUALITY_THRESHOLD = 60; // 最低质量阈值

/**
 * 评估执行成功性（0-30分）
 */
function evaluateExecutionSuccess(result: ExecutionResult): number {
    let score = 0;

    // 检查图表存在
    if (result.image && result.image.length > 100) {
        score += 15;
    }

    // 检查摘要存在
    if (result.summary && result.summary.length > 20) {
        score += 15;
    }

    return score;
}

/**
 * 评估可视化质量（0-40分）
 */
function evaluateVisualizationQuality(result: ExecutionResult): number {
    let score = 0;

    // 图表大小检查（Base64解码估算）
    if (result.image) {
        const imageSizeKB = (result.image.length * 3 / 4) / 1024;
        if (imageSizeKB > 10) {
            score += 20; // 实质图表
        } else if (imageSizeKB > 1) {
            score += 10; // 图表偏小
        }
    }

    // Summary长度检查
    if (result.summary) {
        if (result.summary.length > 50) {
            score += 20; // 详细摘要
        } else if (result.summary.length > 20) {
            score += 10; // 简短摘要
        }
    }

    return score;
}

/**
 * 评估数据有效性（0-20分）
 */
function evaluateDataValidity(result: ExecutionResult): number {
    let score = 0;
    const summary = result.summary || '';

    // 检查数字
    if (/\d+/.test(summary)) {
        score += 10;
    }

    // 检查统计关键词
    const statsKeywords = ['平均', '最大', '最小', '趋势', '增长', '下降', '相关', '占比'];
    if (statsKeywords.some(kw => summary.includes(kw))) {
        score += 10;
    }

    return score;
}

/**
 * 评估用户价值（0-10分）
 */
function evaluateUserValue(
    insight: InsightSuggestion,
    result: ExecutionResult
): number {
    const hasTitle = insight.title && insight.title.length > 3;
    const hasDesc = insight.description && insight.description.length > 10;
    const hasImage = result.image && result.image.length > 100;
    const hasSummary = result.summary && result.summary.length > 20;

    if (hasTitle && hasDesc && hasImage && hasSummary) {
        return 10; // 四要素完整
    }

    return 0;
}

/**
 * 验证执行结果质量
 * @param insight 洞察建议
 * @param result 执行结果
 * @returns 质量评分
 */
export function validateExecutionResult(
    insight: InsightSuggestion,
    result: ExecutionResult
): PostExecutionScore {
    const score: PostExecutionScore = {
        total: 0,
        executionSuccess: 0,
        visualQuality: 0,
        dataValidity: 0,
        userValue: 0,
        passed: false,
        reasons: []
    };

    // 4维度评分
    score.executionSuccess = evaluateExecutionSuccess(result);
    score.visualQuality = evaluateVisualizationQuality(result);
    score.dataValidity = evaluateDataValidity(result);
    score.userValue = evaluateUserValue(insight, result);

    // 计算总分
    score.total =
        score.executionSuccess +
        score.visualQuality +
        score.dataValidity +
        score.userValue;

    // 判定是否通过
    score.passed = score.total >= POST_QUALITY_THRESHOLD;

    // 记录拒绝原因
    if (!score.passed) {
        if (score.executionSuccess < 15) {
            score.reasons!.push('执行结果不完整');
        }
        if (score.visualQuality < 20) {
            score.reasons!.push('可视化质量低');
        }
        if (score.dataValidity < 10) {
            score.reasons!.push('数据有效性差');
        }
    }

    logger.log('质量门控', `执行后评分: ${score.total}/100 ${score.passed ? '✅' : '⚠️'}`, {
        data: {
            title: insight.title,
            breakdown: {
                exec: score.executionSuccess,
                visual: score.visualQuality,
                data: score.dataValidity,
                value: score.userValue
            },
            reasons: score.reasons
        }
    });

    return score;
}

/**
 * 批量验证执行结果
 * @param results 洞察及执行结果列表
 * @returns 高价值和低价值洞察分组
 */
export function batchValidateExecutionResults(
    results: Array<{ insight: InsightSuggestion; executionResult: ExecutionResult }>
): {
    highValue: Array<{ insight: InsightSuggestion; executionResult: ExecutionResult; postScore: PostExecutionScore }>;
    lowValue: Array<{ insight: InsightSuggestion; executionResult: ExecutionResult; postScore: PostExecutionScore }>;
} {
    const validated = results.map(item => ({
        ...item,
        postScore: validateExecutionResult(item.insight, item.executionResult)
    }));

    const highValue = validated.filter(v => v.postScore.passed);
    const lowValue = validated.filter(v => !v.postScore.passed);

    logger.log('质量门控', `执行后验证完成: ${highValue.length}/${results.length} 高价值`, {
        data: {
            total: results.length,
            highValue: highValue.length,
            lowValue: lowValue.length
        }
    });

    // 详细日志：低价值洞察
    if (lowValue.length > 0) {
        logger.groupCollapsed('质量门控', '⚠️ 低价值洞察详情（产品分析）');

        lowValue.forEach((item, index) => {
            const imageSizeKB = (item.executionResult.image.length * 3 / 4 / 1024).toFixed(1);

            logger.log('质量门控', `低价值 #${index + 1}: ${item.insight.title}`, {
                data: {
                    totalScore: item.postScore.total,
                    breakdown: {
                        exec: item.postScore.executionSuccess,
                        visual: item.postScore.visualQuality,
                        data: item.postScore.dataValidity,
                        value: item.postScore.userValue
                    },
                    reasons: item.postScore.reasons,
                    imageSizeKB,
                    summaryLength: item.executionResult.summary.length
                }
            });
        });

        logger.groupEnd();
    }

    return { highValue, lowValue };
}
