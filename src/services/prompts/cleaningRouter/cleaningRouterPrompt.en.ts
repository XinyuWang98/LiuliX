/**
 * Cleaning Router Prompt Builder - English Version
 */

import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import { SEED_CLEANING_PROMPTS } from '../seedCleaningPrompts';

/**
 * Build Cleaning Router Prompt (English)
 */
export function buildCleaningRouterPromptInternal(columns: any[], stats: any[]): string {
    // Get all cleaning templates
    let templates = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' })
        .filter(p => p.id.startsWith('cleaner-'))
        .filter(p => !p.deprecated);  // 🆕 v2.3 Filter deprecated prompts

    // Defensive programming: if no templates found, try re-registering seed templates
    if (templates.length === 0) {
        logger.warn('AI清洗', 'No cleaning templates found, attempting to re-register seed templates');
        promptRegistry.registerBatch(SEED_CLEANING_PROMPTS);
        templates = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' })
            .filter(p => p.id.startsWith('cleaner-'));
    }

    // Check again
    if (templates.length === 0) {
        logger.error('AI清洗', 'CRITICAL: Still no cleaning templates after re-registration');
        return '';
    }

    // Build template list
    const sortedTemplates = templates.sort((a, b) => a.id.localeCompare(b.id));

    logger.log('AI清洗', 'Available Router templates', {
        data: sortedTemplates.map(t => t.id)
    });

    const templateList = sortedTemplates.map(t => {
        const params = t.inputVariables.length > 0
            ? `(params: ${t.inputVariables.join(', ')})`
            : '(no params)';
        return `- ${t.id}: ${t.title} ${params}\n  ${t.description}`;
    }).join('\n\n');

    // Analyze data quality issues
    const qualityIssues = summarizeQualityIssuesInternal(columns, stats);

    // Column information summary
    const columnSummary = columns.slice(0, 10).map(c => {
        const colStat = stats.find(s => s.name === c.name);
        const nullRate = colStat ? ((colStat.nullCount / colStat.total) * 100).toFixed(1) : '0.0';
        return `- ${c.name} (${c.type}), missing rate: ${nullRate}%`;
    }).join('\n');

    return `You are a data cleaning expert. Based on data quality issues, select 2-5 most appropriate templates from [Available Cleaning Templates].

## Data Quality Issues
${qualityIssues}

## Column Information (First 10 columns)
${columnSummary}

## Available Cleaning Templates
${templateList}

## Requirements
1. Select **2-5** most valuable cleaning operations from the templates above
2. Fill in specific parameters for each recommendation (e.g., column name, fill value, etc.)
3. Provide brief reasoning

## Output Format (Strict JSON)
\`\`\`json
{
  "recommendations": [
    {
      "promptId": "cleaner-remove-duplicates-v1",
      "params": {},
      "reason": "Reasoning"
    },
    {
      "promptId": "cleaner-fill-null-median-v1",
      "params": {
        "column_name": "actual_column_name",
        "median_value": 30
      },
      "reason": "Reasoning"
    }
  ]
}
\`\`\`

**Important Constraints**:
- promptId must be strictly selected from the template list above (including version number)
- Column names in params must be actual existing columns
- Return JSON only, no other content`;
}

/**
 * Analyze data quality issues (English)
 */
function summarizeQualityIssuesInternal(_columns: any[], stats: any[]): string {
    const issues: string[] = [];

    // Detect missing values
    stats.forEach(stat => {
        if (stat.nullCount > 0 && stat.total > 0) {
            const nullRate = (stat.nullCount / stat.total) * 100;
            if (nullRate > 1) {
                issues.push(`- Column "${stat.name}" has ${nullRate.toFixed(1)}% missing rate`);
            }
        }
    });

    // Default hints (simplified)
    if (issues.length === 0) {
        issues.push('- Possible duplicate rows');
        issues.push('- Some columns may need format standardization');
    }

    return issues.join('\n');
}
