import { UserPrompt } from '@/types/prompt';

export const cleanerFillNullModePrompt: UserPrompt = {
    id: 'cleaner-fill-null-mode-v1',
    name: 'cleaner_fill_null_mode',
    title: '缺失值填充（众数）',
    description: '使用最常见值（众数）填充分类列的缺失值',

    slug: 'cleaner-fill-null-mode-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],

    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',

    // 🆕 统计参数注入配置（v2.3）
    statsInjection: {
        mode_value: 'mode'  // 从 ColumnStats.mode 自动注入精确值（分类列的众数）
    },
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = '{mode_value}' WHERE "{column_name}" IS NULL`,

    inputVariables: ['column_name', 'mode_value'],

    dimensions: [
        { category: 'intent', value: 'fill_missing', label: '填充缺失值' },
        { category: 'method', value: 'mode', label: '众数' }
    ],

    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};