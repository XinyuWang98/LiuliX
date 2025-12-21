import { useState, useEffect, useRef } from 'react';
import { askAI, AIModel } from '../services/aiService';
import { X, GripVertical, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { localLLMService, SUPPORTED_MODELS } from '../services/localLLMService';

interface AIConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MODEL_NAMES: Record<AIModel, string> = {
    gemini: 'Gemini 2.5 Flash',
    grok: 'Grok Beta',
    claude: 'Claude 3.5 Sonnet',
    deepseek: 'DeepSeek Chat'
};

export const AIConfigModal = ({ isOpen, onClose }: AIConfigModalProps) => {
    const { t } = useI18n();

    // Priority State
    const [priority, setPriority] = useState<AIModel[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('ai_priority') || '["gemini","grok","claude","deepseek"]');
        } catch {
            return ['gemini', 'grok', 'claude', 'deepseek'];
        }
    });

    // Keys State
    const [keys, setKeys] = useState<Record<string, string>>({});

    // Test Status State
    const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
    const [testMsg, setTestMsg] = useState<Record<string, string>>({});

    // 本地模型状态
    const [useLocalModel, setUseLocalModel] = useState(() => {
        return localStorage.getItem('use_local_model') === 'true';
    });

    // DnD State
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Initialize keys from sessionStorage on mount
    useEffect(() => {
        const newKeys: Record<string, string> = {};
        const models: AIModel[] = ['gemini', 'grok', 'claude', 'deepseek'];
        models.forEach(m => {
            newKeys[m] = sessionStorage.getItem(`${m}_key`) || '';
        });
        setKeys(newKeys);
    }, [isOpen]);

    // Save priority when changed
    useEffect(() => {
        localStorage.setItem('ai_priority', JSON.stringify(priority));
    }, [priority]);

    // 保存本地模型设置
    useEffect(() => {
        localStorage.setItem('use_local_model', useLocalModel.toString());
    }, [useLocalModel]);

    const handleKeyChange = (model: string, val: string) => {
        sessionStorage.setItem(`${model}_key`, val);
        setKeys(prev => ({ ...prev, [model]: val }));
    };

    const handleTest = async (model: AIModel) => {
        if (!keys[model]) {
            setTestStatus(prev => ({ ...prev, [model]: 'error' }));
            setTestMsg(prev => ({ ...prev, [model]: t('settings.requiresApiKey') }));
            return;
        }

        setTestStatus(prev => ({ ...prev, [model]: 'loading' }));
        setTestMsg(prev => ({ ...prev, [model]: '' }));

        try {
            // Using askAI with modelHint to specific model for testing
            await askAI('Hello', { modelHint: model, t: t });
            setTestStatus(prev => ({ ...prev, [model]: 'success' }));
        } catch (err: any) {
            setTestStatus(prev => ({ ...prev, [model]: 'error' }));
            setTestMsg(prev => ({ ...prev, [model]: err.message || t('settings.errorTitle') }));
        }
    };

    // Drag and Drop Handlers
    const onDragStart = (_e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
    };

    const onDragEnter = (_e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
    };

    const onDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const copy_priority = [...priority];
            const dragItemContent = copy_priority[dragItem.current];
            copy_priority.splice(dragItem.current, 1);
            copy_priority.splice(dragOverItem.current, 0, dragItemContent);
            setPriority(copy_priority);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--modal-backdrop, rgba(0, 0, 0, 0.6))',
            backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                width: '600px',
                maxHeight: '80vh',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <h2 style={{
                        marginTop: 0,
                        marginBottom: 0,
                        fontSize: '20px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(to right, #60a5fa, #c084fc)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {t('settings.apiConfig')}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary, #9ca3af)',
                            borderRadius: '50%',
                            transition: 'background-color 0.2s',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* 本地模型开关 */}
                    <div style={{
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '16px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div>
                                <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    启用本地模型 (推荐)
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    首次下载 4.3GB 模型，约 10-30 分钟，之后永久离线可用
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                <input
                                    type="checkbox"
                                    checked={useLocalModel}
                                    onChange={(e) => setUseLocalModel(e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: useLocalModel ? 'var(--success)' : 'var(--bg-hover)',
                                    transition: '0.3s',
                                    borderRadius: '24px',
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '',
                                        height: '18px',
                                        width: '18px',
                                        left: useLocalModel ? '23px' : '3px',
                                        bottom: '3px',
                                        backgroundColor: 'white',
                                        transition: '0.3s',
                                        borderRadius: '50%',
                                    }} />
                                </span>
                            </label>
                        </div>
                        {useLocalModel && (
                            <div style={{
                                fontSize: '12px',
                                color: 'var(--primary)',
                                marginTop: '8px',
                                padding: '8px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '4px',
                            }}>
                                💡 模型: {SUPPORTED_MODELS.QWEN} (中文强，速度快)
                            </div>
                        )}
                    </div>

                    <div style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary, #9ca3af)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        padding: '16px',
                        borderRadius: '8px',
                    }}>
                        {t('settings.priorityHint')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {priority.map((model, index) => (
                            <div
                                key={model}
                                draggable
                                onDragStart={(e) => onDragStart(e, index)}
                                onDragEnter={(e) => onDragEnter(e, index)}
                                onDragEnd={onDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className="group"
                                style={{
                                    backgroundColor: 'var(--bg-main, #25262b)',
                                    border: '1px solid var(--border-color, rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                    {/* Drag Handle */}
                                    <div style={{
                                        marginTop: '12px',
                                        cursor: 'grab',
                                        color: '#4b5563'
                                    }}>
                                        <GripVertical size={20} />
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 500, color: 'var(--text-primary, #e5e7eb)' }}>
                                                {MODEL_NAMES[model]}
                                            </span>
                                            <div style={{
                                                fontSize: '12px',
                                                color: 'var(--text-secondary, #6b7280)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                {t('language.priority')} {index + 1}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="password"
                                                placeholder={t('settings.keyPlaceholder', { model: MODEL_NAMES[model] })}
                                                value={keys[model] || ''}
                                                onChange={(e) => handleKeyChange(model, e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'var(--input-bg)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '4px',
                                                    padding: '8px 12px',
                                                    fontSize: '14px',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                }}
                                            />
                                            <button
                                                onClick={() => handleTest(model)}
                                                disabled={testStatus[model] === 'loading'}
                                                title={t('settings.testConnection')}
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '4px',
                                                    color: '#d1d5db',
                                                    cursor: testStatus[model] === 'loading' ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: testStatus[model] === 'loading' ? 0.5 : 1,
                                                }}
                                            >
                                                {testStatus[model] === 'loading' ? (
                                                    <div style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        border: '2px solid currentColor',
                                                        borderTopColor: 'transparent',
                                                        borderRadius: '50%',
                                                    }} />
                                                ) : (
                                                    <Play size={16} />
                                                )}
                                            </button>
                                        </div>

                                        {/* Status Message */}
                                        {testStatus[model] && testStatus[model] !== 'idle' && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '12px',
                                                color: testStatus[model] === 'success' ? '#4ade80' :
                                                    testStatus[model] === 'error' ? '#f87171' : '#9ca3af'
                                            }}>
                                                {testStatus[model] === 'success' ? <CheckCircle size={14} /> :
                                                    testStatus[model] === 'error' ? <AlertCircle size={14} /> : null}
                                                {testStatus[model] === 'success' ? t('settings.connectionSuccessShort') : testMsg[model]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '24px',
                    borderTop: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                    display: 'flex',
                    justifyContent: 'flex-end',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 24px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            borderRadius: '8px',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)',
                            transition: 'background-color 0.2s',
                        }}
                    >
                        {t('settings.settingComplete')}
                    </button>
                </div>
            </div>
        </div>
    );
};
