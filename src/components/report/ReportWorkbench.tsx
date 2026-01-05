import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useEvidence } from '@/contexts/EvidenceContext';
import { ReportDocument, ReportCell, AuditStatus, ReportMode } from '@/types/report';
import { ReportNotebook } from './ReportNotebook';
import { EvidenceTray } from './EvidenceTray';
import { logger } from '@/utils/logger';
import { Download, Check, FileText, Eye, Code } from 'lucide-react';
import { generateMarkdown, generateHTML } from '@/utils/reportExport';
import { generateIpynb, downloadIpynb } from '@/utils/ipynbGenerator';
import './ReportWorkbench.css';

export function ReportWorkbench() {
    const { t } = useI18n();
    const { records } = useEvidence(); // Used to init document
    const [document, setDocument] = useState<ReportDocument | null>(null);
    const [mode, setMode] = useState<ReportMode>('notebook');
    const [copySuccess, setCopySuccess] = useState(false);

    // Initialize document from Evidence records
    // 这里保留原 ReportNotebook 的 useEffect 逻辑，但提升到 Workbench
    useEffect(() => {
        // 如果 document 已经有内容且已签名，则不再自动刷新，避免覆盖
        if (document?.isSigned) return;

        const cells: ReportCell[] = records
            .filter(r => r.type === 'insightChain')
            .map(record => {
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

        // 仅在 cell 数量变化或初始化时更新，避免输入丢失 (简易 Diff)
        // 实际生产中可能需要更复杂的合并逻辑，这里 MVP 保持简单：有新记录就刷新
        // 或者简单判断：如果 current cells 数量 != new cells 数量 ?

        // 为了 MVP 稳定性，暂时每次 records 变动都重新生成 document (非 Signed 状态)
        if (cells.length > 0) {
            setDocument(prev => ({
                id: prev?.id || `report-${Date.now()}`,
                title: prev?.title || t('report.notebook.defaultTitle'),
                cells,
                isSigned: false
            }));
            logger.log('UI', `同步 ${cells.length} 个 Cells`);
        }
    }, [records, t]);

    // Audit / Update Handler
    const handleCellUpdate = (cellId: string, updates: Partial<ReportCell>) => {
        if (!document) return;
        setDocument({
            ...document,
            cells: document.cells.map(cell =>
                cell.id === cellId ? { ...cell, ...updates } : cell
            )
        });
    };

    // Actions
    const handleSignReport = () => {
        if (!document) return;
        // F-11: 移除 allApproved 检查，允许一键签名
        setDocument({
            ...document,
            isSigned: true,
            signedBy: 'Current User', // TODO: Get Context
            signedAt: Date.now()
        });
    };

    const handleExportHTML = () => {
        if (!document) return;
        const html = generateHTML(document);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${document.title}_${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportColab = () => {
        if (!document) return;
        const ipynb = generateIpynb(document.cells, document.title);
        downloadIpynb(ipynb, `${document.title}_${Date.now()}.ipynb`);
        // TODO: Toast
        alert(`${t('report.export.downloadIpynb')}\n${t('report.export.uploadToColab')}`);
    };

    const toggleMode = () => {
        setMode(prev => prev === 'notebook' ? 'report' : 'notebook');
    };

    const handleExportMarkdown = async () => {
        if (!document) return;
        const md = generateMarkdown(document);
        try {
            await navigator.clipboard.writeText(md);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            logger.error('UI', 'Markdown Copy Failed', err);
        }
    };

    const auditProgress = useMemo(() => {
        if (!document) return { total: 0, approved: 0 };
        return {
            total: document.cells.length,
            approved: document.cells.filter(c => c.auditStatus === AuditStatus.Approved).length
        };
    }, [document]);

    if (!document || document.cells.length === 0) {
        return (
            <div className="report-workbench empty">
                <div className="rw-empty-state">
                    {t('report.noInsightChain')}
                </div>
            </div>
        );
    }

    return (
        <div className="report-workbench">
            {/* Sticky Toolbar */}
            <div className="rw-toolbar">
                <div className="rw-header-left">
                    <h2 className="rw-title">{document.title}</h2>
                    <div className="rw-status-bar">
                        <span>{mode === 'notebook' ? 'Notebook Mode' : 'Preview Mode'}</span>
                        <span className="rw-text-faded">|</span>
                        <span>
                            {t('report.audit.progress')}: {auditProgress.approved} / {auditProgress.total}
                        </span>
                        {document.isSigned && <span className="rw-text-success"> (Signed)</span>}
                    </div>
                </div>

                <div className="rw-header-right">
                    <button className="rw-action-btn" onClick={toggleMode} title={mode === 'notebook' ? 'Preview Report' : 'Edit Code'}>
                        {mode === 'notebook' ? <Eye size={14} /> : <Code size={14} />}
                        {mode === 'notebook' ? 'Preview' : 'Notebook'}
                    </button>

                    <div className="rw-separator" />

                    <button className="rw-action-btn" onClick={handleExportMarkdown} title="Copy Markdown">
                        {copySuccess ? <Check size={14} /> : <FileText size={14} />}
                    </button>
                    <button className="rw-action-btn" onClick={handleExportHTML} title="Download HTML">
                        <FileText size={14} />
                    </button>
                    <button className="rw-action-btn" onClick={handleExportColab} title="Download .ipynb">
                        <Download size={14} />
                    </button>

                    <div className="rw-separator" />

                    {!document.isSigned && (
                        <button
                            className="rw-action-btn primary"
                            onClick={handleSignReport}
                            disabled={auditProgress.approved !== auditProgress.total}
                        >
                            <Check size={14} />
                            {t('report.audit.signReport')}
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Evidence Tray */}
            <div className="rw-tray-container">
                <EvidenceTray />
            </div>

            {/* Main Editor Area */}
            <div className="rw-editor-area">
                <ReportNotebook
                    document={document}
                    onCellUpdate={handleCellUpdate}
                    mode={mode} // Pass mode to Notebook
                />
            </div>
        </div>
    );
}
