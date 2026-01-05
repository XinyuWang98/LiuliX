import { useState } from 'react';
import { useEvidence } from '@/contexts/EvidenceContext';
import { useI18n } from '@/contexts/I18nContext';
import { ChevronDown, Database, TrendingUp, Lightbulb, BarChart3, Network, Trash2 } from 'lucide-react';
import { EvidenceType } from '@/types/evidence';
import './EvidenceTray.css';

const ICON_SIZE_SMALL = 14;

const EvidenceTypeIcon: Record<EvidenceType, typeof Database> = {
    cleaning: Database,
    analysis: TrendingUp,
    insight: Lightbulb,
    visualization: BarChart3,
    insightChain: Network,
};

export function EvidenceTray() {
    const { t } = useI18n();
    const { records, removeRecord } = useEvidence();
    const [isExpanded, setIsExpanded] = useState(false);

    const getTypeLabel = (type: EvidenceType): string => {
        const typeMap: Record<EvidenceType, string> = {
            cleaning: t('evidence.type.cleaning'),
            analysis: t('evidence.type.analysis'),
            insight: t('evidence.type.insight'),
            visualization: t('evidence.type.visualization'),
            insightChain: t('evidence.type.insightChain'),
        };
        return typeMap[type];
    };

    return (
        <div className="evidence-tray">
            {/* Header / Toggle Bar */}
            <div className="et-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="et-title">
                    <span>{t('evidence.title')}</span>
                    <span className="et-count">{records.length}</span>
                </div>
                <ChevronDown
                    size={16}
                    className={`et-toggle-icon ${isExpanded ? 'expanded' : ''}`}
                />
            </div>

            {/* Content Area */}
            <div className={`et-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {records.length === 0 ? (
                    <div className="et-empty">
                        {t('evidence.noRecordsHint')}
                    </div>
                ) : (
                    <div className="et-scroll-area">
                        {records.map(record => {
                            const IconComponent = EvidenceTypeIcon[record.type];
                            return (
                                <div key={record.id} className="et-card">
                                    <div className="et-card-header">
                                        <div className="et-type">
                                            <IconComponent size={ICON_SIZE_SMALL} />
                                            <span>{getTypeLabel(record.type)}</span>
                                        </div>
                                        {/* Simplified Actions for Tray - Keep it clean */}
                                        <div className="et-action-group">
                                            <button
                                                className="btn-icon-tiny"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeRecord(record.id);
                                                }}
                                                title={t('evidence.delete')}
                                            >
                                                <Trash2 size={12} color="var(--text-tertiary)" />
                                            </button>
                                        </div>
                                    </div>
                                    <h5 className="et-title-text" title={record.title}>{record.title}</h5>
                                    <p className="et-desc" title={record.description}>{record.description}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
