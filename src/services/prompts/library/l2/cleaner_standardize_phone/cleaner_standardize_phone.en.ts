import { UserPrompt } from '@/types/prompt';

export const cleanerStandardizePhonePrompt: UserPrompt = {
    id: 'cleaner-standardize-phone-v1',
    name: 'cleaner_standardize_phone',
    title: 'Standardize Phone',
    description: 'Remove non-numeric characters from phone numbers',
    
    slug: 'cleaner-standardize-phone-v1', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: `UPDATE __TABLE_NAME__ SET "{column_name}" = regexp_replace("{column_name}", '[^0-9]', '', 'g')`,

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