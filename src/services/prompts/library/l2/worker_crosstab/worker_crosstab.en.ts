/**
 * workerCrosstab Prompt - English Version
 */

import { UserPrompt } from '@/types/prompt';

export const workerCrosstabPrompt: UserPrompt = {
    id: 'worker_crosstab-v1',
    name: 'worker_crosstab',
    title: 'Crosstab Analysis',
    description: 'Create cross-tabulation between two categorical variables, show frequency distribution',
    
    slug: 'worker_crosstab-v1',
    packageId: 'basic',
    requiredPackages: ['pandas', 'numpy'],
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
1. Perform Crosstab Analysis
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
