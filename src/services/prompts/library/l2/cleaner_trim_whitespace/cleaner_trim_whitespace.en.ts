import { UserPrompt } from '@/types/prompt';

export const cleanerTrimWhitespacePrompt: UserPrompt = {
    id: 'cleaner-trim-whitespace-v1',
    name: 'cleaner_trim_whitespace',
    title: 'Clean Text (Trim)',
    description: 'Trim leading and trailing whitespace from text columns',
    
    slug: 'cleaner-trim-whitespace-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = regexp_replace(trim("{column_name}"), '\s+', ' ', 'g')`,

    inputVariables: ['column_name'],
    
    dimensions: [
        { category: 'intent', value: 'standardize', label: 'Standardize' },
        { category: 'output', value: 'text', label: 'Text' }
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};