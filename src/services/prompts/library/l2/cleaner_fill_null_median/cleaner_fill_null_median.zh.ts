import { UserPrompt } from '@/types/prompt';

export const cleanerFillNullMedianPrompt: UserPrompt = {
    id: 'cleaner-fill-null-median-v1',
    name: 'cleaner_fill_null_median',
    title: '缺失值填充（中位数）',
    description: '使用中位数填充数值列的缺失值',

    slug: 'cleaner-fill-null-median-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],

    // 🆕 类型约束 (Phase 1)
    inputDataTypes: ['INTEGER', 'BIGINT', 'DOUBLE', 'DECIMAL'],

    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',

    // 🆕 统计参数注入配置（v2.3）
    statsInjection: {
        median_value: 'median'  // 从 ColumnStats.median 自动注入精确值
    },
    template: '',
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = {median_value} WHERE "{column_name}" IS NULL`,

    inputVariables: ['column_name', 'median_value'],

    dimensions: [
        { category: 'intent', value: 'fill_missing', label: '填充缺失值' },
        { category: 'method', value: 'median', label: '中位数' }
    ],

    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};