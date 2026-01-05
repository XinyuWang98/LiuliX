import { UserPrompt } from '@/types/prompt';

export const cleanerCastToNumericPrompt: UserPrompt = {
    id: 'cleaner-cast-to-numeric-v1',
    name: 'cleaner_cast_to_numeric',
    title: 'Cast to Numeric',
    description: 'Convert text columns to numeric, invalid values become NULL',
    
    slug: 'cleaner-cast-to-numeric-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = TRY_CAST("{column_name}" AS DOUBLE)`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'convert', label: 'Convert' },
        { category: 'output', value: 'numeric', label: 'Numeric' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};