/**
 * workerCleanDedup Prompt - English Version
 */

import { UserPrompt } from '@/types/prompt';

export const workerCleanDedupPrompt: UserPrompt = {
    id: 'worker_clean_dedup-v1',
    name: 'worker_clean_dedup',
    title: 'Remove Duplicates',
    description: 'Identify and remove duplicate rows based on specified columns',

    slug: 'worker_clean_dedup-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: ['chart'],
    layer: 'L2_EXECUTION',

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
1. Perform Remove Duplicates
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
