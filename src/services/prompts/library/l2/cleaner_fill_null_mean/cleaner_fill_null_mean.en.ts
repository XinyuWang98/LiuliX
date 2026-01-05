import { UserPrompt } from '@/types/prompt';

export const cleanerFillNullMeanPrompt: UserPrompt = {
    id: 'cleaner-fill-null-mean-v1',
    name: 'cleaner_fill_null_mean',
    title: 'Fill Missing (Mean)',
    description: 'Fill missing values in numeric columns with mean',
    
    slug: 'cleaner-fill-null-mean-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = {mean_value} WHERE "{column_name}" IS NULL`,

    inputVariables: ['column_name', 'mean_value'],
    
    dimensions: [
        { category: 'intent', value: 'fill_missing', label: 'Fill Missing' },
        { category: 'method', value: 'mean', label: 'Mean' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};