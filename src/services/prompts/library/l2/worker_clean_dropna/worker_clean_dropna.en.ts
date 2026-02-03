/**
 * workerCleanDropna Prompt - English Version
 */

import { UserPrompt } from '@/types/prompt';

export const workerCleanDropnaPrompt: UserPrompt = {
    id: 'worker_clean_dropna-v1',
    name: 'worker_clean_dropna',
    title: 'Drop Missing Values',
    description: 'Remove rows or columns with missing values based on threshold',

    slug: 'worker_clean_dropna-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: ['chart'],
    layer: 'L2_EXECUTION',

    // ⚠️ Deprecated (v2.3)
    deprecated: true,
    deprecatedReason: 'Use cleaner-delete-null-rows-v1 instead (SQL-based, faster and more reliable)',
    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Explore' },
        { category: 'method', value: 'analysis', label: 'Analysis' },
        { category: 'output', value: 'chart', label: 'Chart' }
    ],

    template: `
You are a professional data analyst.
[English prompt template]

# Dataset Summary
{{df_summary}}

# Requirements
1. Perform Drop Missing Values
2. Return JSON format result

# Output Format (JSON Only)
{
  "code": "...",
  "summary": "Analysis summary in English",
  "columnsUsed": []
}
`,

    inputVariables: ['df_summary'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
