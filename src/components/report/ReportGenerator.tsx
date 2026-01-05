/**
 * ReportGenerator - 旧版报告生成器 (DEPRECATED)
 * 
 * ⚠️ 此组件已被 ReportWorkbench 替代，仅保留用于旧版 ExplorationFlow.tsx 兼容性。
 * 新项目请使用 ContentPanel.tsx 中的 ReportWorkbench。
 * 
 * 功能：简单的证据池 + Notebook 开关
 */

import { useState } from 'react';
import { getCurrentRoleConfig } from '@/config/userRolePresets';
import { useI18n } from '@/contexts/I18nContext';
// ReportNotebook 已改为受控组件，此处无法直接使用，暂时移除
// import { ReportNotebook } from './ReportNotebook';
import { EvidencePoolHorizontal } from '@/components/evidence/EvidencePoolHorizontal';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './ReportGenerator.css';

export function ReportGenerator() {
    const { t } = useI18n();
    const roleConfig = getCurrentRoleConfig();

    // 从角色配置初始化 Notebook 显示状态
    const [showNotebook, setShowNotebook] = useState(() => {
        const userPreference = localStorage.getItem('reports_notebook_manual');
        if (userPreference !== null) {
            return userPreference === 'true';
        }

        const roleDefault = localStorage.getItem('reports_show_notebook');
        return roleDefault === 'true' || (roleDefault === null && roleConfig.reports?.showNotebook !== false);
    });

    const handleToggle = () => {
        const newValue = !showNotebook;
        setShowNotebook(newValue);
        localStorage.setItem('reports_notebook_manual', String(newValue));
    };

    return (
        <div className="report-generator-container">
            {/* 证据池 - 横向展示并置顶 */}
            <EvidencePoolHorizontal />

            {/* Notebook 展开/收起按钮 */}
            <button
                className="notebook-toggle-btn"
                onClick={handleToggle}
                title={showNotebook ? t('common.collapse') : t('common.expand')}
            >
                {showNotebook ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>{showNotebook ? t('report.hideNotebook') : t('report.showNotebook')}</span>
            </button>

            {/* 分析报告内容 - ReportNotebook 已移除，因与新架构不兼容 */}
            {showNotebook && (
                <div className="deprecated-notice">
                    📌 {t('report.useNewWorkbench') || 'Please use ContentPanel for full report features'}
                </div>
            )}
        </div>
    );
}
