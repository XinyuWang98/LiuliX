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
        id: 'gemini-pro',
        name: 'Gemini Pro',
        isFree: true,
        requiresApiKey: true,  // 所有 Gemini 模型都需要 API Key
        rateLimit: '15',
        features: ['free', 'basic'],
        docUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini'
    },
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        isFree: true,
        requiresApiKey: true,
        rateLimit: '15',
        features: ['free', 'fast', 'requires_key'],
        docUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini'
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        isFree: false,
        requiresApiKey: true,
        features: ['paid', 'advanced'],
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
    return AVAILABLE_MODELS[0]; // gemini-pro
}
