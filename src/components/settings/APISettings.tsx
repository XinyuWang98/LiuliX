import { useState, useEffect } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { Settings, Eye, EyeOff, Check, X, Loader, ExternalLink } from 'lucide-react';
import {
    APIProvider,
    saveAPIConfig,
    loadAPIConfig,
    clearAPIConfig,
    maskAPIKey,
    validateAPIKey
} from '@utils/apiKeyManager';
import { geminiService } from '../../services/GeminiService';

// 模型配置类型
interface ModelOption {
    id: string;
    name: string;
    provider: APIProvider;
    requiresApiKey: boolean;
    isFree: boolean;
    docUrl?: string;
    rateLimit?: number; // 每分钟请求数限制
    features?: string[]; // 特性标签
}

// 可用模型列表
const AVAILABLE_MODELS: ModelOption[] = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'gemini',
        requiresApiKey: true,
        isFree: true,
        docUrl: 'https://ai.google.dev/gemini-api/docs'
    },
    {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'claude',
        requiresApiKey: true,
        isFree: false,
        docUrl: 'https://docs.anthropic.com/claude/docs'
    },
    {
        id: 'grok-2',
        name: 'Grok 2',
        provider: 'grok',
        requiresApiKey: true,
        isFree: false,
        docUrl: 'https://docs.x.ai/'
    }
];

interface APISettingsProps {
    onClose: () => void;
}

