import { UserPrompt } from '@/types/prompt';

export const cleanerFillNullUnknownPrompt: UserPrompt = {
    id: 'cleaner-fill-null-unknown-v1',
    name: 'cleaner_fill_null_unknown',
    title: '缺失值填充（Unknown）',
    description: '使用"Unknown"标记文本列的缺失值',
    
    slug: 'cleaner-fill-null-unknown-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = 'Unknown' WHERE "{column_name}" IS NULL`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'fill_missing', label: '填充缺失值' },
        { category: 'output', value: 'text', label: '文本' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};