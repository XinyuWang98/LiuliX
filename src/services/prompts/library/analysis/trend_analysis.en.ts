/**
 * Trend Analysis Prompt Template (English Version)
 * Generates one-sentence trend summary (e.g., "Anomalies increased 23% this week compared to last week, likely due to API throttling")
 */

/**
 * Generate trend analysis prompt (Internal - English)
 * @param timeSeriesData - Time-sorted anomaly count statistics, array format: [{ date: string; count: number }, ...]
 * @returns prompt string
 */
export function generateTrendPromptInternal(timeSeriesData: { date: string; count: number }[]): string {
    // Convert data to readable text description
    const dataText = timeSeriesData
        .map(item => `${item.date}: ${item.count} anomalies`)
        .join('\n');

    const totalCount = timeSeriesData.reduce((sum, item) => sum + item.count, 0);

    return `
You are a professional data trend analyst. Below are the anomaly statistics for a recent period (sorted by date):

${dataText}

Total anomalies: ${totalCount}

Please generate a one-sentence trend summary, strictly following these requirements:
- Must include specific change magnitude (percentage or absolute value), e.g., "increased 23%", "decreased 15%", "remained stable"
- Must include a reasonable hypothesis for the cause (common causes: API throttling, crawler interruption, data source changes, business peak, etc.)
- Keep length within 35 words
- Reply in English, output only one sentence, no prefixes, suffixes, explanations, or punctuation beyond the sentence
`.trim();
}

/**
 * Parse AI-returned trend analysis result (Internal - English)
 * @param aiResponse - Raw text returned by Gemini API
 * @returns One-sentence trend summary string (returns default fallback message if parsing fails)
 */
export function parseTrendResultInternal(aiResponse: string): string {
    const trimmed = aiResponse.trim();

    // Simple safety check: reasonable length, contains percentage or "increase/decrease/stable" keywords
    if (trimmed.length > 10 && trimmed.length < 100 && /[%increase|decrease|stable]/i.test(trimmed)) {
        return trimmed;
    }

    // Return conservative fallback message if parsing fails
    return 'Recent anomaly fluctuation is stable, no significant trend.';
}
