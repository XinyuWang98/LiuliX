import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { promptRegistry } from '@/services/promptRegistry';
import { UserPrompt, PromptFilter } from '@/types/prompt';
import { LibrarySidebar } from '@/components/prompt/LibrarySidebar';
import { PromptCard } from '@/components/prompt/PromptCard';
import { PromptDetailModal } from '@/components/prompt/PromptDetailModal';
import { Search, Flame } from 'lucide-react';
import { AscensionBackground } from '@/components/common/liulix/AscensionBackground';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliInput } from '@/components/common/liulix/LiuliInput';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
import './PromptLibrary.css';

interface PromptLibraryProps {
    activeView: 'dashboard' | 'library';
    onNavigate: (view: 'dashboard' | 'library') => void;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ activeView: _activeView, onNavigate: _onNavigate }) => {
    const { t } = useI18n();
    const [filter, setFilter] = useState<PromptFilter>({});
    const [selectedPrompt, setSelectedPrompt] = useState<UserPrompt | null>(null);

    // Filter prompts (sorted by usage desc by default)
    const prompts = promptRegistry.listPrompts(filter);

    // Top Prompts (Top 4)
    // Only show if we are in 'All' view (no specific tag filter)
    const showTopPrompts = !filter.tagCategory && !filter.tagValue && !filter.search;
    const topPrompts = showTopPrompts ? prompts.slice(0, 4) : [];
    const otherPrompts = showTopPrompts ? prompts.slice(4) : prompts;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilter(prev => ({ ...prev, search: e.target.value }));
    };

    const handlePromptClick = (prompt: UserPrompt) => {
        setSelectedPrompt(prompt);
    };

    return (
        <div className="prompt-library-page">
            <AscensionBackground />

            <div className="prompt-library-layout">
                <LibrarySidebar
                    currentFilter={filter}
                    onFilterChange={setFilter}
                />

                <LiuliGlass className="library-main-glass" padding="large">
                    <header className="library-header">
                        <div className="library-search-container">
                            <LiuliInput
                                icon={<Search size={16} />}
                                placeholder={t('prompt.library.searchPlaceholder')}
                                value={filter.search || ''}
                                onChange={handleSearchChange}
                                className="library-search-input"
                            />
                        </div>

                        <div className="header-actions">
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFeatureSettings: '"tnum"' }}>
                                {t('prompt.library.totalPrompts', { count: prompts.length })}
                            </div>
                        </div>
                    </header>

                    <div className="library-scroll-content">
                        {/* Top Prompts Section */}
                        {showTopPrompts && topPrompts.length > 0 && (
                            <div className="section-container">
                                <div className="section-title">
                                    <Flame size={18} color="var(--warning)" style={{ marginRight: 8 }} />
                                    {t('prompt.library.trending', { count: 4 })}
                                </div>
                                <div className="prompt-grid-row">
                                    {topPrompts.map(prompt => (
                                        <PromptCard
                                            key={prompt.id}
                                            prompt={prompt}
                                            onClick={() => handlePromptClick(prompt)}
                                            featured={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Prompts Grid */}
                        <div className="section-container">
                            {showTopPrompts && <div className="section-title">{t('prompt.library.allPrompts')}</div>}

                            <div className="prompt-masonry-grid">
                                {otherPrompts.map(prompt => (
                                    <div key={prompt.id} className="prompt-masonry-item">
                                        <PromptCard
                                            prompt={prompt}
                                            onClick={() => handlePromptClick(prompt)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {prompts.length === 0 && (
                            <div className="empty-state">
                                <Search size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                                <div style={{ marginBottom: 16 }}>{t('prompt.library.noPromptsFound', { defaultValue: 'No prompts found matching your criteria.' })}</div>
                                <LiuliButton variant="secondary" onClick={() => setFilter({})}>
                                    {t('prompt.action.clearFilters', { defaultValue: 'Clear Filters' })}
                                </LiuliButton>
                            </div>
                        )}
                    </div>
                </LiuliGlass>
            </div>

            <PromptDetailModal
                prompt={selectedPrompt}
                open={!!selectedPrompt}
                onClose={() => setSelectedPrompt(null)}
            />
        </div>
    );
};
