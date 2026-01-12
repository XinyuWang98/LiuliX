import { useState } from 'react';
import { useEvidence } from '@/contexts/EvidenceContext';
import { useI18n } from '@/contexts/I18nContext';
import { ChevronDown, Database, TrendingUp, Lightbulb, BarChart3, Network, Trash2 } from 'lucide-react';
import { EvidenceType } from '@/types/evidence';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
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
    const { records, removeRecord, reorderRecord } = useEvidence();
    const [isExpanded, setIsExpanded] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Hack to make drag image transparent or invisible if custom drag preview is needed
        // but for now default ghost image is fine.
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        reorderRecord(draggedIndex, targetIndex);
        setDraggedIndex(null);
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
                        {records.map((record, index) => {
                            const IconComponent = EvidenceTypeIcon[record.type];
                            return (
                                <div
                                    key={record.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    style={{
                                        opacity: draggedIndex === index ? 0.5 : 1,
                                        cursor: 'move',
                                        transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
                                    }}
                                >
                                    <LiuliGlass
                                        className="et-card"
                                        padding="small"
                                        interactive
                                    >
                                        <div className="et-card-header">
                                            <div className="et-type">
                                                <IconComponent size={ICON_SIZE_SMALL} />
                                                <span>{getTypeLabel(record.type)}</span>
                                            </div>
                                            <div className="et-action-group">
                                                <LiuliButton
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeRecord(record.id);
                                                    }}
                                                    title={t('evidence.delete')}
                                                    style={{ width: '20px', height: '20px', padding: 0 }}
                                                >
                                                    <Trash2 size={12} color="var(--text-tertiary)" />
                                                </LiuliButton>
                                            </div>
                                        </div>
                                        <h5 className="et-title-text" title={record.title}>{record.title}</h5>
                                        <p className="et-desc" title={record.description}>{record.description}</p>
                                    </LiuliGlass>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
