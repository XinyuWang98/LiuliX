import React from 'react';
import { UserPrompt } from '@/types/prompt';
import { useI18n } from '@/contexts/I18nContext';
import { Flame, Medal, Calendar, Eye } from 'lucide-react';
import './PromptCard.css';

interface PromptCardProps {
    prompt: UserPrompt;
    onClick: () => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onClick }) => {
    const { t, formatDate } = useI18n();

    return (
        <div className="prompt-card" onClick={onClick}>
            <div className="prompt-card-header">
                <div className="prompt-card-title">
                    {prompt.isOfficial && (
                        <div className="official-badge" title={t('prompt.library.card.official')}>
                            <Medal size={10} />
                            OFFICIAL
                        </div>
                    )}
                    {prompt.title}
                </div>
            </div>

            <div className="prompt-card-description">
                {prompt.description}
            </div>

            <div className="prompt-card-footer">
                <div className="prompt-card-tags">
                    {prompt.dimensions.slice(0, 3).map((dim, idx) => (
                        <span key={idx} className="prompt-tag">
                            {dim.label || dim.value}
                        </span>
                    ))}
                    {prompt.dimensions.length > 3 && (
                        <span className="prompt-tag">+{prompt.dimensions.length - 3}</span>
                    )}
                </div>

                <div className="prompt-card-meta-group">
                    {prompt.usageCount !== undefined && prompt.usageCount > 0 && (
                        <div className="prompt-usage" title={t('prompt.library.card.usageTooltip')}>
                            <Flame size={12} color="var(--warning)" />
                            {prompt.usageCount > 1000 ? `${(prompt.usageCount / 1000).toFixed(1)}k` : prompt.usageCount}
                        </div>
                    )}
                    <div className="prompt-usage" title={`${t('prompt.detail.updated')}: ${formatDate(prompt.updatedAt)}`}>
                        <Calendar size={12} />
                        {new Date(prompt.updatedAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
    );
};
