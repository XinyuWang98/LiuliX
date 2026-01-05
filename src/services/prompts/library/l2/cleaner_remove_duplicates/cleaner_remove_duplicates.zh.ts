import { UserPrompt } from '@/types/prompt';

export const cleanerRemoveDuplicatesPrompt: UserPrompt = {
    id: 'cleaner-remove-duplicates-v1',
    name: 'cleaner_remove_duplicates',
    title: '删除重复行',
    description: '删除表中的完全重复记录，保留唯一值',
    
    slug: 'cleaner-remove-duplicates-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT DISTINCT * FROM __TABLE_NAME__`,

    inputVariables: [],
    
    dimensions: [
        { category: 'intent', value: 'dedup', label: '去重' },
        { category: 'method', value: 'sql', label: 'SQL' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};