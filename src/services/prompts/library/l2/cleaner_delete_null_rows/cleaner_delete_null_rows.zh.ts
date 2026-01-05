import { UserPrompt } from '@/types/prompt';

export const cleanerDeleteNullRowsPrompt: UserPrompt = {
    id: 'cleaner-delete-null-rows-v1',
    name: 'cleaner_delete_null_rows',
    title: '删除空白行',
    description: '删除指定列为NULL的记录',
    
    slug: 'cleaner-delete-null-rows-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE "{column_name}" IS NOT NULL`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'filter', label: '过滤' },
        { category: 'method', value: 'delete', label: '删除' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};