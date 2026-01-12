/**
 * ReportCellReadOnly - 只读报告Cell组件
 * V0版本：仅展示，不支持编辑和执行
 */

import { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { ReportCell, AuditStatus } from '@/types/report';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/utils/logger';
import { ChartImage } from '../insights/ChartImage';
import { CodeBlock } from '@/components/common/CodeBlock'; // ✅ 复用 CodeBlock 组件
import './ReportCellReadOnly.css';

interface ReportCellReadOnlyProps {
    cell: ReportCell;
    onAudit?: (cellId: string, status: AuditStatus, note?: string) => void;
    // F-11: showAuditControls 已移除
}

export function ReportCellReadOnly({
    cell,
    onAudit: _onAudit // F-11: 暂时保留接口兼容性
}: ReportCellReadOnlyProps) {
    const { t } = useI18n();
    const [copied, setCopied] = useState(false);

    // ✅ 优先使用纯净代码（适合 Colab），回退到增强版代码
    const displayCode = cell.rawCode || cell.code;

    // 复制代码到剪贴板
    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(displayCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            logger.error('报告', '复制失败', { error: err });
        }
    };

    // F-11: 审计函数已移除
    // 如需恢复审计功能，请取消以下注释：
    // const handleMarkApproved = () => {
    //     onAudit?.(cell.id, AuditStatus.Approved);
    // };
    // const handleMarkRejected = () => {
    //     onAudit?.(cell.id, AuditStatus.Rejected, '');
    // };

    // 审计状态徽章
    /*
    const _getAuditBadge = () => {
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
    */

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
                {/* ❌ 移除审核徽章 - 改为整体报告签字 */}
                {/* {getAuditBadge()} */}
            </div>

            {/* Code Area (只读) - ✅ 改用 CodeBlock 组件 */}
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
                <CodeBlock
                    code={displayCode}
                    language={cell.language}
                    copyable={false} // 已有外部复制按钮
                    formatted={false} // 保持原始代码格式
                    className="liuli-code-block" // ✅ 使用统一样式
                />
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
                        <ChartImage
                            src={cell.output?.chartImage || ''}
                            alt={cell.output?.summary || 'Chart'}
                            variant="card" /* F-10: 图片样式规范 */
                        />
                    )}

                    {cell.output.summary && (
                        <div className="output-summary">
                            <strong>💡 {t('report.conclusion')}:</strong>
                            <p>{cell.output.summary}</p>
                        </div>
                    )}
                </div>
            )}

            {/* F-11: 移除审计控件，允许一键签名 */}
            {/* Audit Controls - REMOVED */}
            {/* {showAuditControls && cell.auditStatus === AuditStatus.Pending && (
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
            )} */}

            {/* Audit Note (if rejected) */}
            {cell.auditNote && (
                <div className="cell-audit-note">
                    <strong>{t('report.audit.note')}:</strong> {cell.auditNote}
                </div>
            )}
        </div>
    );
}
