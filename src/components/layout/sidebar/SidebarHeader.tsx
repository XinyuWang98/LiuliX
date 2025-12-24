import React from 'react';
import { PanelLeft } from 'lucide-react';
import { Logo } from '@/components/common/Logo/Logo';

interface SidebarHeaderProps {
    title: string;
    onClose?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title, onClose }) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px var(--gap-l) 24px',
            flexShrink: 0,
        }}>
            {title === 'LiuliX' ? (
                <Logo layout="horizontal" size="l" />
            ) : (
                <h2 style={{
                    fontSize: 'var(--fs-xl)',
                    fontWeight: 'var(--fw-bold)',
                    margin: 0,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                }}>
                    {title}
                </h2>
            )}
            {onClose && (
                <button
                    className="btn-ghost"
                    onClick={onClose}
                    style={{
                        padding: '4px',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-s)',
                        cursor: 'pointer',
                    }}
                >
                    <PanelLeft size={18} />
                </button>
            )}
        </div>
    );
};
