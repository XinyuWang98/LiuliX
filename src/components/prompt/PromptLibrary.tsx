import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { promptRegistry } from '@/services/promptRegistry';
import { UserPrompt, PromptFilter } from '@/types/prompt';
import { LibrarySidebar } from '@/components/prompt/LibrarySidebar';
import { PromptCard } from '@/components/prompt/PromptCard';
import { PromptDetailModal } from '@/components/prompt/PromptDetailModal';
import { Search, Flame } from 'lucide-react';
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
    // If no usage data, we might show nothing or some defaults.
    // For demo, we just take the first 4 of the sorted list as 'Trending'
    const showTopPrompts = !filter.tagCategory && !filter.tagValue && !filter.search;
    const topPrompts = showTopPrompts ? prompts.slice(0, 4) : [];
    const otherPrompts = showTopPrompts ? prompts.slice(4) : prompts;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilter(prev => ({ ...prev, search: e.target.value }));
    };

    const handlePromptClick = (prompt: UserPrompt) => {
        // Only select for details, usage is tracked on actual execution (cleaning/insight)
        setSelectedPrompt(prompt);
    };

    return (
        <div className="prompt-library-page">
            <LibrarySidebar
                currentFilter={filter}
                onFilterChange={setFilter}
            />

            <main className="library-main">
                <header className="library-header">
                    {/* Replaced Title with Search Bar mainly */}
                    <div className="library-search-container">
                        <div className="library-search">
                            <Search size={16} className="library-search-icon" />
                            <input
                                type="text"
                                placeholder={t('prompt.library.searchPlaceholder')}
                                value={filter.search || ''}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>

                    <div className="header-actions">
                        {/* Placeholder for sorting or other actions if needed */}
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            {prompts.length} Prompts
                        </div>
                    </div>
                </header>

                <div className="library-content">

                    {/* Top Prompts Section */}
                    {showTopPrompts && topPrompts.length > 0 && (
                        <div className="section-container">
                            <div className="section-title">
                                <Flame size={16} color="var(--warning)" style={{ marginRight: 8 }} />
                                Trending Top 4
                            </div>
                            <div className="prompt-grid-row">
                                {topPrompts.map(prompt => (
                                    <PromptCard
                                        key={prompt.id}
                                        prompt={prompt}
                                        onClick={() => handlePromptClick(prompt)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Prompts Grid */}
                    <div className="section-container">
                        {showTopPrompts && <div className="section-title">All Prompts</div>}

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
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '50vh',
                            color: 'var(--text-tertiary)'
                        }}>
                            <Search size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                            <div>No prompts found matching your criteria.</div>
                        </div>
                    )}
                </div>
            </main>

            <PromptDetailModal
                prompt={selectedPrompt}
                open={!!selectedPrompt}
                onClose={() => setSelectedPrompt(null)}
            />
        </div>
    );
};
