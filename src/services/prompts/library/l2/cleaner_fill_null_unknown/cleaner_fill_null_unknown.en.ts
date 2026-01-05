import { UserPrompt } from '@/types/prompt';

export const cleanerFillNullUnknownPrompt: UserPrompt = {
    id: 'cleaner-fill-null-unknown-v1',
    name: 'cleaner_fill_null_unknown',
    title: 'Fill Missing (Unknown)',
    description: 'Fill missing values in text columns with "Unknown"',
    
    slug: 'cleaner-fill-null-unknown-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = 'Unknown' WHERE "{column_name}" IS NULL`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'fill_missing', label: 'Fill Missing' },
        { category: 'output', value: 'text', label: 'Text' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};