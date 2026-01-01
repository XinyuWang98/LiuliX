import React, { useState, useEffect } from 'react';
import { UserPrompt } from '@/types/prompt';
import { useI18n } from '@/contexts/I18nContext';
import { X, Copy, Check, Terminal, FileJson, Database, Medal, Flame } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // 使用 Dark 主题
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import './PromptDetailModal.css';

interface PromptDetailModalProps {
    prompt: UserPrompt | null;
    open: boolean;
    onClose: () => void;
}

type TabType = 'python' | 'sql' | 'json';

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({ prompt, open, onClose }) => {
    const { t, formatDate } = useI18n();
    const [activeTab, setActiveTab] = useState<TabType>('python');
    const [copied, setCopied] = useState(false);

    // Reset tab when prompt changes
    useEffect(() => {
        if (open) {
            setActiveTab('python');
        }
    }, [open, prompt]);

    // Syntax highlighting
    useEffect(() => {
        if (open) {
            Prism.highlightAll();
        }
    }, [open, activeTab, prompt]);

    // Determine available tabs safely
    const hasPython = !!prompt?.codeTemplate;
    const hasSql = !!prompt?.sqlTemplate;

    // Auto-select tab if python is missing (though unlikely for L2)
    useEffect(() => {
        if (!prompt) return;
        if (!hasPython && hasSql && activeTab === 'python') setActiveTab('sql');
        else if (!hasPython && !hasSql && activeTab !== 'json') setActiveTab('json');
    }, [hasPython, hasSql, activeTab, prompt]);


    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!open || !prompt) return null;

    const getCodeContent = () => {
        switch (activeTab) {
            case 'python':
                return prompt.codeTemplate || t('prompt.detail.noPython');
            case 'sql':
                return prompt.sqlTemplate || t('prompt.detail.noSql');
            case 'json':
                // Hide technical internal fields if needed, but for now show all except maybe huge raw data if any
                return JSON.stringify(prompt, null, 2);
            default:
                return '';
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getCodeContent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="prompt-detail-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="prompt-detail-modal">
                {/* Header */}
                <div className="prompt-detail-header">
                    <div className="prompt-detail-title-group">
                        <span className="prompt-detail-title">{prompt.title}</span>
                        {prompt.isOfficial && (
                            <div className="official-badge small">
                                <Medal size={12} />
                                OFFICIAL
                            </div>
                        )}
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body Split */}
                <div className="prompt-detail-body">
                    {/* Left: Meta Info */}
                    <div className="detail-left-col">
                        <div className="meta-section">
                            <div className="meta-section-title">{t('prompt.detail.description')}</div>
                            <div className="meta-description">{prompt.description}</div>
                        </div>

                        <div className="meta-section">
                            <div className="meta-section-title">{t('prompt.detail.tags')}</div>
                            <div className="meta-tags">
                                {prompt.dimensions.map((dim, idx) => (
                                    <span key={idx} className="meta-tag">{dim.label || dim.value}</span>
                                ))}
                            </div>
                        </div>

                        <div className="meta-section">
                            <div className="meta-section-title">{t('prompt.detail.inputVariables')}</div>
                            <div className="meta-tags">
                                {prompt.inputVariables.map((v, idx) => (
                                    <code key={idx} className="meta-tag" style={{ fontFamily: 'monospace' }}>{v}</code>
                                ))}
                            </div>
                        </div>

                        <div className="meta-section spacer-top">
                            <div className="meta-section-title">{t('prompt.detail.info')}</div>
                            <div className="meta-list">
                                <div className="meta-kv">
                                    <span className="meta-key">{t('prompt.detail.author')}</span>
                                    <span className="meta-value">{prompt.author}</span>
                                </div>
                                <div className="meta-kv">
                                    <span className="meta-key">{t('prompt.detail.version')}</span>
                                    <span className="meta-value">{prompt.version}</span>
                                </div>
                                <div className="meta-kv">
                                    <span className="meta-key">{t('prompt.detail.updated')}</span>
                                    <span className="meta-value">{formatDate(prompt.updatedAt)}</span>
                                </div>
                                {prompt.usageCount !== undefined && (
                                    <div className="meta-kv">
                                        <span className="meta-key">Usage</span>
                                        <span className="meta-value usage-value">
                                            <Flame size={12} color="var(--warning)" />
                                            {prompt.usageCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Code */}
                    <div className="detail-right-col">
                        <div className="code-tabs">
                            {hasPython && (
                                <div
                                    className={`code-tab ${activeTab === 'python' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('python')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Terminal size={14} />
                                        Python
                                    </div>
                                </div>
                            )}
                            {hasSql && (
                                <div
                                    className={`code-tab ${activeTab === 'sql' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('sql')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Database size={14} />
                                        SQL
                                    </div>
                                </div>
                            )}
                            <div
                                className={`code-tab ${activeTab === 'json' ? 'active' : ''}`}
                                onClick={() => setActiveTab('json')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FileJson size={14} />
                                    JSON Source
                                </div>
                            </div>
                        </div>

                        <div className="code-content">
                            <button className="copy-btn" onClick={handleCopy}>
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? t('prompt.detail.copied') : t('prompt.detail.copyCode')}
                            </button>

                            <div className="code-block-wrapper">
                                <pre className={`language-${activeTab}`}>
                                    <code>{getCodeContent()}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
