import { useState, useEffect } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { Search, Tag, Copy, Sparkles, LayoutDashboard } from 'lucide-react';
import { loadPrompts, LocalizedPrompt } from '@utils/promptLoader';

interface PromptLibraryProps {
    activeView?: 'dashboard' | 'library';
    onNavigate?: (view: 'dashboard' | 'library') => void;
}

export function PromptLibrary({ onNavigate = () => { } }: PromptLibraryProps) {
    const { t, language } = useI18n();
    const [prompts, setPrompts] = useState<LocalizedPrompt[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // 加载 Prompts（根据当前语言）
    useEffect(() => {
        const loadedPrompts = loadPrompts(language.code);
        setPrompts(loadedPrompts);
    }, [language.code]);

    // 过滤 Prompts
    const filteredPrompts = prompts.filter(prompt => {
        const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? prompt.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const categories = [
        { id: 'all', label: t('common.all') },
        { id: 'analysis', label: t('prompt.category.analysis') },
        { id: 'cleaning', label: t('prompt.category.cleaning') },
        { id: 'visualization', label: t('prompt.category.visualization') },
    ];

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        alert(t('prompt.action.copied'));
    };

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'transparent',
            overflow: 'hidden',
        }}>
            {/* 标题栏 */}
            <div
                style={{
                    // height: '150px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between', // Changed to space-between
                    padding: '24px var(--gap-l) 24px',
                    flexShrink: 0,
                }}
            >
                {/* Left Group: Title + Switcher */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--gap-l)' }}>
                    <h2 style={{
                        fontSize: 'var(--fs-xxl)',
                        fontWeight: 'var(--fw-bold)',
                        margin: 0,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                    }}>
                        {t('nav.promptLibrary')}
                    </h2>

                    {/* Simple Navigation Button */}
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="btn-ghost"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--text-secondary)',
                            fontWeight: '500',
                            fontSize: 'var(--fs-sm)',
                        }}
                    >
                        <LayoutDashboard size={14} />
                        {t('nav.dashboard')}
                    </button>
                </div>
            </div>

            {/* 主内容区 */}
            <div style={{
                flex: 1,
                padding: 'var(--gap-l)',
                overflowY: 'auto',
            }}>
                {/* 搜索和筛选栏 */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--gap-m)',
                    marginBottom: 'var(--gap-l)',
                    flexWrap: 'wrap',
                }}>
                    <div style={{
                        position: 'relative',
                        flex: 1,
                        minWidth: '280px',
                        maxWidth: '400px',
                    }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)',
                            pointerEvents: 'none',
                        }} />
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="glass-panel-light"
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 40px',
                                fontSize: 'var(--fs-sm)',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--gap-s)', flexWrap: 'wrap' }}>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id === 'all' ? null : cat.id)}
                                className="btn-secondary"
                                style={{
                                    padding: '8px 16px',
                                    fontSize: 'var(--fs-sm)',
                                    fontWeight: 'var(--fw-medium)',
                                    ...(((cat.id === 'all' && !selectedCategory) || cat.id === selectedCategory) && {
                                        background: 'var(--primary)',
                                        color: '#ffffff',
                                        borderColor: 'var(--primary)',
                                    })
                                }}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Prompt 列表 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 'var(--gap-l)',
                }}>
                    {filteredPrompts.map(prompt => (
                        <div
                            key={prompt.id}
                            className="card glass-panel"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--gap-m)',
                                boxShadow: 'none', // Remove shadow as requested
                                background: 'rgba(255, 255, 255, 0.03)', // Very subtle background
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: 'var(--fs-lg)',
                                    fontWeight: 'var(--fw-semibold)',
                                    color: 'var(--text-primary)',
                                }}>
                                    {prompt.title}
                                </h3>
                                <button
                                    onClick={() => handleCopy(prompt.content)}
                                    className="btn-ghost"
                                    title={t('prompt.action.copy')}
                                    style={{ padding: '6px', flexShrink: 0 }}
                                >
                                    <Copy size={16} />
                                </button>
                            </div>

                            <p style={{
                                margin: 0,
                                color: 'var(--text-secondary)',
                                fontSize: 'var(--fs-sm)',
                                flex: 1,
                                lineHeight: 1.6,
                            }}>
                                {prompt.description}
                            </p>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 'var(--gap-xs)',
                            }}>
                                {prompt.tags.map((tag, index) => (
                                    <span key={index} className="tag">
                                        <Tag size={10} />
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <button
                                className="btn-primary"
                                style={{
                                    marginTop: 'var(--gap-s)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--gap-s)',
                                    width: '100%',
                                }}
                            >
                                <Sparkles size={16} />
                                {t('prompt.action.use')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
