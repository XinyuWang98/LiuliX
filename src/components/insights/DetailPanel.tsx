import React from 'react';
import './DetailPanel.css';
import type { InsightNode } from '@/types/insightTree';
import { ActionGrid } from './ActionGrid';
import { useEvidence } from '@/contexts/EvidenceContext';
import { formatChartBase64 } from '@/utils/imageUtils';
import { useI18n } from '@contexts/I18nContext';

/**
 * 详情面板组件
 * 显示洞察节点的完整信息：图表、分析、代码、下钻操作
 */

interface DetailPanelProps {
    node: InsightNode;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ node }) => {
    const { addRecord } = useEvidence();
    const { t } = useI18n();
    const [isAdopted, setIsAdopted] = React.useState(false);
    const [isIgnored, setIsIgnored] = React.useState(false);

    // 采纳洞察，加入证据池
    const handleAdopt = () => {
        addRecord({
            type: 'insightChain',
            title: node.title,
            description: node.insight || '',
            chartBase64: node.chartImage,
            metadata: {
                nodeId: node.id,
                depth: node.depth,
                tableName: node.metadata?.tableName,
                columns: node.metadata?.columns,
                code: node.code,
            },
        });
        setIsAdopted(true);
        setIsIgnored(false);
    };

    // 忽略洞察
    const handleIgnore = () => {
        setIsIgnored(true);
        setIsAdopted(false);
    };

    return (
        <div className="detail-panel">
            {/* 头部：标题 + 元数据 + 操作按钮 */}
            <header className="detail-panel__header">
                <div className="detail-panel__header-main">
                    <h1 className="detail-panel__title">{node.title}</h1>

                    <div className="detail-panel__actions">
                        <button
                            className={`detail-panel__action-btn detail-panel__action-btn--adopt ${isAdopted ? 'detail-panel__action-btn--active' : ''}`}
                            onClick={handleAdopt}
                            disabled={isAdopted || isIgnored}
                        >
                            {isAdopted ? `✓ ${t('insightChain.adopted')}` : t('insightChain.adopt')}
                        </button>
                        <button
                            className={`detail-panel__action-btn detail-panel__action-btn--ignore ${isIgnored ? 'detail-panel__action-btn--active' : ''}`}
                            onClick={handleIgnore}
                            disabled={isAdopted || isIgnored}
                        >
                            {isIgnored ? t('insightChain.ignore') : t('insightChain.ignore')}
                        </button>
                    </div>
                </div>

                <div className="detail-panel__metadata">
                    {node.metadata?.tableName && (
                        <span className="detail-panel__tag">
                            📄 {node.metadata.tableName}
                        </span>
                    )}
                    {node.metadata?.columns && node.metadata.columns.length > 0 && (
                        <span className="detail-panel__tag">
                            📊 {node.metadata.columns.join(', ')}
                        </span>
                    )}
                </div>
            </header>

            {/* 主内容区：左列（图表+分析）+ 右列（代码） */}
            {(node.chartImage || node.insight || node.code) && (
                <section className="detail-panel__viz-code-section">
                    {/* 左列：图表 + AI分析 */}
                    <div className="detail-panel__left-column">
                        {/* 图表 */}
                        {node.chartImage && (
                            <div className="detail-panel__chart-container">
                                <img
                                    src={formatChartBase64(node.chartImage)}
                                    alt="可视化图表"
                                    className="detail-panel__chart-image"
                                />
                                <div className="detail-panel__chart-controls">
                                    <button className="detail-panel__chart-btn" title="放大">
                                        🔍
                                    </button>
                                    <button className="detail-panel__chart-btn" title="下载">
                                        ⬇
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* AI分析报告 */}
                        {node.insight && (
                            <div className="detail-panel__insight-content">
                                <h3 className="detail-panel__insight-title">📝 {t('insight.analyzing').replace('...', '')}</h3>
                                <p>{node.insight}</p>
                            </div>
                        )}
                    </div>

                    {/* 右列：代码 */}
                    {node.code && (
                        <div className="detail-panel__code-container">
                            <div className="detail-panel__code-header">
                                <span>💻 {t('insightChain.viewCode')}</span>
                                <button className="detail-panel__copy-btn">
                                    {t('report.copy')}
                                </button>
                            </div>
                            <div className="detail-panel__code-content">
                                <pre><code>{node.code}</code></pre>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* 下钻操作区 */}
            {node.recommendedActions && node.recommendedActions.length > 0 && (
                <section className="detail-panel__actions-section">
                    <h2 className="detail-panel__section-title">
                        🎯 {t('insight.drillDown')}
                    </h2>
                    <ActionGrid actions={node.recommendedActions} nodeId={node.id} />
                </section>
            )}
        </div>
    );
};
