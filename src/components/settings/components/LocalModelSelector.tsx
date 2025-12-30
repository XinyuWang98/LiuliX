/**
 * 本地模型选择组件
 * 从 Ollama API 获取已安装的模型列表，让用户选择
 */

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/utils/logger';
import { Download, RefreshCw, CheckCircle, AlertCircle, Loader, ChevronDown } from 'lucide-react';

interface OllamaModel {
    name: string;
    size: number;
    modifiedAt: string;
}

interface ModelListResponse {
    available: boolean;
    models: OllamaModel[];
    currentModel: string | null;
    error?: string;
}

// 推荐模型列表（基于测试结果排序）
// 推荐模型列表移至组件内以支持国际化

interface LocalModelSelectorProps {
    currentModel: string;
    onModelChange: (modelId: string) => void;
    disabled?: boolean;
}

export const LocalModelSelector: React.FC<LocalModelSelectorProps> = ({
    currentModel,
    onModelChange,
    disabled = false,
}) => {
    const { t } = useI18n();
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customModel, setCustomModel] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Dynamic descriptions for recommended models based on locale
    const getRecommendedModels = () => [
        {
            id: 'qwen2.5-coder:7b',
            name: 'Qwen2.5-Coder 7B ⭐',
            desc: t('settings.qwen7bDesc'),
            quality: 4,
            minRAM: 16
        },
        {
            id: 'qwen2.5-coder:14b',
            name: 'Qwen2.5-Coder 14B',
            desc: t('settings.qwen14bDesc'),
            quality: 5,
            minRAM: 32
        },
        {
            id: 'qwen2.5-coder:3b',
            name: 'Qwen2.5-Coder 3B',
            desc: t('settings.qwen3bDesc'),
            quality: 1,
            minRAM: 4
        },
        {
            id: 'qwen2.5:7b',
            name: 'Qwen2.5 7B',
            desc: t('settings.qwenGeneralDesc'),
            quality: 3,
            minRAM: 16
        },
    ];

    const recommendedList = getRecommendedModels();

    // 获取已安装的模型列表
    const fetchModels = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/model/list');
            const data: ModelListResponse = await response.json();

            setOllamaAvailable(data.available);
            if (data.available) {
                setModels(data.models);
                logger.log('AI服务', `发现 ${data.models.length} 个已安装模型`);
            } else {
                setError(data.error || t('settings.ollamaNotRunning'));
            }
        } catch (err) {
            setOllamaAvailable(false);
            setError(t('settings.connectionError'));
            logger.error('AI服务', '获取模型列表失败', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    // 格式化模型大小
    const formatSize = (bytes: number) => {
        if (!bytes) return '';
        const gb = bytes / (1024 * 1024 * 1024);
        return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    };

    // 下载状态
    const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<string>('');

    // 下载模型
    const downloadModel = async (modelId: string) => {
        setDownloadingModel(modelId);
        setDownloadProgress(t('settings.downloading'));

        try {
            logger.log('本地模型', `开始下载模型: ${modelId}`);

            const response = await fetch('http://localhost:3001/api/model/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: modelId })
            });

            if (!response.ok) {
                throw new Error('下载请求失败');
            }

            const result = await response.json();

            if (result.success) {
                setDownloadProgress(t('settings.downloadSuccess'));
                logger.log('本地模型', `模型下载成功: ${modelId}`);

                // 刷新模型列表
                setTimeout(() => {
                    fetchModels();
                    setDownloadingModel(null);
                    setDownloadProgress('');
                    // 自动选择刚下载的模型
                    handleModelSelect(modelId);
                }, 1500);
            } else {
                throw new Error(result.error || t('settings.downloadFailed'));
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : t('settings.downloadFailed');
            setDownloadProgress(t('settings.downloadFailed')); // Simplified for i18n compliance
            logger.error('本地模型', `模型下载失败: ${modelId}`, err);

            setTimeout(() => {
                setDownloadingModel(null);
                setDownloadProgress('');
            }, 3000);
        }
    };

    // 处理模型选择
    const handleModelSelect = (modelId: string) => {
        if (modelId === '_custom') {
            setShowCustomInput(true);
        } else {
            onModelChange(modelId);
            localStorage.setItem('ollama_model', modelId);
        }
    };

    // 处理自定义模型提交
    const handleCustomSubmit = () => {
        if (customModel.trim()) {
            onModelChange(customModel.trim());
            localStorage.setItem('ollama_model', customModel.trim());
            setShowCustomInput(false);
        }
    };

    // 渲染连接状态
    const renderConnectionStatus = () => {
        if (isLoading) {
            return (
                <div className="ollama-status checking">
                    <Loader size={16} className="spinning" />
                    <span>{t('settings.ollamaChecking')}</span>
                </div>
            );
        }

        if (ollamaAvailable === false) {
            return (
                <div className="ollama-status offline">
                    <AlertCircle size={16} />
                    <span>{t('settings.ollamaNotRunning')}</span>
                    <a
                        href="https://ollama.com/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ollama-download-link"
                    >
                        <Download size={14} />
                        {t('settings.ollamaDownload')}
                    </a>
                </div>
            );
        }

        return (
            <div className="ollama-status online">
                <CheckCircle size={16} />
                <span>{t('settings.ollamaConnected', { count: models.length })}</span>
                <button
                    onClick={fetchModels}
                    className="ollama-refresh-btn"
                    title={t('settings.ollamaRefresh')}
                >
                    <RefreshCw size={14} />
                </button>
            </div>
        );
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 获取当前选中模型的显示名称
    const getSelectedModelDisplay = () => {
        const installed = models.find(m => m.name === currentModel);
        if (installed) {
            return `${installed.name} (${formatSize(installed.size)})`;
        }
        const recommended = recommendedList.find(rm => rm.id === currentModel);
        if (recommended) {
            return `${recommended.name}`;
        }
        return currentModel || t('settings.modelSelection');
    };

    return (
        <div className="local-model-selector">
            {/* 连接状态 */}
            {renderConnectionStatus()}

            {/* 自定义下拉菜单 */}
            {ollamaAvailable && (
                <div className="model-dropdown-wrapper" ref={dropdownRef}>
                    <button
                        className={`model-dropdown-trigger ${isDropdownOpen ? 'open' : ''}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={disabled || isLoading}
                    >
                        <span className="model-dropdown-value">{getSelectedModelDisplay()}</span>
                        <ChevronDown size={16} className={`model-dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="model-dropdown-menu">
                            {/* 已安装模型 */}
                            {models.length > 0 && (
                                <div className="model-dropdown-group">
                                    <div className="model-dropdown-group-label">{t('settings.installedModels')}</div>
                                    {models.map(m => (
                                        <button
                                            key={m.name}
                                            className={`model-dropdown-item ${currentModel === m.name ? 'selected' : ''}`}
                                            onClick={() => {
                                                handleModelSelect(m.name);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            <CheckCircle size={14} className={`model-check ${currentModel === m.name ? 'visible' : ''}`} />
                                            <span className="model-name">{m.name}</span>
                                            <span className="model-size">{formatSize(m.size)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 推荐模型 */}
                            <div className="model-dropdown-group">
                                <div className="model-dropdown-group-label">{t('settings.recommendedModels')}</div>
                                {recommendedList.filter(rm => !models.some(m => m.name.startsWith(rm.id))).map(rm => (
                                    <button
                                        key={rm.id}
                                        className={`model-dropdown-item ${downloadingModel === rm.id ? 'downloading' : ''}`}
                                        onClick={() => {
                                            downloadModel(rm.id);
                                            setIsDropdownOpen(false);
                                        }}
                                        disabled={downloadingModel !== null}
                                    >
                                        {downloadingModel === rm.id ? (
                                            <Loader size={14} className="spinning" />
                                        ) : (
                                            <Download size={14} className="model-download-icon" />
                                        )}
                                        <span className="model-name">{rm.name}</span>
                                        <span className="model-desc">{rm.desc}</span>
                                    </button>
                                ))}
                            </div>

                            {/* 自定义 */}
                            <div className="model-dropdown-group">
                                <button
                                    className="model-dropdown-item"
                                    onClick={() => {
                                        setShowCustomInput(true);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <span className="model-name">{t('settings.customModel')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            {/* 自定义模型输入 */}
            {
                showCustomInput && (
                    <div className="custom-model-input">
                        <input
                            type="text"
                            placeholder={t('settings.customModelPlaceholder')}
                            value={customModel}
                            onChange={(e) => setCustomModel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                        />
                        <button onClick={handleCustomSubmit}>{t('settings.save')}</button>
                        <button onClick={() => setShowCustomInput(false)}>{t('settings.clear')}</button>
                    </div>
                )
            }

            {/* 下载进度提示 */}
            {downloadingModel && downloadProgress && (
                <div className="model-download-progress">
                    <Loader size={16} className="spinning" />
                    <span>{downloadProgress}</span>
                </div>
            )}

            {/* 使用提示 */}
            {
                ollamaAvailable && models.length === 0 && (
                    <div className="model-tip">
                        {t('settings.selectModelTip')}
                    </div>
                )
            }

            {/* 错误信息 */}
            {
                error && !isLoading && (
                    <div className="model-error">
                        {error}
                    </div>
                )
            }
        </div >
    );
};

export default LocalModelSelector;
