/**
 * ReportActions - 报告操作按钮组件
 * 
 * 用途：放置在 section-header 中，提供报告的核心操作
 * 包含：状态显示、模式切换、导出、签字等功能
 */

import { useReport } from '@/contexts/ReportContext';
import { useI18n } from '@/contexts/I18nContext';
import { Eye, Code, FileText, Download, Check } from 'lucide-react';
import './ReportActions.css';

export function ReportActions() {
    const { t } = useI18n();
    const {
        document,
        mode,
        copySuccess,
        toggleMode,
        handleExportMarkdown,
        handleExportHTML,
        handleExportColab,
        handleSignReport
    } = useReport();

    // 如果没有 document，不显示操作按钮
    if (!document || document.cells.length === 0) {
        return null;
    }

    return (
        <div className="report-actions">
            {/* 状态指示器 */}
            <div className="report-status-indicator">
                <span className={`status-badge ${document.isSigned ? 'status-locked' : 'status-draft'}`}>
                    {document.isSigned ? '🔒 已锁定' : '📝 草稿'}
                </span>
                {document.isSigned && (
                    <span className="status-details">
                        {document.signedBy} • {new Date(document.signedAt!).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                )}
            </div>

            {/* 操作按钮组 */}
            <div className="report-action-buttons">
                {/* Preview/Notebook 切换 */}
                <button
                    className="action-btn"
                    onClick={toggleMode}
                    title={mode === 'notebook' ? t('report.mode.switchTo') + ' Preview' : t('report.mode.switchTo') + ' Notebook'}
                >
                    {mode === 'notebook' ? <Eye size={14} /> : <Code size={14} />}
                    <span>{mode === 'notebook' ? 'Preview' : 'Notebook'}</span>
                </button>

                <div className="btn-separator" />

                {/* 导出 Markdown */}
                <button
                    className="action-btn"
                    onClick={handleExportMarkdown}
                    title={t('report.export.exportMarkdown')}
                >
                    {copySuccess ? <Check size={14} /> : <FileText size={14} />}
                </button>

                {/* 导出 HTML */}
                <button
                    className="action-btn"
                    onClick={handleExportHTML}
                    title={t('report.export.downloadHTML')}
                >
                    <FileText size={14} />
                </button>

                {/* 导出 .ipynb */}
                <button
                    className="action-btn"
                    onClick={handleExportColab}
                    title="Download .ipynb"
                >
                    <Download size={14} />
                </button>

                <div className="btn-separator" />

                {/* 签字并锁定 */}
                <button
                    className={`action-btn btn-primary ${document.isSigned ? 'btn-disabled' : ''}`}
                    onClick={handleSignReport}
                    disabled={document.isSigned}
                >
                    <Check size={14} />
                    <span>{document.isSigned ? '已签字' : t('report.audit.signReport')}</span>
                </button>
            </div>
        </div>
    );
}
