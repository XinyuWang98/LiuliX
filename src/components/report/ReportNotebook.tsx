/**
 * ReportNotebook - 双角色报告主容器组件
 * V0版本：只读展示 + 模式切换 + 审计签字 + Colab导出
 */

import { useState, useEffect, useMemo } from 'react';
import { Download, Copy, FileText, Check } from 'lucide-react';
import { ReportCell, ReportDocument, ReportMode, AuditStatus } from '@/types/report';
import { useEvidence } from '@/contexts/EvidenceContext';
import { useI18n } from '@/contexts/I18nContext';
import { ReportCellReadOnly } from './ReportCellReadOnly';
import { ModeToggle } from './ModeToggle';
import { generateIpynb, downloadIpynb } from '@/utils/ipynbGenerator';
import { generateMarkdown, generateHTML } from '@/utils/reportExport';
import { logger } from '@/utils/logger';
import './ReportNotebook.css';

export function ReportNotebook() {
    const { t } = useI18n();
    const { records } = useEvidence();

    // 状态管理
    const [mode, setMode] = useState<ReportMode>('notebook');
    const [document, setDocument] = useState<ReportDocument | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    // 从Evidence转换为ReportCell
    useEffect(() => {
        const cells: ReportCell[] = records
            .filter(r => r.type === 'insightChain')
            .map(record => {
                // DEBUG: Inspect chartImage existence
                if (record.metadata?.chartImage) {
                    logger.log('报告', 'Found chartImage', { data: { id: record.id, length: record.metadata.chartImage.length } });
                } else {
                    logger.warn('报告', 'Missing chartImage', { data: { id: record.id, metadata: record.metadata } });
                }

                return {
                    id: record.id,
                    code: record.metadata?.code || '',
                    language: (record.metadata?.codeLanguage as 'sql' | 'python') || 'sql',
                    output: {
                        chartImage: record.metadata?.chartImage,
                        summary: record.description
                    },
                    depth: record.metadata?.depth || 0,
                    parentId: record.metadata?.parentId,
                    auditStatus: AuditStatus.Pending,
                    auditNote: ''
                }
            });

        if (cells.length > 0) {
            setDocument({
                id: `report-${Date.now()}`,
                title: t('report.notebook.defaultTitle'),
                cells,
                isSigned: false
            });
            logger.log('报告', `转换了 ${cells.length} 个Cell`);
        }
    }, [records]);

    // 处理审计
    const handleCellAudit = (cellId: string, status: AuditStatus, note?: string) => {
        if (!document) return;

        setDocument({
            ...document,
            cells: document.cells.map(cell =>
                cell.id === cellId ? { ...cell, auditStatus: status, auditNote: note } : cell
            )
        });
        logger.log('报告', `Cell ${cellId.slice(0, 6)} 审计状态: ${status}`);
    };

    // 签字报告
    const handleSignReport = () => {
        if (!document) return;

        const allApproved = document.cells.every(c => c.auditStatus === AuditStatus.Approved);
        if (!allApproved) {
            alert(t('report.audit.allCellsReviewed'));
            return;
        }

        setDocument({
            ...document,
            isSigned: true,
            signedBy: t('report.notebook.defaultSigner'), // TODO: Get from user context
            signedAt: Date.now()
        });
        logger.log('报告', '报告已签字锁定');
    };

    // 导出 Markdown
    const handleExportMarkdown = async () => {
        if (!document) return;
        const md = generateMarkdown(document);
        try {
            await navigator.clipboard.writeText(md);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
            logger.log('报告', 'Markdown 已复制');
        } catch (err) {
            logger.error('报告', 'Markdown 复制失败', err);
        }
    };

    // 导出 HTML
    const handleExportHTML = () => {
        if (!document) return;
        const html = generateHTML(document);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${document.title}_${formatTimestamp(Date.now()).replace(/[: ]/g, '_')}.html`;
        a.click();
        URL.revokeObjectURL(url);
        logger.log('报告', 'HTML 报告已下载');
    };

    // 导出到Colab
    const handleExportColab = () => {
        if (!document) return;

        const ipynb = generateIpynb(document.cells, document.title);
        downloadIpynb(ipynb, `${document.title}_${Date.now()}.ipynb`);
        logger.log('报告', '已导出.ipynb文件');

        // TODO: 显示Toast提示
        alert(`${t('report.export.downloadIpynb')}\n${t('report.export.uploadToColab')}`);
    };

    // 审计进度
    const auditProgress = useMemo(() => {
        if (!document) return { total: 0, approved: 0 };
        const total = document.cells.length;
        const approved = document.cells.filter(c => c.auditStatus === AuditStatus.Approved).length;
        return { total, approved };
    }, [document]);

    function formatTimestamp(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }

    if (!document || document.cells.length === 0) {
        return (
            <div className="report-notebook-empty">
                <p>{t('report.noInsightChain')}</p>
            </div>
        );
    }

    return (
        <div className="report-notebook">
            {/* Header */}
            <div className="report-header">
                <div className="header-top">
                    <h2>{document.title}</h2>
                    <div className="header-actions">
                        <ModeToggle mode={mode} onChange={setMode} />

                        {/* 导出按钮组 */}
                        <div className="export-actions">
                            <button className="btn-icon" onClick={handleExportMarkdown} title={t('report.export.exportMarkdown')}>
                                {copySuccess ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                            </button>
                            <button className="btn-icon" onClick={handleExportHTML} title={t('report.export.downloadHTML')}>
                                <FileText size={16} />
                            </button>
                            <button className="btn-icon" onClick={handleExportColab} title={t('report.notebook.copyAllToColab')}>
                                <Download size={16} />
                            </button>
                        </div>

                        {!document.isSigned && (
                            <button
                                className="btn-sign-report"
                                onClick={handleSignReport}
                                disabled={auditProgress.approved !== auditProgress.total}
                            >
                                ✅ {t('report.audit.signReport')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Audit Progress - 集成到 Header 底部 */}
                {!document.isSigned && mode === 'notebook' && (
                    <div className="header-progress">
                        <span className="progress-label">
                            {t('report.audit.progress')}: {auditProgress.approved} / {auditProgress.total}
                        </span>
                        <div className="progress-track">
                            <div
                                className="progress-fill"
                                style={{ width: `${(auditProgress.approved / auditProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Signed Status */}
            {document.isSigned && (
                <div className="signed-status">
                    🔒 {t('report.audit.reportLocked')} |
                    {t('report.audit.signedBy')}: {document.signedBy} |
                    {t('report.audit.signedAt')}: {new Date(document.signedAt!).toLocaleString('zh-CN')}
                </div>
            )}

            {/* Cells */}
            <div className={`cells-container mode-${mode}`}>
                {document.cells.map(cell => (
                    <ReportCellReadOnly
                        key={cell.id}
                        cell={cell}
                        onAudit={document.isSigned ? undefined : handleCellAudit}
                        showAuditControls={mode === 'notebook' && !document.isSigned}
                    />
                ))}
            </div>

            {/* Report Mode Footer */}
            {mode === 'report' && !document.isSigned && (
                <div className="report-mode-notice">
                    ⚠️ {t('report.status.notSignedYet')}<br />
                    {t('report.status.canPreviewNoExport')}
                </div>
            )}
        </div>
    );
}
