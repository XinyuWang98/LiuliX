import { UserPrompt } from '@/types/prompt';

export const cleanerStandardizeCasePrompt: UserPrompt = {
    id: 'cleaner-standardize-case-v1',
    name: 'cleaner_standardize_case',
    title: 'Standardize Case',
    description: 'Convert text columns to lowercase (or uppercase)',
    
    slug: 'cleaner-standardize-case-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = {case_function}("{column_name}")`,

    inputVariables: ['column_name', 'case_function'],
    
    dimensions: [
        { category: 'intent', value: 'standardize', label: 'Standardize' },
        { category: 'output', value: 'text', label: 'Text' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};