/**
 * 本地模型选择组件
 * 从 Ollama API 获取已安装的模型列表，让用户选择
 */

import React, { useState, useEffect } from 'react';
// import { useI18n } from '@/contexts/I18nContext'; // TODO: 后续国际化时启用
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
const RECOMMENDED_MODELS = [
    {
        id: 'qwen2.5-coder:7b',
        name: 'Qwen2.5-Coder 7B ⭐',
        desc: '推荐！代码/SQL专用，质量优秀，需16GB+内存',
        quality: 4,
        minRAM: 16
    },
    {
        id: 'qwen2.5-coder:14b',
        name: 'Qwen2.5-Coder 14B',
        desc: '顶配专业模型，需32GB+内存',
        quality: 5,
        minRAM: 32
    },
    {
        id: 'qwen2.5-coder:3b',
        name: 'Qwen2.5-Coder 3B',
        desc: '⚠️ 不推荐（质量未达标，仅测试用）',
        quality: 1,
        minRAM: 4
    },
    {
        id: 'qwen2.5:7b',
        name: 'Qwen2.5 7B',
        desc: '通用对话模型',
        quality: 3,
        minRAM: 16
    },
];

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
    // TODO: 后续国际化时使用 const { t } = useI18n();
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customModel, setCustomModel] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

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
                setError(data.error || 'Ollama 服务未运行');
            }
        } catch (err) {
            setOllamaAvailable(false);
            setError('无法连接到后端服务');
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
        setDownloadProgress('准备下载...');

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
                setDownloadProgress('下载成功！');
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
                throw new Error(result.error || '下载失败');
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : '下载失败';
            setDownloadProgress(`❌ ${errorMsg}`);
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
                    <span>检测 Ollama 服务...</span>
                </div>
            );
        }

        if (ollamaAvailable === false) {
            return (
                <div className="ollama-status offline">
                    <AlertCircle size={16} />
                    <span>Ollama 未运行</span>
                    <a
                        href="https://ollama.com/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ollama-download-link"
                    >
                        <Download size={14} />
                        下载安装
                    </a>
                </div>
            );
        }

        return (
            <div className="ollama-status online">
                <CheckCircle size={16} />
                <span>Ollama 已连接 ({models.length} 个模型)</span>
                <button
                    onClick={fetchModels}
                    className="ollama-refresh-btn"
                    title="刷新模型列表"
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
        const recommended = RECOMMENDED_MODELS.find(rm => rm.id === currentModel);
        if (recommended) {
            return `${recommended.name}`;
        }
        return currentModel || '选择模型...';
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
                                    <div className="model-dropdown-group-label">已安装模型</div>
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
                                <div className="model-dropdown-group-label">推荐模型 (点击下载)</div>
                                {RECOMMENDED_MODELS.filter(rm => !models.some(m => m.name.startsWith(rm.id))).map(rm => (
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
                                    <span className="model-name">✏️ 自定义模型...</span>
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
                            placeholder="输入 Ollama 模型标签，如 llama3:8b"
                            value={customModel}
                            onChange={(e) => setCustomModel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                        />
                        <button onClick={handleCustomSubmit}>确认</button>
                        <button onClick={() => setShowCustomInput(false)}>取消</button>
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
                        💡 请在上方推荐模型中选择并下载模型
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
