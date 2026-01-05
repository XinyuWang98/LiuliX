import { UserPrompt } from '@/types/prompt';

export const cleanerFormatMoneyPrompt: UserPrompt = {
    id: 'cleaner-format-money-v1',
    name: 'cleaner_format_money',
    title: '金额格式化（2位小数）',
    description: '将金额/价格列统一保留2位小数',
    
    slug: 'cleaner-format-money-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = ROUND(CAST("{column_name}" AS DOUBLE), 2)`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'standardize', label: '格式标准化' },
        { category: 'output', value: 'numeric', label: '数值' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};