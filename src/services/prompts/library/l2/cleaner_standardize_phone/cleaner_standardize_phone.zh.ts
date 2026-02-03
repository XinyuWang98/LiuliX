import { UserPrompt } from '@/types/prompt';

export const cleanerStandardizePhonePrompt: UserPrompt = {
    id: 'cleaner-standardize-phone-v1',
    name: 'cleaner_standardize_phone',
    title: '电话号码标准化',
    description: '去除电话号码中的非数字字符（空格、横线、括号等）',

    slug: 'cleaner-standardize-phone-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],

    // 🆕 类型约束 (Phase 1)
    inputDataTypes: ['VARCHAR', 'TEXT'],

    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = regexp_replace("{column_name}", '[^0-9]', '', 'g')`,

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