import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { ReportNotebook } from './ReportNotebook';
import { EvidencePool } from '@/components/evidence/EvidencePool';
import { FileText, Layers } from 'lucide-react';
import './ReportGenerator.css';

const ICON_SIZE = 16;

type TabType = 'notebook' | 'evidence';

export function ReportGenerator() {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<TabType>('notebook');

    return (
        <div className="report-generator-container">
            {/* Tab切换 */}
            <div className="report-tabs">
                <button
                    className={`report-tab ${activeTab === 'notebook' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notebook')}
                >
                    <FileText size={ICON_SIZE} />
                    <span>{t('report.tabs.notebook')}</span>
                </button>
                <button
                    className={`report-tab ${activeTab === 'evidence' ? 'active' : ''}`}
                    onClick={() => setActiveTab('evidence')}
                >
                    <Layers size={ICON_SIZE} />
                    <span>{t('report.tabs.evidence')}</span>
                </button>
            </div>

            {/* Tab内容 */}
            <div className="report-tab-content">
                {activeTab === 'notebook' ? <ReportNotebook /> : <EvidencePool />}
            </div>
        </div>
    );
}
