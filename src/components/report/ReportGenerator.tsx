import { useI18n } from '@/contexts/I18nContext';
import { ReportNotebook } from './ReportNotebook';
import { EvidencePoolHorizontal } from '@/components/evidence/EvidencePoolHorizontal';
import './ReportGenerator.css';

export function ReportGenerator() {
    const { t } = useI18n();

    return (
        <div className="report-generator-container">
            {/* 证据池 - 横向展示并置顶 */}
            <EvidencePoolHorizontal />

            {/* 分析报告内容 */}
            <ReportNotebook />
        </div>
    );
}
