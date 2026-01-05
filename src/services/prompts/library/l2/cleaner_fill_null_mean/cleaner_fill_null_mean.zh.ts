import { UserPrompt } from '@/types/prompt';

export const cleanerFillNullMeanPrompt: UserPrompt = {
    id: 'cleaner-fill-null-mean-v1',
    name: 'cleaner_fill_null_mean',
    title: '缺失值填充（均值）',
    description: '使用平均值填充数值列的缺失值',
    
    slug: 'cleaner-fill-null-mean-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = {mean_value} WHERE "{column_name}" IS NULL`,

    inputVariables: ['column_name', 'mean_value'],
    
    dimensions: [
        { category: 'intent', value: 'fill_missing', label: '填充缺失值' },
        { category: 'method', value: 'mean', label: '均值' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};