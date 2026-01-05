import { UserPrompt } from '@/types/prompt';

export const cleanerStandardizeDatePrompt: UserPrompt = {
    id: 'cleaner-standardize-date-v1',
    name: 'cleaner_standardize_date',
    title: 'Standardize Date',
    description: 'Standardize date columns to YYYY-MM-DD format',
    
    slug: 'cleaner-standardize-date-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = strptime("{column_name}", '%Y-%m-%d') WHERE regexp_matches("{column_name}", '^\\d{4}-\\d{2}-\\d{2}$')`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'standardize', label: 'Standardize' },
        { category: 'output', value: 'date', label: 'Date' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};