import { UserPrompt } from '@/types/prompt';

export const cleanerDropNullColumnPrompt: UserPrompt = {
    id: 'cleaner-drop-null-column-v1',
    name: 'cleaner_drop_null_column',
    title: '删除全空列',
    description: '删除数据全部为NULL的无效列',
    
    slug: 'cleaner-drop-null-column-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `ALTER TABLE __TABLE_NAME__ DROP COLUMN "{column_name}"`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'filter', label: '过滤' },
        { category: 'method', value: 'drop', label: '删除' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};