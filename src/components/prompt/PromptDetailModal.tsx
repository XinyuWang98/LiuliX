import React, { useState, useEffect } from 'react';
import { UserPrompt } from '@/types/prompt';
import { useI18n } from '@/contexts/I18nContext';
import { X, Terminal, FileJson, Database, Medal, Flame } from 'lucide-react';
import { CodeBlock } from '@/components/common/CodeBlock';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
import { LiuliTag } from '@/components/common/liulix/LiuliTag';
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

    // Reset tab when prompt changes
    useEffect(() => {
        if (open) {
            setActiveTab('python');
        }
    }, [open, prompt]);

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

    return (
        <div className="prompt-detail-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <LiuliGlass
                className="prompt-detail-modal"
                variant="vignette"
                blur="ultra"
                padding="none" // Custom padding layout
            >
                {/* Header */}
                <div className="prompt-detail-header">
                    <div className="prompt-detail-title-group">
                        <span className="prompt-detail-title">{prompt.title}</span>
                        {prompt.isOfficial && (
                            <div className="official-badge small" title={t('prompt.detail.officialTitle')}>
                                <Medal size={14} color="var(--primary)" />
                                <span>{t('prompt.card.official').toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                    <LiuliButton variant="ghost" size="icon" onClick={onClose}>
                        <X size={20} />
                    </LiuliButton>
                </div>

                {/* Body Split */}
                <div className="prompt-detail-body">
                    {/* Left: Meta Info */}
                    <div className="detail-left-col">
                        <div className="meta-scroll-container">
                            <div className="meta-section">
                                <div className="meta-section-title">{t('prompt.detail.description')}</div>
                                <div className="meta-description">{prompt.description}</div>
                            </div>

                            <div className="meta-section">
                                <div className="meta-section-title">{t('prompt.detail.tags')}</div>
                                <div className="meta-tags">
                                    {prompt.dimensions.map((dim, idx) => (
                                        <LiuliTag key={idx} variant="neutral" className="meta-tag">
                                            {dim.label || dim.value}
                                        </LiuliTag>
                                    ))}
                                </div>
                            </div>

                            <div className="meta-section">
                                <div className="meta-section-title">{t('prompt.detail.inputVariables')}</div>
                                <div className="meta-tags">
                                    {prompt.inputVariables.map((v, idx) => (
                                        <code key={idx} className="variable-tag">{v}</code>
                                    ))}
                                </div>
                            </div>

                            <div className="meta-section spacer-top">
                                <div className="meta-section-title">{t('prompt.detail.info')}</div>
                                <div className="meta-list">
                                    <div className="meta-kv">
                                        <span className="meta-key">{t('prompt.detail.id')}</span>
                                        <span className="meta-value">{prompt.id}</span>
                                    </div>
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
                                            <span className="meta-key">{t('prompt.detail.usage')}</span>
                                            <span className="meta-value usage-value">
                                                <Flame size={12} color="var(--warning)" />
                                                {prompt.usageCount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Code */}
                    <div className="detail-right-col">
                        <div className="code-tabs">
                            {hasPython && (
                                <button
                                    className={`code-tab ${activeTab === 'python' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('python')}
                                >
                                    <Terminal size={14} />
                                    {t('prompt.detail.python')}
                                </button>
                            )}
                            {hasSql && (
                                <button
                                    className={`code-tab ${activeTab === 'sql' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('sql')}
                                >
                                    <Database size={14} />
                                    {t('prompt.detail.sql')}
                                </button>
                            )}
                            <button
                                className={`code-tab ${activeTab === 'json' ? 'active' : ''}`}
                                onClick={() => setActiveTab('json')}
                            >
                                <FileJson size={14} />
                                {t('prompt.detail.sourceJson')}
                            </button>
                        </div>

                        <div className="code-content">
                            {activeTab === 'python' && prompt.codeTemplate && (
                                <CodeBlock
                                    code={prompt.codeTemplate}
                                    language="python"
                                    formatted={true}
                                    copyable={true}
                                    className="liuli-code-block"
                                />
                            )}
                            {activeTab === 'sql' && prompt.sqlTemplate && (
                                <CodeBlock
                                    code={prompt.sqlTemplate}
                                    language="sql"
                                    formatted={true}
                                    copyable={true}
                                    className="liuli-code-block"
                                />
                            )}
                            {activeTab === 'json' && (
                                <CodeBlock
                                    code={JSON.stringify(prompt, null, 2)}
                                    language="json"
                                    formatted={false}
                                    copyable={true}
                                    className="liuli-code-block"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </LiuliGlass>
        </div>
    );
};
