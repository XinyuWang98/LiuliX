import { UserPrompt } from '@/types/prompt';

export const cleanerDropNullColumnPrompt: UserPrompt = {
    id: 'cleaner-drop-null-column-v1',
    name: 'cleaner_drop_null_column',
    title: 'Drop Empty Columns',
    description: 'Drop columns that are completely NULL',
    
    slug: 'cleaner-drop-null-column-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `ALTER TABLE __TABLE_NAME__ DROP COLUMN "{column_name}"`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'filter', label: 'Filter' },
        { category: 'method', value: 'drop', label: 'Drop' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};