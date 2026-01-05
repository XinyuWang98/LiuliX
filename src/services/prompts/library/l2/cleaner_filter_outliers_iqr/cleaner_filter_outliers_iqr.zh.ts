import { UserPrompt } from '@/types/prompt';

export const cleanerFilterOutliersIqrPrompt: UserPrompt = {
    id: 'cleaner-filter-outliers-iqr-v1',
    name: 'cleaner_filter_outliers_iqr',
    title: '异常值过滤（IQR规则）',
    description: '使用四分位距(IQR)规则过滤数值列的异常值，删除超出Q1-1.5*IQR和Q3+1.5*IQR范围的记录',
    
    slug: 'cleaner-filter-outliers-iqr-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: `CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE "{column_name}" >= {q1_minus_iqr} AND "{column_name}" <= {q3_plus_iqr}`,

    inputVariables: ['column_name', 'q1_minus_iqr', 'q3_plus_iqr'],
    
    dimensions: [
        { category: 'intent', value: 'filter', label: '过滤' },
        { category: 'method', value: 'iqr', label: 'IQR规则' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};