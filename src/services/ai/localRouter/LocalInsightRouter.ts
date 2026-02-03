
import { localRouterService } from '@/services/ai/localRouter/LocalRouterService';
import { PROMPT_IDS } from '@/constants/promptIds';
import { logger } from '@/utils/logger';

export interface LocalRouterResult {
    promptId: string;
    params: Record<string, unknown>;
    reason: string;
}

export class LocalInsightRouter {
    // Map abstract intents to concrete Prompt IDs
    private static readonly INTENT_MAP: Record<string, string> = {
        'analyze_distribution': PROMPT_IDS.DISTRIBUTION,
        'analyze_trend': PROMPT_IDS.TREND,
        'analyze_relationship': PROMPT_IDS.CORRELATION,
        'describe_statistics': PROMPT_IDS.STATS
    };

    private static readonly CANDIDATE_LABELS = Object.keys(LocalInsightRouter.INTENT_MAP);

    /**
     * Generate Insight Recommendations locally
     */
    async generate(
        columns: string[],
        columnTypes: Record<string, string>,
        _sampleData: any[]
    ): Promise<LocalRouterResult[]> {
        logger.group('AI洞察', 'Local Insight Router');
        const recommendations: LocalRouterResult[] = [];

        try {
            // Check status
            if (localRouterService.getStatus() === 'error') {
                throw new Error('Local Model is in error state');
            }
            await localRouterService.loadModels();

            // Iterate columns and classify
            for (const col of columns) {
                const type = columnTypes[col] || 'unknown';
                const description = `Column '${col}' is of type ${type}. Contains data from dataset.`;
                // Note: We can add more stats here if available

                // 1. Classify Intent
                const { labels, scores } = await localRouterService.classifyIntent(
                    description,
                    LocalInsightRouter.CANDIDATE_LABELS
                );

                const bestLabel = labels[0];
                const bestScore = scores[0];

                logger.log('AI洞察', `[LocalRouter] 列 ${col} 分析`, {
                    data: { label: bestLabel, score: bestScore }
                });

                // Thresholding
                if (bestScore > 0.4) {
                    const promptId = LocalInsightRouter.INTENT_MAP[bestLabel];
                    if (promptId) {
                        // 2. Extract Params (Simple heuristic for now: param = current column)
                        // Future: Use localRouterService.extractParameters() for complex mapping
                        const params: Record<string, any> = {};

                        if (promptId === PROMPT_IDS.TREND) {
                            // Trend needs date + value. Simple heuristic: if this col is value, find a date col?
                            // Too complex for V1. Skip trend for single column input unless it's a date?
                            // Let's stick to simple distribution/stats for single columns.
                            params['column_name'] = col;
                        } else if (promptId === PROMPT_IDS.CORRELATION) {
                            // Correlation needs 2 cols. Hard to suggest for single column iteration.
                            // Skip.
                            continue;
                        } else {
                            params['column_name'] = col;
                        }

                        recommendations.push({
                            promptId,
                            params,
                            reason: `Local Model: Detected ${bestLabel} (${(bestScore * 100).toFixed(0)}%)`
                        });
                    }
                }
            }

            return recommendations;

        } catch (e) {
            logger.error('AI洞察', 'Local Router Error', e);
            throw e;
        } finally {
            logger.groupEnd();
        }
    }
}

export const localInsightRouter = new LocalInsightRouter();
