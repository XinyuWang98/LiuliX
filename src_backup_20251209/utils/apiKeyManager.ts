/**
 * API Key 管理器
 * 负责 API Key 的安全存储和读取
 */

const API_KEY_STORAGE_KEY = 'dataprism_api_key';
const API_PROVIDER_KEY = 'dataprism_api_provider';
const API_MODEL_KEY = 'dataprism_api_model';
const API_BASE_URL_KEY = 'dataprism_api_base_url';

export type APIProvider = 'gemini' | 'claude' | 'grok';

export interface APIConfig {
    provider: APIProvider;
    modelId: string;
    apiKey: string;
    baseUrl?: string;
}

/**
 * 遮罩 API Key 显示
 */
export function maskAPIKey(key: string): string {
    if (!key || key.length < 16) return '***';
    return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

/**
 * 验证 API Key 格式
 */
export function validateAPIKey(provider: APIProvider, key: string): boolean {
    if (!key) return false;

    switch (provider) {
        case 'gemini':
            // Relaxed validation for proxy support
            return key.length > 0;
        case 'claude':
            return key.startsWith('sk-ant-');
        case 'grok':
            return key.startsWith('xai-');
        default:
            return false;
    }
}

/**
 * 保存 API 配置到 sessionStorage（更安全）
 */
export function saveAPIConfig(config: APIConfig): void {
    if (!validateAPIKey(config.provider, config.apiKey)) {
        throw new Error('无效的 API Key 格式');
    }

    sessionStorage.setItem(API_PROVIDER_KEY, config.provider);
    sessionStorage.setItem(API_MODEL_KEY, config.modelId);
    sessionStorage.setItem(API_KEY_STORAGE_KEY, config.apiKey);
    if (config.baseUrl) {
        sessionStorage.setItem(API_BASE_URL_KEY, config.baseUrl);
    } else {
        sessionStorage.removeItem(API_BASE_URL_KEY);
    }
}

/**
 * 从 sessionStorage 读取 API 配置
 */
export function loadAPIConfig(): APIConfig | null {
    const provider = sessionStorage.getItem(API_PROVIDER_KEY) as APIProvider;
    const modelId = sessionStorage.getItem(API_MODEL_KEY) || 'gemini-pro';
    const apiKey = sessionStorage.getItem(API_KEY_STORAGE_KEY) || '';
    const baseUrl = sessionStorage.getItem(API_BASE_URL_KEY) || undefined;

    if (!provider || !modelId) return null;

    return { provider, modelId, apiKey, baseUrl };
}

/**
 * 清除 API 配置
 */
export function clearAPIConfig(): void {
    sessionStorage.removeItem(API_PROVIDER_KEY);
    sessionStorage.removeItem(API_MODEL_KEY);
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    sessionStorage.removeItem(API_BASE_URL_KEY);
}

/**
 * 检查是否已配置 API Key
 */
export function hasAPIConfig(): boolean {
    return loadAPIConfig() !== null;
}
