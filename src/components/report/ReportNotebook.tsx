import { ReportDocument, ReportCell } from '@/types/report';
import { useI18n } from '@/contexts/I18nContext';
import { useReport } from '@/contexts/ReportContext';
import { CellResult } from './CellResult';
import { CellCode } from './CellCode';
import { CodeBlock } from '@/components/common/CodeBlock/CodeBlock';
import './ReportNotebook.css';

interface ReportNotebookProps {
    document: ReportDocument;
    onCellUpdate: (cellId: string, updates: Partial<ReportCell>) => void;
    onReportUpdate: (updates: Partial<ReportDocument>) => void; // Add prop
}

export function ReportNotebook({ document, onCellUpdate, onReportUpdate }: ReportNotebookProps) {
    const { t } = useI18n();
    const { mode } = useReport(); // Use global mode state

    // Determine code visibility based on mode
    const showCode = mode === 'notebook';

    // REMOVED local collapsed state in favor of global mode
    // Unused Annotation handler removed (logic moved to CellResult)

    // 切换折叠 (Removed - Global Control)

    if (!document || document.cells.length === 0) {
        return (
            <div className="report-notebook-empty">
                {t('report.noRecordsHint')}
            </div>
        );
    }

    return (
        <div className="report-notebook">


            <div className="report-notebook-grid">
                {/* Header Row: Meta (Left) + Global Setup (Right) */}
                <div className={`report-cell-row report-header-row ${!showCode ? 'code-hidden' : ''}`}>
                    {/* Left: Report Meta (Title & Summary) */}
                    <div className="report-meta-section">
                        <input
                            className="report-title-input"
                            value={document.title}
                            onChange={(e) => onReportUpdate({ title: e.target.value })}
                            placeholder={t('report.title')}
                            disabled={document.isSigned}
                        />

                        {/* Status Bar */}
                        <div className="report-status-bar">
                            <span className={`status-badge ${document.isSigned ? 'status-locked' : 'status-draft'}`}>
                                {document.isSigned ? `🔒 ${t('report.audit.reportSigned')}` : `📝 ${t('report.audit.pending')}`}
                            </span>
                            {document.isSigned && (
                                <span className="status-details">
                                    {document.signedBy} • {new Date(document.signedAt!).toLocaleString('zh-CN')}
                                </span>
                            )}
                        </div>
                        <textarea
                            className="annotation-textarea report-summary-input"
                            value={document.summary || ''}
                            onChange={(e) => onReportUpdate({ summary: e.target.value })}
                            placeholder={t('report.annotation.placeholder') || "Input executive summary here..."}
                            disabled={document.isSigned}
                            rows={3}
                        />
                    </div>

                    {/* Right: Global Setup Block - Controlled by mode */}
                    {document.globalSetup && showCode && (
                        <div className="global-setup-block">
                            <div className="global-setup-header">
                                <div className="header-left">
                                    <span className="global-setup-title">{t('report.globalSetup.title')}</span>
                                    <span className="global-setup-meta">
                                        {document.globalSetup.split('\n').length} {t('report.globalSetup.lines')}
                                    </span>
                                </div>
                            </div>
                            <div className="global-setup-content">
                                <CodeBlock
                                    code={document.globalSetup}
                                    language="python"
                                    copyable={false}
                                    formatted={false}
                                    showLineNumbers={false}
                                />
                            </div>
                        </div>
                    )}
                    {(!document.globalSetup || !showCode) && <div />} {/* Placeholder for alignment */}
                </div>

                {/* Cells Grid */}
                {document.cells.map(cell => (
                    <div className={`report-cell-row ${!showCode ? 'code-hidden' : ''}`} key={cell.id}>
                        {/* Left: Result & Annotation */}
                        <CellResult
                            cell={cell}
                            onUpdate={(updates) => onCellUpdate(cell.id, updates)}
                            isLocked={!!document.isSigned}
                        />

                        {/* Right: Code (Visible only if showCode is true) */}
                        {showCode && (
                            <CellCode
                                cell={cell}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