export function APISettings({ onClose }: APISettingsProps) {
    const { t } = useI18n();
    const [provider, setProvider] = useState<APIProvider>('gemini');
    const [selectedModel, setSelectedModel] = useState<ModelOption>(AVAILABLE_MODELS[0]);
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; docUrl?: string } | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const config = loadAPIConfig();
        if (config) {
            setProvider(config.provider);
            const model = AVAILABLE_MODELS.find(m => m.id === config.modelId);
            if (model) {
                setSelectedModel(model);
            }
            setApiKey(config.apiKey);
            setBaseUrl(config.baseUrl || '');
            setIsSaved(true);
        }
    }, []);

    const handleModelChange = (modelId: string) => {
        const model = AVAILABLE_MODELS.find(m => m.id === modelId);
        if (model) {
            setSelectedModel(model);
            setProvider(model.provider);
            setIsSaved(false);
            setTestResult(null);
        }
    };

    const handleTestConnection = async () => {
        const cleanKey = apiKey.trim();
        const cleanBaseUrl = baseUrl.trim();

        if (selectedModel.requiresApiKey && !cleanKey) {
            setTestResult({
                success: false,
                message: t('settings.errorInvalidKey'),
                docUrl: selectedModel.docUrl
            });
            return;
        }

        if (selectedModel.requiresApiKey && !validateAPIKey(provider, cleanKey)) {
            setTestResult({
                success: false,
                message: t('settings.errorInvalidKeySolution'),
                docUrl: selectedModel.docUrl
            });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            geminiService.initialize(cleanKey, selectedModel.id, cleanBaseUrl);
            const result = await geminiService.testConnection();
            setTestResult({
                ...result,
                docUrl: selectedModel.docUrl
            });
        } catch (error: any) {
            let errorMessage = t('settings.errorNetwork');
            let solution = t('settings.errorNetworkSolution');
            const msg = error.message;

            if (msg === 'API_KEY_INVALID') {
                errorMessage = t('settings.errorInvalidKey');
                solution = t('settings.errorInvalidKeySolution');
            } else if (msg === 'QUOTA_EXCEEDED') {
                errorMessage = t('settings.errorQuota');
                solution = t('settings.errorQuotaSolution');
            } else if (msg === 'RATE_LIMIT') {
                errorMessage = t('settings.errorRateLimit');
                solution = t('settings.errorRateLimitSolution');
            } else if (msg === 'NETWORK_ERROR') {
                errorMessage = t('settings.errorNetwork');
                solution = t('settings.errorNetworkSolution');
            } else if (msg === 'INVALID_CHARACTERS') {
                errorMessage = t('settings.errorInvalidChars');
                solution = t('settings.errorInvalidCharsSolution');
            } else if (msg.includes('404')) {
                errorMessage = t('settings.error404');
                solution = t('settings.error404Solution');
            } else if (msg.includes('429')) { // Fallback for raw 429
                errorMessage = t('settings.errorQuota');
                solution = t('settings.errorQuotaSolution');
            } else {
                errorMessage = `${t('settings.errorUnknown')}: ${msg}`;
            }

            setTestResult({
                success: false,
                message: `${errorMessage} - ${solution}`,
                docUrl: selectedModel.docUrl
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = () => {
        const cleanKey = apiKey.trim();
        const cleanBaseUrl = baseUrl.trim();

        if (selectedModel.requiresApiKey && !cleanKey) {
            setTestResult({
                success: false,
                message: t('settings.errorInvalidKey')
            });
            return;
        }

        try {
            saveAPIConfig({
                provider,
                modelId: selectedModel.id,
                apiKey: cleanKey,
                baseUrl: cleanBaseUrl
            });
            setIsSaved(true);
            setTestResult({ success: true, message: t('settings.configSaved') });

            geminiService.initialize(cleanKey, selectedModel.id, cleanBaseUrl);

            // 标记为已配置
            localStorage.setItem('api_configured', 'true');
        } catch (error: any) {
            setTestResult({ success: false, message: error.message });
        }
    };

    const handleClear = () => {
        clearAPIConfig();
        setApiKey('');
        setBaseUrl('');
        setSelectedModel(AVAILABLE_MODELS[0]);
        setIsSaved(false);
        setTestResult(null);
        geminiService.clear();
        localStorage.removeItem('api_configured');
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{
                    maxWidth: '600px',
                    width: '90%',
                    padding: 'var(--gap-xl)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--gap-l)',
                }}>
                    <h2 style={{
                        fontSize: 'var(--fs-xl)',
                        fontWeight: 'var(--fw-bold)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--gap-s)',
                        margin: 0,
                    }}>
                        <Settings size={24} />
                        {t('settings.apiConfig')}
                    </h2>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '4px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* 模型选择 */}
                <div style={{ marginBottom: 'var(--gap-l)' }}>
                    <label style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 'var(--fw-medium)',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: 'var(--gap-s)',
                    }}>
                        {t('settings.modelSelection')}
                    </label>
                    <select
                        value={selectedModel.id}
                        onChange={(e) => handleModelChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-m)',
                            background: 'var(--bg-main)',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--fs-sm)',
                            cursor: 'pointer',
                        }}
                    >
                        {AVAILABLE_MODELS.map(model => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                                {model.isFree && ` - ${t('settings.freeTierModel')}`}
                                {!model.isFree && ` - ${t('settings.paidModel')}`}
                                {model.features?.includes('experimental') && ` (${t('settings.experimentalModel')})`}
                            </option>
                        ))}
                    </select>

                    {/* 模型特性标签 */}
                    <div style={{ display: 'flex', gap: 'var(--gap-xs)', marginTop: 'var(--gap-s)', flexWrap: 'wrap' }}>
                        {selectedModel.isFree && (
                            <span style={{
                                fontSize: 'var(--fs-xs)',
                                padding: '2px 8px',
                                background: 'rgba(0, 200, 100, 0.1)',
                                color: 'var(--primary)',
                                borderRadius: 'var(--radius-s)',
                            }}>
                                ✓ {t('settings.freeTierModel')}
                            </span>
                        )}
                        {selectedModel.rateLimit && (
                            <span style={{
                                fontSize: 'var(--fs-xs)',
                                padding: '2px 8px',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                                borderRadius: 'var(--radius-s)',
                            }}>
                                {t('settings.rateLimit')}: {selectedModel.rateLimit} {t('settings.requestsPerMinute')}
                            </span>
                        )}
                        {selectedModel.requiresApiKey ? (
                            <span style={{
                                fontSize: 'var(--fs-xs)',
                                padding: '2px 8px',
                                background: 'var(--warning)',
                                borderRadius: 'var(--radius-s)',
                            }}>
                                {t('settings.requiresApiKey')}
                            </span>
                        ) : (
                            <span style={{
                                fontSize: 'var(--fs-xs)',
                                padding: '2px 8px',
                                background: 'rgba(0, 200, 100, 0.1)',
                                color: 'var(--primary)',
                                borderRadius: 'var(--radius-s)',
                            }}>
                                {t('settings.noApiKeyRequired')}
                            </span>
                        )}
                    </div>
                </div>

                {/* API Key 输入（仅在需要时显示） */}
                {selectedModel.requiresApiKey && (
                    <>
                        <div style={{
                            background: 'var(--warning)',
                            padding: 'var(--gap-m)',
                            borderRadius: 'var(--radius-m)',
                            marginBottom: 'var(--gap-l)',
                            fontSize: 'var(--fs-sm)',
                        }}>
                            <strong>{t('settings.securityWarning')}</strong>
                            <p style={{ margin: '8px 0 0 0', lineHeight: 'var(--line-height)' }}>
                                {t('settings.securityMessage')}
                            </p>
                        </div>

                        <div style={{ marginBottom: 'var(--gap-l)' }}>
                            <label style={{
                                fontSize: 'var(--fs-sm)',
                                fontWeight: 'var(--fw-medium)',
                                color: 'var(--text-secondary)',
                                display: 'block',
                                marginBottom: 'var(--gap-s)',
                            }}>
                                API Key
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        setIsSaved(false);
                                        setTestResult(null);
                                    }}
                                    placeholder="AIzaSy..."
                                    style={{
                                        width: '100%',
                                        padding: '12px 40px 12px 12px',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-m)',
                                        background: 'var(--bg-main)',
                                        color: 'var(--text-primary)',
                                        fontSize: 'var(--fs-sm)',
                                        fontFamily: 'monospace',
                                    }}
                                />
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="btn-ghost"
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        padding: '4px'
                                    }}
                                >
                                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {isSaved && <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--primary)', marginTop: 'var(--gap-xs)' }}>
                                ✓ {t('settings.saved')}: {maskAPIKey(apiKey)}
                            </p>}
                        </div>

                        {/* Base URL 设置 (可选) */}
                        <div style={{ marginBottom: 'var(--gap-l)' }}>
                            <label style={{
                                fontSize: 'var(--fs-sm)',
                                fontWeight: 'var(--fw-medium)',
                                color: 'var(--text-secondary)',
                                display: 'block',
                                marginBottom: 'var(--gap-s)',
                            }}>
                                {t('settings.baseUrl')} <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: 'var(--fs-xs)' }}>({t('settings.optional')})</span>
                            </label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => {
                                    setBaseUrl(e.target.value);
                                    setIsSaved(false);
                                    setTestResult(null);
                                }}
                                placeholder={t('settings.baseUrlPlaceholder')}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-m)',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-primary)',
                                    fontSize: 'var(--fs-sm)',
                                    fontFamily: 'monospace',
                                }}
                            />
                            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {t('settings.baseUrlHint')}
                            </p>
                        </div>
                    </>
                )}

                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: 'var(--gap-m)', marginBottom: 'var(--gap-l)' }}>
                    <button
                        onClick={handleTestConnection}
                        disabled={isTesting || (selectedModel.requiresApiKey && !apiKey)}
                        className="btn-secondary"
                        style={{ flex: 1 }}
                    >
                        {isTesting ? <><Loader size={16} className="spin" /> {t('settings.testing')}</> : t('settings.testConnection')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={(selectedModel.requiresApiKey && !apiKey) || isSaved}
                        className="btn-primary"
                        style={{ flex: 1 }}
                    >
                        {isSaved ? t('settings.saved') : t('settings.save')}
                    </button>
                    <button onClick={handleClear} disabled={!isSaved} className="btn-secondary">
                        {t('settings.clear')}
                    </button>
                </div>

                {/* 结果显示 */}
                {testResult && (
                    <div style={{
                        padding: 'var(--gap-m)',
                        borderRadius: 'var(--radius-m)',
                        background: testResult.success ? 'rgba(0, 200, 100, 0.1)' : 'var(--warning)',
                        border: `1px solid ${testResult.success ? 'var(--primary)' : 'transparent'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--gap-s)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--gap-s)' }}>
                            {testResult.success ? <Check size={20} color="var(--primary)" /> : <X size={20} />}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-medium)' }}>
                                    {testResult.success ? t('settings.connectionSuccess') : t('settings.errorTitle')}
                                </div>
                                <div style={{ fontSize: 'var(--fs-xs)', marginTop: '4px' }}>{testResult.message}</div>
                            </div>
                        </div>
                        {testResult.docUrl && !testResult.success && (
                            <a
                                href={testResult.docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--gap-xs)',
                                    fontSize: 'var(--fs-xs)',
                                    color: 'var(--primary)',
                                    textDecoration: 'none',
                                }}
                            >
                                <ExternalLink size={14} />
                                {t('settings.viewDocumentation')}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
