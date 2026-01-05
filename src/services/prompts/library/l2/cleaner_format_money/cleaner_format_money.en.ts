import { UserPrompt } from '@/types/prompt';

export const cleanerFormatMoneyPrompt: UserPrompt = {
    id: 'cleaner-format-money-v1',
    name: 'cleaner_format_money',
    title: 'Format Currency (2 decimals)',
    description: 'Format currency/price columns to 2 decimal places',
    
    slug: 'cleaner-format-money-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = ROUND(CAST("{column_name}" AS DOUBLE), 2)`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'standardize', label: 'Standardize' },
        { category: 'output', value: 'numeric', label: 'Numeric' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};