/**
 * ModeToggle - Notebook/Report模式切换组件
 */

import { ReportMode } from '@/types/report';
import { useI18n } from '@/contexts/I18nContext';
import './ModeToggle.css';

interface ModeToggleProps {
    mode: ReportMode;
    onChange: (mode: ReportMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
    const { t } = useI18n();

    return (
        <div className="mode-toggle">
            <button
                className={`mode-btn ${mode === 'notebook' ? 'active' : ''}`}
                onClick={() => onChange('notebook')}
            >
                📊 {t('report.mode.notebook')}
            </button>
            <button
                className={`mode-btn ${mode === 'report' ? 'active' : ''}`}
                onClick={() => onChange('report')}
            >
                📄 {t('report.mode.report')}
            </button>
        </div>
    );
}
