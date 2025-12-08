export interface ModelConfig {
    id: string;
    name: string;
    isFree: boolean;
    requiresApiKey: boolean;
    rateLimit?: string;
    features: string[];
    docUrl: string;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
    {
        id: 'gemini-1.5-flash-001', // Stable version 001
        name: 'Gemini 1.5 Flash (001)',
        isFree: true,
        requiresApiKey: true,
        rateLimit: '15',
        features: ['free', 'fast', 'requires_key'],
        docUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini'
    },
    {
        id: 'gemini-1.5-pro-001', // Stable version 001
        name: 'Gemini 1.5 Pro (001)',
        isFree: true,
        requiresApiKey: true,
        rateLimit: '2',
        features: ['advanced', 'requires_key'],
        docUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini'
    },
    {
        id: 'gemini-1.5-flash', // Alias
        name: 'Gemini 1.5 Flash (Latest)',
        isFree: true,
        requiresApiKey: true,
        rateLimit: '15',
        features: ['free', 'fast', 'requires_key'],
        docUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini'
    },
    {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        isFree: true,
        requiresApiKey: true,
        rateLimit: '10',
        features: ['experimental', 'latest', 'requires_key'],
        docUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini'
    }
];

export function getModelById(id: string): ModelConfig | undefined {
    return AVAILABLE_MODELS.find(model => model.id === id);
}

export function getDefaultModel(): ModelConfig {
    return AVAILABLE_MODELS[0]; // gemini-1.5-flash-001
}
