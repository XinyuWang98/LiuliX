import { UserPrompt } from '@/types/prompt';

export const cleanerCastToNumericPrompt: UserPrompt = {
    id: 'cleaner-cast-to-numeric-v1',
    name: 'cleaner_cast_to_numeric',
    title: '类型转换（转数值）',
    description: '将文本列转换为数值类型，无效值转为NULL',

    slug: 'cleaner-cast-to-numeric-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],

    // 🆕 类型约束 (Phase 1 - 类型转换)
    inputDataTypes: ['VARCHAR', 'TEXT'],
    outputDataType: 'DOUBLE',

    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = TRY_CAST("{column_name}" AS DOUBLE)`,

    inputVariables: ['column_name'],

    dimensions: [
        { category: 'intent', value: 'convert', label: '类型转换' },
        { category: 'output', value: 'numeric', label: '数值' }
    ],

    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};