/**
 * ReportWorkbench - 报告工作台组件（重构版 - 使用 ReportContext）
 * 
 * 功能：
 * 1. 提供 ReportProvider（状态管理）
 * 2. 渲染证据托盘和报告编辑器
 * 3. 工具栏已迁移到 ContentPanel 的 section-header
 */

import { useReport } from '@/contexts/ReportContext';
import { useI18n } from '@/contexts/I18nContext';
import { ReportNotebook } from './ReportNotebook';
import { EvidenceTray } from './EvidenceTray';
import './ReportWorkbench.css';

export function ReportWorkbench() {
    const { t } = useI18n();
    const { document, mode, handleCellUpdate, handleReportUpdate } = useReport();

    // 空状态
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
            {/* 可折叠证据托盘 */}
            <div className="rw-tray-container">
                <EvidenceTray />
            </div>

            {/* 主编辑区域 */}
            <ReportNotebook
                document={document}
                onCellUpdate={handleCellUpdate}
                onReportUpdate={handleReportUpdate}
            />
        </div>
    );
}
