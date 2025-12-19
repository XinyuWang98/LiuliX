import { useEvidence } from '@contexts/EvidenceContext';
import { useI18n } from '@contexts/I18nContext';
import { Trash2, Pin, Clock, Database, TrendingUp, Lightbulb, BarChart3, Network } from 'lucide-react';
import { EvidenceType } from '@/types/evidence';
import './EvidencePool.css';

// 图标尺寸常量
const ICON_SIZE_SMALL = 16; // 小图标尺寸
const ICON_SIZE_MEDIUM = 20; // 中等图标尺寸

// 证据类型对应的图标
const EvidenceTypeIcon: Record<EvidenceType, typeof Database> = {
    cleaning: Database,
    analysis: TrendingUp,
    insight: Lightbulb,
    visualization: BarChart3,
    insightChain: Network, // 洞察链图标
};

export function EvidencePool() {
    const { t } = useI18n();
    const { records, removeRecord, togglePin, clearAll } = useEvidence();

    // 格式化时间戳
    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 获取证据类型的翻译键
    const getTypeLabel = (type: EvidenceType): string => {
        const typeMap: Record<EvidenceType, string> = {
            cleaning: t('evidence.type.cleaning'),
            analysis: t('evidence.type.analysis'),
            insight: t('evidence.type.insight'),
            visualization: t('evidence.type.visualization'),
            insightChain: '洞察链', // TODO: 添加到 i18n
        };
        return typeMap[type];
    };

    return (
        <div className="evidence-pool">
            {/* 头部 */}
            <div className="evidence-header">
                <h3 className="evidence-title">{t('evidence.title')}</h3>
                {records.length > 0 && (
                    <button
                        className="btn-ghost evidence-clear-btn"
                        onClick={clearAll}
                        title={t('evidence.clearAll')}
                    >
                        <Trash2 size={ICON_SIZE_SMALL} />
                        {t('evidence.clearAll')}
                    </button>
                )}
            </div>

            {/* 证据列表 */}
            <div className="evidence-list">
                {records.length === 0 ? (
                    <div className="evidence-empty">
                        <Lightbulb size={ICON_SIZE_MEDIUM * 2} className="evidence-empty-icon" />
                        <p className="evidence-empty-text">{t('evidence.noRecords')}</p>
                        <p className="evidence-empty-hint">{t('evidence.noRecordsHint')}</p>
                    </div>
                ) : (
                    records.map((record) => {
                        const IconComponent = EvidenceTypeIcon[record.type];
                        return (
                            <div
                                key={record.id}
                                className={`evidence-card ${record.isPinned ? 'pinned' : ''}`}
                            >
                                {/* 卡片头部 */}
                                <div className="evidence-card-header">
                                    <div className="evidence-card-type">
                                        <IconComponent size={ICON_SIZE_SMALL} />
                                        <span className="evidence-type-label">
                                            {getTypeLabel(record.type)}
                                        </span>
                                    </div>
                                    <div className="evidence-card-actions">
                                        <button
                                            className={`btn-ghost evidence-pin-btn ${record.isPinned ? 'active' : ''}`}
                                            onClick={() => togglePin(record.id)}
                                            title={record.isPinned ? t('evidence.unpin') : t('evidence.pin')}
                                        >
                                            <Pin size={ICON_SIZE_SMALL} />
                                        </button>
                                        <button
                                            className="btn-ghost evidence-delete-btn"
                                            onClick={() => removeRecord(record.id)}
                                            title={t('evidence.delete')}
                                        >
                                            <Trash2 size={ICON_SIZE_SMALL} />
                                        </button>
                                    </div>
                                </div>

                                {/* 卡片内容 */}
                                <div className="evidence-card-body">
                                    <h4 className="evidence-card-title">{record.title}</h4>
                                    <p className="evidence-card-description">{record.description}</p>

                                    {/* SQL 语句显示 */}
                                    {record.sql && (
                                        <div className="evidence-sql-container">
                                            <code className="evidence-sql">{record.sql}</code>
                                        </div>
                                    )}

                                    {/* 影响行数统计 */}
                                    {record.affectedRows !== undefined && (
                                        <div className="evidence-stats">
                                            {record.beforeCount !== undefined && record.afterCount !== undefined ? (
                                                <span className="evidence-stat-item">
                                                    {t('evidence.rowsChanged', {
                                                        before: record.beforeCount.toLocaleString(),
                                                        after: record.afterCount.toLocaleString(),
                                                    })}
                                                </span>
                                            ) : (
                                                <span className="evidence-stat-item">
                                                    {t('evidence.affectedRows', {
                                                        count: record.affectedRows.toLocaleString(),
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 卡片尾部 */}
                                <div className="evidence-card-footer">
                                    <div className="evidence-timestamp">
                                        <Clock size={ICON_SIZE_SMALL} />
                                        <span>{formatTimestamp(record.timestamp)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
