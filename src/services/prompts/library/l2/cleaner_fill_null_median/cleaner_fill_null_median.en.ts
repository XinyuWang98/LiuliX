import { UserPrompt } from '@/types/prompt';

export const cleanerFillNullMedianPrompt: UserPrompt = {
    id: 'cleaner-fill-null-median-v1',
    name: 'cleaner_fill_null_median',
    title: 'Fill Missing (Median)',
    description: 'Fill missing values in numeric columns with median',
    
    slug: 'cleaner-fill-null-median-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = {median_value} WHERE "{column_name}" IS NULL`,

    inputVariables: ['column_name', 'median_value'],
    
    dimensions: [
        { category: 'intent', value: 'fill_missing', label: 'Fill Missing' },
        { category: 'method', value: 'median', label: 'Median' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};