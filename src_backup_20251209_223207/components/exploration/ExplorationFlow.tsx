import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { Search, Send, Plus, X, LayoutDashboard, Library } from 'lucide-react';
import { ExplorationBlock } from './ExplorationBlock';
import { DataCleaner } from '../cleaning/DataCleaner';
import { ExplorationBlock as BlockType, ExplorationAction, BlockType as EBlockType } from '@/types/exploration';
import { DataViewer } from '@components/data/DataViewer';
import { Project } from '@utils/projectUtils';
import { WorkflowProgressBar, WorkflowStep } from '@components/common/WorkflowProgressBar';

interface ExplorationFlowProps {
    project: Project | null;
    onNavigate: (view: 'dashboard' | 'library') => void;
}

export function ExplorationFlow({ project, onNavigate }: ExplorationFlowProps) {
    const activeView = 'dashboard'; // Always dashboard in this component
    const { t } = useI18n();
    const [searchQuery, setSearchQuery] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
    const [isScrolled, setIsScrolled] = useState(false);

    // Initial Blocks State
    const [blocks, setBlocks] = useState<BlockType[]>([]);

    // Initialize with Upload block when project changes
    useEffect(() => {
        if (project) {
            setBlocks(prev => {
                // Check if upload block exists
                if (prev.some(b => b.type === 'upload')) return prev;
                return [{
                    id: 'block-upload',
                    type: 'upload',
                    title: t('exploration.blocks.upload'),
                    content: null,
                    isCollapsed: false,
                    isPinned: true,
                    timestamp: Date.now(),
                }, ...prev];
            });
        }
    }, [project, t]);

    // Handle scroll to block when currentStep changes
    useEffect(() => {
        if (!currentStep) return;
        // Map step to block type
        const typeMap: Record<string, EBlockType> = {
            'upload': 'upload',
            'cleaning': 'cleaning',
            'hypothesis': 'hypothesis',
            'insights': 'insights',
            'report': 'report',
        };
        const targetType = typeMap[currentStep];
        if (!targetType) return;

        // Find block
        const block = blocks.find(b => b.type === targetType);

        if (block) {
            const el = document.getElementById(`block-${block.id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentStep, blocks]);


    const actions: ExplorationAction = {
        onToggleCollapse: (id: string) => {
            setBlocks(prev => prev.map(b =>
                b.id === id ? { ...b, isCollapsed: !b.isCollapsed } : b
            ));
        },
        onPin: (id: string) => {
            setBlocks(prev => prev.map(b =>
                b.id === id ? { ...b, isPinned: !b.isPinned } : b
            ));
        },
        onMoveUp: (id: string) => {
            setBlocks(prev => {
                const idx = prev.findIndex(b => b.id === id);
                if (idx <= 0) return prev;
                const newBlocks = [...prev];
                [newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]];
                return newBlocks;
            });
        },
        onAddToEvidence: (id: string) => {
            alert(t('exploration.actions.addToEvidence') + ': ' + id);
        },
        onQuote: (id: string) => {
            setInputValue(prev => prev + ` > Quote block ${id} `);
        },
        onDelete: (id: string) => {
            setBlocks(prev => prev.filter(b => b.id !== id));
        },
    };

    // Filter blocks based on search
    const filteredBlocks = blocks.filter(b => {
        const blockTitle = b.title || t(`exploration.blocks.${b.type}` as any);
        return blockTitle.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Mock content renderer based on type
    const renderContent = (block: BlockType) => {
        switch (block.type) {
            case 'upload':
                return <DataViewer project={project} fileData={null} />;
            case 'cleaning':
                return project ? (
                    <DataCleaner
                        tableName="my_table" // TODO: Connect to real state
                        onTableUpdate={(name) => console.log('Updated:', name)}
                    />
                ) : null;
        }
    };

    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchExpanded && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchExpanded]);

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Header: Title + Switcher + Search (Right) + Actions + ProgressBar */}
            <div style={{
                // height: '150px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                padding: '24px var(--gap-l) 24px',
                // Only show background and shadow when scrolled
                background: isScrolled ? 'var(--bg-panel)' : 'transparent',
                boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
                flexShrink: 0,
                zIndex: 10,
                transition: 'background 0.3s ease, box-shadow 0.3s ease',
                overflow: 'visible',
            }}>
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
                        {activeView === 'dashboard' ? t('nav.dashboard') : t('nav.promptLibrary')}
                    </h2>

                    {/* Simple Navigation Button - Only show opposite view */}
                    <button
                        onClick={() => onNavigate(activeView === 'dashboard' ? 'library' : 'dashboard')}
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
                        {activeView === 'dashboard' ? (
                            <>
                                <Library size={14} />
                                {t('nav.promptLibrary')}
                            </>
                        ) : (
                            <>
                                <LayoutDashboard size={14} />
                                {t('nav.dashboard')}
                            </>
                        )}
                    </button>
                </div>


                {/* Right Group: Search + Progress Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--gap-l)',
                }}>
                    {/* Search Bar - Expandable (Right Aligned) */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end', // Align content to right
                        gap: 'var(--gap-s)',
                        background: isSearchExpanded ? 'var(--bg-main)' : 'transparent',
                        border: isSearchExpanded ? '1px solid var(--border)' : '1px solid transparent',
                        borderRadius: '20px',
                        padding: isSearchExpanded ? '4px 8px' : '4px', // symmetric padding
                        transition: 'all 0.3s ease',
                        width: isSearchExpanded ? '200px' : '32px', // Expands leftwards due to flex layout of parent? No, need parent alignment or just width transition.
                        // Parent is "display: flex, alignItems: center". This item will just grow width.
                        // To make it expand to LEFT, the parent logic matters or margin-left: auto?
                        // Actually, if we just grow width, and it's in a flex row, it pushes left items? No.
                        // It pushes right items if it's on left.
                        // It is on right. So growing width pushes it LEFT? No, it pushes its own left border to left if aligned right.
                        // We need to ensure the element grows "to the left".
                        // In a flex container, alignment depends on siblings.
                        // But strictly: `width` transition just changes width. layout engine handles pos.
                        overflow: 'hidden',
                        cursor: isSearchExpanded ? 'text' : 'pointer',
                    }}
                        onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}
                    >
                        {/* Input Area (Visible only when expanded) */}
                        <div style={{
                            flex: 1,
                            display: isSearchExpanded ? 'flex' : 'none',
                            alignItems: 'center',
                            minWidth: 0, // Allow shrinking
                        }}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={t('exploration.searchPlaceholder')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onBlur={() => {
                                    if (!searchQuery) {
                                        setIsSearchExpanded(false);
                                    }
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: 'var(--fs-sm)',
                                    width: '100%',
                                    textAlign: 'right', // Text aligns to icon? Maybe cleaner.
                                    paddingRight: '4px',
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchQuery('');
                                        if (searchInputRef.current) searchInputRef.current.focus();
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '2px',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexShrink: 0,
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Search Icon (Always visible on Right) */}
                        <Search
                            size={18}
                            style={{
                                color: 'var(--text-secondary)',
                                flexShrink: 0,
                            }}
                        />
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 20,
                    }}>
                        <WorkflowProgressBar
                            currentStep={currentStep}
                            onStepClick={setCurrentStep}
                            orientation="horizontal"
                        />
                    </div>
                </div>
            </div>

            {/* Blocks List (Scrollable) */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--gap-l)',
                    paddingBottom: '80px', // Space for bottom input
                    scrollBehavior: 'smooth',
                }}
                onScroll={(e) => {
                    const scrollTop = e.currentTarget.scrollTop;
                    setIsScrolled(scrollTop > 10);
                }}
            >
                {filteredBlocks.length === 0 && project && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        暂无内容
                    </div>
                )}

                {filteredBlocks.map(block => (
                    <ExplorationBlock key={block.id} block={block} actions={actions}>
                        {renderContent(block)}
                    </ExplorationBlock>
                ))}
            </div>

            {/* Bottom: Chat Input - Floating centered bar */}
            <div style={{
                position: 'absolute',
                bottom: '30px',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'center',
                padding: '0 var(--gap-l)',
                pointerEvents: 'none', // Allow clicking through empty space
                zIndex: 30, // Ensure input is on top
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center', // Center all children vertically
                    gap: 'var(--gap-s)',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    borderRadius: '24px', // Slightly more rounded
                    padding: '6px 12px', // Compact padding
                    boxShadow: 'var(--shadow-lg)',
                    width: '100%',
                    maxWidth: '800px',
                    pointerEvents: 'auto',
                    minHeight: '45px', // Reduced from 61px
                    boxSizing: 'border-box',
                }}>
                    <button className="btn-ghost" style={{
                        padding: '6px',
                        borderRadius: '50%',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Plus size={18} />
                    </button>
                    <textarea
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder="Ask AI about your data..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            resize: 'none',
                            minHeight: '20px', // Reduced
                            maxHeight: '100px',
                            padding: '6px 0', // Reduced vertical padding
                            outline: 'none',
                            fontSize: 'var(--fs-m)',
                            fontFamily: 'inherit',
                            lineHeight: '1.5',
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (inputValue.trim()) {
                                    setInputValue('');
                                }
                            }
                        }}
                    />
                    <button
                        className="btn-primary"
                        style={{
                            padding: '0',
                            borderRadius: '50%',
                            minWidth: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                        disabled={!inputValue.trim()}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div >
    );
}
