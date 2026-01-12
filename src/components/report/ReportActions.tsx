import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useReport } from '@/contexts/ReportContext';
import { useI18n } from '@/contexts/I18nContext';
import { Eye, Code, FileText, Download, Check, ChevronDown, X, Globe, FileCode } from 'lucide-react';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { Z_INDEX } from '@/constants/ui';
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

    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    // 如果没有 document，不显示操作按钮
    if (!document || document.cells.length === 0) {
        return null;
    }

    return (
        <div className="report-actions">


            {/* 操作按钮组 */}
            <div className="report-action-buttons">


                {/* Preview/Notebook 切换 */}
                <LiuliButton
                    variant="secondary"
                    size="sm"
                    onClick={toggleMode}
                    title={mode === 'notebook' ? t('report.mode.switchTo') + ' Preview' : t('report.mode.switchTo') + ' Notebook'}
                    leftIcon={mode === 'notebook' ? <Eye size={14} /> : <Code size={14} />}
                >
                    {mode === 'notebook' ? 'Preview' : 'Notebook'}
                </LiuliButton>

                <div className="btn-separator" />

                {/* 导出菜单 (Centered Modal Trigger) */}
                <div style={{ position: 'relative' }}>
                    <LiuliButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        title={t('report.export.download')}
                        rightIcon={<ChevronDown size={14} className="opacity-50" />}
                        leftIcon={<Download size={14} />}
                    >
                        {t('report.export.download')}
                    </LiuliButton>

                    {isExportMenuOpen && createPortal(
                        <>
                            {/* Backdrop */}
                            <div
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: Z_INDEX?.MODAL_BACKDROP || 1000,
                                    background: 'rgba(0, 0, 0, 0.4)', // Dim background
                                    backdropFilter: 'blur(2px)',
                                    cursor: 'default'
                                }}
                                onClick={() => setIsExportMenuOpen(false)}
                            />

                            {/* Centered Modal */}
                            <LiuliGlass
                                className="export-modal"
                                padding="medium"
                                style={{
                                    position: 'fixed',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: Z_INDEX?.MODAL || 1001,
                                    width: '320px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }}
                            >
                                {/* Modal Header */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '4px',
                                    paddingBottom: '12px',
                                    borderBottom: '1px solid var(--glass-border-light)'
                                }}>
                                    <h3 style={{
                                        margin: 0,
                                        fontWeight: 600,
                                        fontSize: '16px',
                                        color: 'var(--text-primary)'
                                    }}>
                                        {t('report.export.download')}
                                    </h3>
                                    <LiuliButton
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsExportMenuOpen(false)}
                                        style={{ width: '24px', height: '24px', padding: 0 }}
                                    >
                                        <X size={16} />
                                    </LiuliButton>
                                </div>

                                {/* Options */}
                                <LiuliButton
                                    variant="secondary"
                                    size="md"
                                    onClick={() => {
                                        handleExportMarkdown();
                                        setIsExportMenuOpen(false);
                                    }}
                                    className="menu-item-btn"
                                    leftIcon={copySuccess ? <Check size={16} /> : <FileText size={16} />}
                                >
                                    {t('report.export.exportMarkdown')}
                                </LiuliButton>

                                <LiuliButton
                                    variant="secondary"
                                    size="md"
                                    onClick={() => {
                                        handleExportHTML();
                                        setIsExportMenuOpen(false);
                                    }}
                                    className="menu-item-btn"
                                    leftIcon={<Globe size={16} />}
                                >
                                    {t('report.export.downloadHTML')}
                                </LiuliButton>

                                <LiuliButton
                                    variant="secondary"
                                    size="md"
                                    onClick={() => {
                                        handleExportColab();
                                        setIsExportMenuOpen(false);
                                    }}
                                    className="menu-item-btn"
                                    leftIcon={<FileCode size={16} />}
                                >
                                    {t('report.export.downloadIpynb')}
                                </LiuliButton>
                            </LiuliGlass>
                        </>,
                        window.document.body
                    )}
                </div>

                <div className="btn-separator" />

                {/* 签字并锁定 */}
                <LiuliButton
                    variant="primary"
                    size="sm"
                    onClick={handleSignReport}
                    disabled={document.isSigned}
                    leftIcon={<Check size={14} />}
                >
                    {document.isSigned ? '已签字' : t('report.audit.signReport')}
                </LiuliButton>
            </div>
        </div>
    );
}
