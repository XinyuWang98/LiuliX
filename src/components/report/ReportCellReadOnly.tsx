/**
 * ReportCellReadOnly - 只读报告Cell组件
 * V0版本：仅展示，不支持编辑和执行
 */

import { useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import { Copy, Check, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { ReportCell, AuditStatus } from '@/types/report';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/utils/logger';
import './ReportCellReadOnly.css';

interface ReportCellReadOnlyProps {
    cell: ReportCell;
    onAudit?: (cellId: string, status: AuditStatus, note?: string) => void;
    showAuditControls?: boolean;
}

export function ReportCellReadOnly({
    cell,
    onAudit,
    showAuditControls = true
}: ReportCellReadOnlyProps) {
    const { t } = useI18n();
    const [copied, setCopied] = useState(false);

    // 复制代码到剪贴板
    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(cell.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            logger.error('报告', '复制失败', { error: err });
        }
    };

    // 标记审计状态
    const handleMarkApproved = () => {
        onAudit?.(cell.id, AuditStatus.Approved);
    };

    const handleMarkRejected = () => {
        onAudit?.(cell.id, AuditStatus.Rejected, '');
    };

    // 代码高亮
    const highlightedCode = Prism.highlight(
        cell.code,
        cell.language === 'sql' ? Prism.languages.sql : Prism.languages.python,
        cell.language
    );

    // 审计状态徽章
    const getAuditBadge = () => {
        switch (cell.auditStatus) {
            case AuditStatus.Approved:
                return (
                    <span className="audit-badge audit-approved">
                        <CheckCircle size={14} />
                        {t('report.audit.approved')}
                    </span>
                );
            case AuditStatus.Rejected:
                return (
                    <span className="audit-badge audit-rejected">
                        <XCircle size={14} />
                        {t('report.audit.rejected')}
                    </span>
                );
            default:
                return (
                    <span className="audit-badge audit-pending">
                        <AlertCircle size={14} />
                        {t('report.audit.pending')}
                    </span>
                );
        }
    };

    return (
        <div
            className="report-cell"
            style={{ marginLeft: `${cell.depth * 24}px` }}
        >
            {/* Cell Header */}
            <div className="cell-header">
                <span className="cell-id">Cell #{cell.id.slice(0, 6)}</span>
                <span className="cell-language">{cell.language.toUpperCase()}</span>
                <span className="cell-depth">Depth: {cell.depth}</span>
                {getAuditBadge()}
            </div>

            {/* Code Area (只读) */}
            <div className="cell-code-area">
                <div className="code-header">
                    <button
                        className="btn-copy-code"
                        onClick={handleCopyCode}
                        title={t('report.notebook.copyCode')}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? t('report.notebook.codeCopied') : t('report.notebook.copyCode')}
                    </button>
                    <span className="run-disabled-hint">
                        ⚠️ {t('report.notebook.runDisabled')}
                    </span>
                </div>
                <pre className="code-block">
                    <code
                        className={`language-${cell.language}`}
                        dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    />
                </pre>
            </div>

            {/* Output Area */}
            {(cell.output.chartImage || cell.output.summary || cell.output.error) && (
                <div className="cell-output-area">
                    {cell.output.error && (
                        <div className="output-error">
                            <AlertCircle size={16} />
                            {cell.output.error}
                        </div>
                    )}

                    {cell.output.chartImage && (
                        <div className="output-chart">
                            <img src={cell.output.chartImage} alt="Chart" />
                        </div>
                    )}

                    {cell.output.summary && (
                        <div className="output-summary">
                            <strong>💡 {t('report.conclusion')}:</strong>
                            <p>{cell.output.summary}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Audit Controls */}
            {showAuditControls && cell.auditStatus === AuditStatus.Pending && (
                <div className="cell-audit-controls">
                    <button className="btn-audit btn-approve" onClick={handleMarkApproved}>
                        <CheckCircle size={16} />
                        {t('report.audit.markApproved')}
                    </button>
                    <button className="btn-audit btn-reject" onClick={handleMarkRejected}>
                        <XCircle size={16} />
                        {t('report.audit.markRejected')}
                    </button>
                </div>
            )}

            {/* Audit Note (if rejected) */}
            {cell.auditNote && (
                <div className="cell-audit-note">
                    <strong>{t('report.audit.note')}:</strong> {cell.auditNote}
                </div>
            )}
        </div>
    );
}
