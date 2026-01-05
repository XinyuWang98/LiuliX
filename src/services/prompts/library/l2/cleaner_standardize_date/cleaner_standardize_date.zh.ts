import { UserPrompt } from '@/types/prompt';

export const cleanerStandardizeDatePrompt: UserPrompt = {
    id: 'cleaner-standardize-date-v1',
    name: 'cleaner_standardize_date',
    title: '日期格式标准化',
    description: '将日期列统一为 YYYY-MM-DD 格式',
    
    slug: 'cleaner-standardize-date-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = strptime("{column_name}", '%Y-%m-%d') WHERE regexp_matches("{column_name}", '^\\d{4}-\\d{2}-\\d{2}$')`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'standardize', label: '格式标准化' },
        { category: 'output', value: 'date', label: '日期' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};