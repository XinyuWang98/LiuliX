import { UserPrompt } from '@/types/prompt';

export const cleanerTrimWhitespacePrompt: UserPrompt = {
    id: 'cleaner-trim-whitespace-v1',
    name: 'cleaner_trim_whitespace',
    title: '文本清洗（去除空白）',
    description: '去除文本列的前后空白字符和多余空格',

    slug: 'cleaner-trim-whitespace-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],

    // 🆕 类型约束 (Phase 1)
    inputDataTypes: ['VARCHAR', 'TEXT'],

    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = regexp_replace(trim("{column_name}"), '\s+', ' ', 'g')`,

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