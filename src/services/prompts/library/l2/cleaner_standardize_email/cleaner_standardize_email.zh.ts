import { UserPrompt } from '@/types/prompt';

export const cleanerStandardizeEmailPrompt: UserPrompt = {
    id: 'cleaner-standardize-email-v1',
    name: 'cleaner_standardize_email',
    title: '邮箱格式标准化',
    description: '将邮箱转为小写并去除前后空格',
    
    slug: 'cleaner-standardize-email-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = lower(trim("{column_name}"))`,

    inputVariables: ['column_name'],
    
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