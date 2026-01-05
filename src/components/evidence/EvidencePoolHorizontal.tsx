/**
 * EvidencePoolHorizontal - 横向展示的证据池组件
 * 用于分析报告页面的顶部展示
 */

import { useEvidence } from '@contexts/EvidenceContext';
import { useI18n } from '@contexts/I18nContext';
import { Trash2, Pin, Database, TrendingUp, Lightbulb, BarChart3, Network } from 'lucide-react';
import { EvidenceType } from '@/types/evidence';
import './EvidencePoolHorizontal.css';

const ICON_SIZE_SMALL = 14;

// 证据类型对应的图标
const EvidenceTypeIcon: Record<EvidenceType, typeof Database> = {
    cleaning: Database,
    analysis: TrendingUp,
    insight: Lightbulb,
    visualization: BarChart3,
    insightChain: Network,
};

export function EvidencePoolHorizontal() {
    const { t } = useI18n();
    const { records, removeRecord, togglePin } = useEvidence();

    // 获取证据类型的翻译键
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
        <div className="evidence-pool-horizontal">
            {/* 头部标题 */}
            <div className="evidence-horizontal-header">
                <h4 className="evidence-horizontal-title">
                    {t('evidence.title')}
                    <span className="evidence-count-badge">{records.length}</span>
                </h4>
            </div>

            {/* 横向滚动卡片容器 */}
            <div className="evidence-horizontal-scroll">
                {records.length === 0 ? (
                    <div className="evidence-horizontal-empty">
                        <Lightbulb size={32} className="evidence-empty-icon" />
                        <p>{t('evidence.noRecordsHint')}</p>
                    </div>
                ) : (
                    records.map((record) => {
                        const IconComponent = EvidenceTypeIcon[record.type];
                        return (
                            <div
                                key={record.id}
                                className={`evidence-horizontal-card ${record.isPinned ? 'pinned' : ''}`}
                            >
                                {/* 卡片头部 */}
                                <div className="evidence-h-card-header">
                                    <div className="evidence-h-type">
                                        <IconComponent size={ICON_SIZE_SMALL} />
                                        <span>{getTypeLabel(record.type)}</span>
                                    </div>
                                    <div className="evidence-h-actions">
                                        <button
                                            className={`evidence-h-btn ${record.isPinned ? 'active' : ''}`}
                                            onClick={() => togglePin(record.id)}
                                            title={record.isPinned ? t('evidence.unpin') : t('evidence.pin')}
                                        >
                                            <Pin size={12} />
                                        </button>
                                        <button
                                            className="evidence-h-btn"
                                            onClick={() => removeRecord(record.id)}
                                            title={t('evidence.delete')}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* 卡片内容 */}
                                <div className="evidence-h-card-body">
                                    <h5 className="evidence-h-title">{record.title}</h5>
                                    <p className="evidence-h-desc">{record.description}</p>

                                    {/* 图表预览（如果有） */}
                                    {record.chartBase64 && (
                                        <div className="evidence-h-chart">
                                            <img
                                                src={record.chartBase64}
                                                alt={record.title}
                                                className="evidence-h-chart-img"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
