import { UserPrompt } from '@/types/prompt';

export const cleanerDeleteNullRowsPrompt: UserPrompt = {
    id: 'cleaner-delete-null-rows-v1',
    name: 'cleaner_delete_null_rows',
    title: 'Delete Blank Rows',
    description: 'Delete rows where specified column is NULL',
    
    slug: 'cleaner-delete-null-rows-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE "{column_name}" IS NOT NULL`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'filter', label: 'Filter' },
        { category: 'method', value: 'delete', label: 'Delete' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};