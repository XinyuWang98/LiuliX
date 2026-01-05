/**
 * Router Prompt Builder - English Version
 * 
 * Generates L1 decision layer prompts for insight analysis
 */

import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import { PROMPT_IDS } from '@/constants/promptIds';

/**
 * Build Router Prompt (English)
 */
export function buildRouterPromptInternal(
    columns: string[],
    sampleData: Record<string, unknown>[],
    columnTypes?: Record<string, string>
): string {
    // Get all L2 prompts, filter out cleaning prompts (keep only analysis)
    const l2Prompts = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' })
        .filter(p => !p.id.startsWith('cleaner-'));

    // Build available template list
    const promptList = l2Prompts.map(p => {
        const params = p.inputVariables.join(', ');
        return `- ${p.id}: ${p.title} (params: ${params})`;
    }).join('\n');

    // Build column information
    const columnInfo = columns.map(col => {
        const type = columnTypes?.[col] || 'unknown';
        return `- ${col} (${type})`;
    }).join('\n');

    // Build sample data preview (handle BigInt)
    const sanitizedSampleData = sampleData.slice(0, 3).map(row => {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
            sanitized[key] = typeof value === 'bigint' ? Number(value) : value;
        }
        return sanitized;
    });
    const samplePreview = JSON.stringify(sanitizedSampleData, null, 2);

    logger.log('AI服务', `[RouterPrompt] Building prompt, ${l2Prompts.length} templates available`);

    return `You are a senior data analyst. Based on the dataset characteristics, select 3-5 most valuable analysis perspectives from the [Available Analysis Templates].

## Dataset Information
### Column Information
${columnInfo}

### Sample Data
\`\`\`json
${samplePreview}
\`\`\`

## Available Analysis Templates
${promptList}

## Requirements
1. Select **3-5** most suitable analyses from the templates above
2. Fill in specific column name parameters for each recommendation
3. (Optional) Predict user's next drill-down analysis

## Output Format (Strict JSON)
\`\`\`json
{
  "recommendations": [
    {
      "promptId": "worker-distribution-v1",
      "params": { "column_name": "actual_column_name" },
      "reason": "Brief reason",
      "drillHint": {
        "promptId": "worker-correlation-v1",
        "params": { "col_x": "col1", "col_y": "col2" },
        "label": "Drill-down button text"
      }
    }
  ]
}
\`\`\`

## Important Constraints (3B Model Optimization)
⚠️ **promptId constraints**:
- Must strictly select from the template list above (including version number like -v1)
- Do not create custom promptId or omit version number
- Correct example: "worker-distribution-v1"
- Wrong example: "distribution", "worker-distribution" (missing -v1)

⚠️ **params constraints**:
- column_name must be an actual existing column name
- Numeric parameters must be number type (no quotes)
- Correct: {"column_name": "age", "threshold": 100}
- Wrong: {"column_name": "non_existent_column", "threshold": "100"}

⚠️ **JSON constraints**:
- Return JSON only, no other markdown explanation
- Ensure correct JSON format (double quotes, commas)

## Few-shot Example
Assume data columns: customer_id (INTEGER), age (INTEGER), salary (DOUBLE), purchase_date (DATE)

Correct output:
\`\`\`json
{
  "recommendations": [
    {
      "promptId": "worker-distribution-v1",
      "params": {"column_name": "age"},
      "reason": "View customer age distribution"
    },
    {
      "promptId": "worker-correlation-v1",
      "params": {"col_x": "age", "col_y": "salary"},
      "reason": "Analyze relationship between age and income",
      "drillHint": {
        "promptId": "worker-groupby-v1",
        "params": {"group_col": "age", "agg_col": "salary"},
        "label": "Group by age range"
      }
    }
  ]
}
\`\`\`

**Now please analyze the actual data and generate recommendations.**`;
}

/**
 * Build fallback recommendations (English)
 */
export function buildFallbackRecommendationsInternal(
    columns: string[],
    columnTypes?: Record<string, string>
): {
    promptId: string;
    params: Record<string, unknown>;
    reason: string;
}[] {
    const recommendations: {
        promptId: string;
        params: Record<string, unknown>;
        reason: string;
    }[] = [];

    // Find first numeric column
    const numericCol = columns.find(col => {
        const type = columnTypes?.[col]?.toLowerCase() || '';
        return type.includes('int') || type.includes('float') || type.includes('numeric');
    });

    // Find first date column
    const dateCol = columns.find(col => {
        const type = columnTypes?.[col]?.toLowerCase() || '';
        return type.includes('date') || type.includes('time');
    });

    // Rule 1: Numeric column → distribution analysis
    if (numericCol) {
        recommendations.push({
            promptId: PROMPT_IDS.DISTRIBUTION,
            params: { column_name: numericCol },
            reason: `View ${numericCol} data distribution`
        });

        recommendations.push({
            promptId: PROMPT_IDS.STATS,
            params: { column_name: numericCol },
            reason: `Descriptive statistics for ${numericCol}`
        });
    }

    // Rule 2: Two numeric columns → correlation
    const numericCols = columns.filter(col => {
        const type = columnTypes?.[col]?.toLowerCase() || '';
        return type.includes('int') || type.includes('float') || type.includes('numeric');
    });
    if (numericCols.length >= 2) {
        recommendations.push({
            promptId: PROMPT_IDS.CORRELATION,
            params: { col_x: numericCols[0], col_y: numericCols[1] },
            reason: `Analyze relationship between ${numericCols[0]} and ${numericCols[1]}`
        });
    }

    // Rule 3: Date + numeric → trend analysis
    if (dateCol && numericCol) {
        recommendations.push({
            promptId: PROMPT_IDS.TREND,
            params: { date_col: dateCol, value_col: numericCol },
            reason: `${numericCol} trend over time`
        });
    }

    logger.log('AI服务', `[RouterPrompt] Rule-based fallback: ${recommendations.length} recommendations generated`);
    return recommendations;
}
