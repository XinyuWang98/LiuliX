import React from 'react';
import { PanelLeft, Plus, Upload } from 'lucide-react';
import { useI18n } from '@contexts/I18nContext';
import { Logo } from '@/components/common/Logo/Logo';

interface SidebarHeaderProps {
    title: string;
    onClose?: () => void;
    collapseTooltip?: string;
    onAddProject?: () => void;
    onImportFile?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title, onClose, collapseTooltip, onAddProject, onImportFile }) => {
    const { t } = useI18n();

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px var(--gap-l) 16px',
            flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-panel)',
        }}>
            {title === 'LiuliX' ? (
                <Logo layout="horizontal" size="m" />
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
            <div style={{ display: 'flex', gap: '8px' }}>
                {onAddProject && (
                    <button
                        className="btn-ghost"
                        onClick={onAddProject}
                        title={t('dataSource.project.newProject')}
                        style={{
                            padding: '6px',
                            color: 'var(--primary)',
                            borderRadius: 'var(--radius-s)',
                            cursor: 'pointer',
                            background: 'rgba(var(--primary-rgb), 0.1)',
                        }}
                    >
                        <Plus size={16} />
                    </button>
                )}
                {onImportFile && (
                    <button
                        className="btn-ghost"
                        onClick={onImportFile}
                        title={t('dataSource.uploadFile')}
                        style={{
                            padding: '6px',
                            color: 'var(--text-secondary)',
                            borderRadius: 'var(--radius-s)',
                            cursor: 'pointer',
                        }}
                    >
                        <Upload size={16} />
                    </button>
                )}
                {onClose && (
                    <button
                        className="btn-ghost"
                        onClick={onClose}
                        style={{
                            padding: '6px',
                            color: 'var(--text-secondary)',
                            borderRadius: 'var(--radius-s)',
                            cursor: 'pointer',
                        }}
                        title={collapseTooltip}
                    >
                        <PanelLeft size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};
