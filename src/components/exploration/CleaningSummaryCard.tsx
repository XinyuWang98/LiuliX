import { useI18n } from '@/contexts/I18nContext';
import { Database, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { Project } from '@/utils/projectUtils';

interface CleaningSummaryCardProps {
    project: Project;
    onClick: () => void;
    isActive: boolean;
}

export function CleaningSummaryCard({ project, onClick, isActive }: CleaningSummaryCardProps) {
    const { t } = useI18n();

    const firstFile = project.files?.[0];
    const rowCount = firstFile?.data?.rowCount || 0;
    const colCount = firstFile?.data?.columns?.length || 0;
    const hasData = rowCount > 0;

    return (
        <div
            onClick={onClick}
            style={{
                // 极简风格：去背景板，仅保留内容和交互暗示
                // 或者使用极淡的背景
                background: 'var(--bg-panel)',
                borderRadius: 'var(--radius-m)',
                border: '1px solid var(--border)',
                padding: 'var(--gap-l)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-l)' }}>
                {/* 简单的图标占位 */}
                <div style={{
                    color: hasData ? 'var(--success)' : 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    {hasData ? <CheckCircle2 size={24} /> : <Database size={24} />}
                </div>

                <div>
                    <h3 style={{
                        margin: 0,
                        fontSize: 'var(--fs-lg)',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                    }}>
                        {t('workshop.cleaning')}
                    </h3>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--gap-m)',
                        marginTop: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--fs-sm)'
                    }}>
                        {hasData ? (
                            <span>{rowCount.toLocaleString()} {t('data.rows')} • {colCount} {t('data.columns')}</span>
                        ) : (
                            <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={14} />
                                {t('exploration.noContent')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Action - Minimal */}
            <div style={{
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: 'var(--fs-sm)'
            }}>
                {isActive ? 'Fold' : 'Expand'}
                <ChevronRight size={16} />
            </div>
        </div>
    );
}
