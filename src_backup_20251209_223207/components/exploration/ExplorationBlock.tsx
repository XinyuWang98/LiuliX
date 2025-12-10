import { useI18n } from '@contexts/I18nContext';
import { ChevronDown, ChevronUp, Pin, Quote, Bookmark, ArrowUp, Trash2 } from 'lucide-react';
import { ExplorationBlock as IExplorationBlock, ExplorationAction } from '@/types/exploration';

interface Props {
    block: IExplorationBlock;
    actions: ExplorationAction;
    children: React.ReactNode;
}

export function ExplorationBlock({ block, actions, children }: Props) {
    const { t } = useI18n();


    return (
        <div style={{
            background: 'var(--bg-panel)',
            borderRadius: 'var(--radius-l)',
            border: '1px solid var(--border)',
            marginBottom: 'var(--gap-l)',
            overflow: 'hidden',
            // 增加 ID 以便于 scrollIntoView 定位
            position: 'relative',
        }} id={`block-${block.id}`}>

            {/* Header / Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--gap-m) var(--gap-l)',
                borderBottom: block.isCollapsed ? 'none' : '1px solid var(--border)',
                background: 'var(--bg-accent)',
            }}>
                {/* Title */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--gap-s)',
                        cursor: 'pointer',
                        userSelect: 'none',
                    }}
                    onClick={() => actions.onToggleCollapse(block.id)}
                >
                    <button className="btn-ghost" style={{ padding: '4px' }}>
                        {block.isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                    <span style={{
                        fontSize: 'var(--fs-m)',
                        fontWeight: 'var(--fw-bold)', // Consistent title style
                        color: 'var(--text-primary)',
                    }}>
                        {t(`exploration.blocks.${block.type}` as any)}
                    </span>
                    {block.isPinned && (
                        <Pin size={14} style={{ color: 'var(--primary)', transform: 'rotate(45deg)' }} />
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)' }}>
                    {/* Common actions always visible */}
                    <button
                        className="btn-ghost"
                        title={t('exploration.actions.moveUp')}
                        onClick={() => actions.onMoveUp(block.id)}
                        style={{ padding: '6px' }}
                    >
                        <ArrowUp size={16} />
                    </button>

                    <button
                        className="btn-ghost"
                        title={block.isPinned ? t('exploration.actions.unpin') : t('exploration.actions.pin')}
                        onClick={() => actions.onPin(block.id)}
                        style={{ padding: '6px', color: block.isPinned ? 'var(--primary)' : 'inherit' }}
                    >
                        <Pin size={16} />
                    </button>

                    <button
                        className="btn-ghost"
                        title={t('exploration.actions.addToEvidence')}
                        onClick={() => actions.onAddToEvidence(block.id)}
                        style={{ padding: '6px' }}
                    >
                        <Bookmark size={16} />
                    </button>

                    {/* More actions (Quote, Delete) */}
                    <button
                        className="btn-ghost"
                        title={t('exploration.actions.quote')}
                        onClick={() => actions.onQuote(block.id)}
                        style={{ padding: '6px' }}
                    >
                        <Quote size={16} />
                    </button>

                    <button
                        className="btn-ghost"
                        title={t('exploration.actions.delete')}
                        style={{ padding: '6px', color: 'var(--error)' }}
                        onClick={() => {
                            if (window.confirm(t('common.confirm'))) {
                                actions.onDelete(block.id);
                            }
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {!block.isCollapsed && (
                <div style={{
                    padding: 'var(--gap-l)',
                    animation: 'fadeIn 0.2s ease-in-out',
                }}>
                    {children}
                </div>
            )}
        </div>
    );
}
