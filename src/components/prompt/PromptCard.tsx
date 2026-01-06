import React from 'react';
import { UserPrompt } from '@/types/prompt';
import { useI18n } from '@/contexts/I18nContext';
import { Flame, Medal, Calendar } from 'lucide-react';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliTag } from '@/components/common/liulix/LiuliTag';
import './PromptCard.css';

interface PromptCardProps {
    prompt: UserPrompt;
    onClick: () => void;
    featured?: boolean;
}

const getTagVariant = (label: string): 'neutral' | 'primary' | 'success' | 'warning' | 'danger' => {
    // Simple semantic mapping based on keywords
    if (['Cleaning', '清洗', 'Dedup', 'Fill', 'Standardize'].some(k => label.includes(k))) return 'primary';
    if (['Analysis', '分析', 'Explore', 'Insight', 'Trend'].some(k => label.includes(k))) return 'warning';
    if (['Visualization', '可视化', 'Chart', 'Plot'].some(k => label.includes(k))) return 'success';
    return 'neutral';
};

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onClick, featured }) => {
    const { t, formatDate } = useI18n();

    return (
        <LiuliGlass
            className={`prompt-card-glass ${featured ? 'featured' : ''}`}
            interactive
            onClick={onClick}
            padding="medium"
        >
            <div className="prompt-card-header">
                <div className="prompt-card-title">
                    {prompt.isOfficial && (
                        <div className="official-badge" title={t('prompt.library.card.official')}>
                            <Medal size={12} color="var(--primary)" />
                        </div>
                    )}
                    <span className="title-text">{prompt.title}</span>
                </div>
            </div>

            <div className="prompt-card-description">
                {prompt.description}
            </div>

            <div className="prompt-card-footer">
                <div className="prompt-card-tags">
                    {prompt.dimensions.slice(0, 3).map((dim, idx) => (
                        <LiuliTag key={idx} variant={getTagVariant(dim.label || dim.value)} className="prompt-dim-tag">
                            {dim.label || dim.value}
                        </LiuliTag>
                    ))}
                    {prompt.dimensions.length > 3 && (
                        <LiuliTag variant="neutral" className="prompt-dim-tag">
                            +{prompt.dimensions.length - 3}
                        </LiuliTag>
                    )}
                </div>

                <div className="prompt-card-meta-group">
                    {prompt.usageCount !== undefined && prompt.usageCount > 0 && (
                        <div className="prompt-usage-badge" title={t('prompt.library.card.usageTooltip')}>
                            <Flame size={12} color="var(--warning)" />
                            <span className="usage-count">
                                {prompt.usageCount > 1000 ? `${(prompt.usageCount / 1000).toFixed(1)}k` : prompt.usageCount}
                            </span>
                        </div>
                    )}
                    <div className="prompt-date-badge" title={`${t('prompt.detail.updated')}: ${formatDate(prompt.updatedAt)}`}>
                        <Calendar size={12} color="var(--text-tertiary)" />
                        <span>{new Date(prompt.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </LiuliGlass>
    );
};
