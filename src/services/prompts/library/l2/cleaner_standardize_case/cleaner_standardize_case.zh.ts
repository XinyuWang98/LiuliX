import { UserPrompt } from '@/types/prompt';

export const cleanerStandardizeCasePrompt: UserPrompt = {
    id: 'cleaner-standardize-case-v1',
    name: 'cleaner_standardize_case',
    title: '大小写标准化',
    description: '将文本列统一转为小写（或大写）',
    
    slug: 'cleaner-standardize-case-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = {case_function}("{column_name}")`,

    inputVariables: ['column_name', 'case_function'],
    
    dimensions: [
        { category: 'intent', value: 'standardize', label: '格式标准化' },
        { category: 'output', value: 'text', label: '文本' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};