/**
 * Report Generator Prompt Template (English Version)
 * Generates structured report content (anomaly list + optimization suggestions)
 */

/**
 * Generate report prompt (Internal - English)
 * @param analysisResults - Summary of all current analysis results (anomaly list, evidence chain, trends, etc.)
 * @returns prompt string
 */
export function generateReportPromptInternal(analysisResults: any): string {
    const resultsText = JSON.stringify(analysisResults, null, 2);

    return `
You are a professional data analysis consultant. Based on the following analysis results, generate a concise and impactful data quality report.

Analysis Results (JSON):
${resultsText}

Please output pure JSON strictly following the structure below (no explanations, markdown, or \`\`\`json markers):

{
  "anomalies": [
    {
      "序号": 1,
      "anomaly_description": "Brief description in English, e.g.: Row 37 contains duplicate data",
      "severity": "High|Medium|Low",
      "impact_scope": "e.g.: Affects user ID statistics, causing report total deviation +1"
    }
  ],
  "optimization_suggestions": [
    {
      "序号": 1,
      "suggestion_title": "Deduplication Cleaning",
      "suggestion_content": "Add drop_duplicates step based on user_id after upload",
      "priority": "High|Medium|Low"
    }
  ]
}

Requirements:
- Anomaly list: 3-6 items, Optimization suggestions: 3-5 items
- Severity and priority must be one of: High/Medium/Low
- Descriptions and content should not exceed 40 words
- Output pure JSON only, no other text
`.trim();
}
