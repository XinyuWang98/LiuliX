import { UserPrompt } from '@/types/prompt';

export const cleanerFilterOutliersIqrPrompt: UserPrompt = {
    id: 'cleaner-filter-outliers-iqr-v1',
    name: 'cleaner_filter_outliers_iqr',
    title: 'Filter Outliers (IQR)',
    description: 'Filter outliers using IQR rule (remove records outside Q1-1.5*IQR and Q3+1.5*IQR)',
    
    slug: 'cleaner-filter-outliers-iqr-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE "{column_name}" >= {q1_minus_iqr} AND "{column_name}" <= {q3_plus_iqr}`,

    inputVariables: ['column_name', 'q1_minus_iqr', 'q3_plus_iqr'],
    
    dimensions: [
        { category: 'intent', value: 'filter', label: 'Filter' },
        { category: 'method', value: 'iqr', label: 'IQR Rule' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};