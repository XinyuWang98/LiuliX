/**
 * ReportNotebook - 报告编辑器组件 (Stateless)
 * 只负责展示 Cells 和传递审计操作，状态由 ReportWorkbench 管理
 */

import { ReportDocument, ReportCell, AuditStatus, ReportMode } from '@/types/report';
import { useI18n } from '@/contexts/I18nContext';
import { ReportCellReadOnly } from './ReportCellReadOnly';
import './ReportNotebook.css';

interface ReportNotebookProps {
    document: ReportDocument;
    onCellUpdate: (cellId: string, updates: Partial<ReportCell>) => void;
    mode: ReportMode;
}

export function ReportNotebook({ document, onCellUpdate, mode }: ReportNotebookProps) {
    const { t } = useI18n();

    // 处理审计回调
    const handleCellAudit = (cellId: string, status: AuditStatus, note?: string) => {
        onCellUpdate(cellId, { auditStatus: status, auditNote: note });
    };

    if (!document || document.cells.length === 0) {
        return null;
    }

    return (
        <div className="report-notebook">
            {/* Signed Status Banner (Inside Notebook) */}
            {document.isSigned && (
                <div className="signed-status">
                    🔒 {t('report.audit.reportLocked')} |
                    {t('report.audit.signedBy')}: {document.signedBy} |
                    {t('report.audit.signedAt')}: {new Date(document.signedAt!).toLocaleString('zh-CN')}
                </div>
            )}

            {/* Cells List */}
            <div className={`cells-container mode-${mode}`}>
                {document.cells.map(cell => (
                    <ReportCellReadOnly
                        key={cell.id}
                        cell={cell}
                        onAudit={document.isSigned ? undefined : handleCellAudit}
                        showAuditControls={!document.isSigned && mode === 'notebook'}
                    />
                ))}
            </div>
        </div>
    );
}

