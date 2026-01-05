import { UserPrompt } from '@/types/prompt';

export const cleanerRemoveDuplicatesPrompt: UserPrompt = {
    id: 'cleaner-remove-duplicates-v1',
    name: 'cleaner_remove_duplicates',
    title: 'Remove Duplicates',
    description: 'Remove duplicate rows, keeping unique values',
    
    slug: 'cleaner-remove-duplicates-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT DISTINCT * FROM __TABLE_NAME__`,

    inputVariables: [],
    
    dimensions: [
        { category: 'intent', value: 'dedup', label: 'Deduplication' },
        { category: 'method', value: 'sql', label: 'SQL' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};