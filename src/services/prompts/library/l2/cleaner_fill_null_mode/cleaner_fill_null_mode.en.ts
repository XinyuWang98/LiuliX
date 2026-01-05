import { UserPrompt } from '@/types/prompt';

export const cleanerFillNullModePrompt: UserPrompt = {
    id: 'cleaner-fill-null-mode-v1',
    name: 'cleaner_fill_null_mode',
    title: 'Fill Missing (Mode)',
    description: 'Fill missing values in categorical columns with mode',
    
    slug: 'cleaner-fill-null-mode-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = '{mode_value}' WHERE "{column_name}" IS NULL`,

    inputVariables: ['column_name', 'mode_value'],
    
    dimensions: [
        { category: 'intent', value: 'fill_missing', label: 'Fill Missing' },
        { category: 'method', value: 'mode', label: 'Mode' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};