/**
 * 分析能力包设置组件 (Final Polish V3)
 * 1. 修复硬编码: 图表显示配置 -> t('settings.chartDisplayConfig')
 * 2. 移除未使用的 imports (chartFonts)
 */

import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsGroup } from './SettingsSection';
import {
    analysisPackages,
    getEnabledPackages,
    setEnabledPackages,
    getEnabledFonts,
    setEnabledFonts
} from '@/config/analysisPackages';
import { AnalysisPackage } from '@/types/analysisPackage';
import { ChevronDown, ChevronRight, Type } from 'lucide-react';
import '../SettingsPage.css';

interface AnalysisPackagesSettingsProps {
    onPackagesChange?: (enabledIds: string[]) => void;
}

export const AnalysisPackagesSettings = ({ onPackagesChange }: AnalysisPackagesSettingsProps) => {
    const { t, language } = useI18n();
    const fontSettings = getEnabledFonts(language.code);

    /* MVP: 仅关注中文(simhei)，默认启用中文环境下的字体 */
    const [enabledIds, setEnabledIds] = useState<string[]>(getEnabledPackages());
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [enabledFontIds, setEnabledFontIds] = useState<string[]>(fontSettings.fonts);

    const isSimHeiEnabled = enabledFontIds.includes('simhei');

    // 切换能力包启用状态
    const handleTogglePackage = (pkg: AnalysisPackage, e?: React.MouseEvent) => {
        if (pkg.isBuiltIn) return;
        e?.stopPropagation();

        setEnabledIds(prev => {
            const newIds = prev.includes(pkg.id)
                ? prev.filter(id => id !== pkg.id)
                : [...prev, pkg.id];

            setEnabledPackages(newIds);
            onPackagesChange?.(newIds);
            return newIds;
        });
    };

    const handleToggleExpand = (pkgId: string) => {
        setExpandedIds(prev =>
            prev.includes(pkgId) ? prev.filter(id => id !== pkgId) : [...prev, pkgId]
        );
    };

    const handleToggleChineseFont = () => {
        const newFonts = isSimHeiEnabled ? [] : ['simhei'];
        setEnabledFontIds(newFonts);
        setEnabledFonts(newFonts);
    };

    // checkbox样式使用CSS类 .pkg-checkbox

    // 辅助文本样式：使用 CSS 变量，无硬编码
    const subtleTextStyle = {
        color: 'var(--text-secondary)',
        fontSize: '12px',
        fontWeight: 400
    };

    return (
        <>
            <h2 className="settings-section-title">
                {t('settings.analysisPackages')}
            </h2>
            <p className="settings-section-desc">
                {t('settings.analysisPackagesDesc')}
            </p>

            {/* Packaging List - Grid Layout */}
            <div className="analysis-packages-grid">
                {analysisPackages.map(pkg => {
                    const isEnabled = enabledIds.includes(pkg.id) || pkg.isBuiltIn;
                    const isExpanded = expandedIds.includes(pkg.id);

                    return (
                        <div
                            key={pkg.id}
                            className={`analysis-pkg-card ${isExpanded ? 'expanded' : ''}`}
                        >
                            <div
                                className="analysis-pkg-header"
                                onClick={() => handleToggleExpand(pkg.id)}
                            >
                                <div className="analysis-pkg-main">
                                    <div
                                        className="pkg-checkbox-wrapper"
                                        onClick={(e) => handleTogglePackage(pkg, e)}
                                    >
                                        {pkg.isBuiltIn ? (
                                            <input
                                                type="checkbox"
                                                checked={true}
                                                disabled={true}
                                                className="pkg-checkbox pkg-checkbox-disabled"
                                            />
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={() => { }}
                                                className="pkg-checkbox"
                                            />
                                        )}
                                    </div>

                                    <span className="text-xl opacity-80" style={{ color: isEnabled ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{pkg.icon}</span>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {t(pkg.name)}
                                            </span>
                                            {pkg.isBuiltIn && (
                                                <span className="pkg-badge pkg-badge-builtin">
                                                    {t('settings.builtIn')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Size + Chevron */}
                                <div className="flex items-center gap-4 text-secondary-text">
                                    <span className="pkg-size-badge">
                                        {t(pkg.sizeEstimate)}
                                    </span>
                                    {isExpanded ? <ChevronDown size={18} color="var(--text-secondary)" /> : <ChevronRight size={18} color="var(--text-secondary)" />}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="analysis-pkg-content">
                                    <div className="analysis-methods-grid">
                                        {pkg.methods.map(method => (
                                            <div key={method.promptId} className="method-grid-card">
                                                <div className="method-card-header">
                                                    <span className="font-medium text-sm" style={{ color: 'var(--text-accent)' }}>
                                                        {t(method.name)}
                                                    </span>
                                                </div>
                                                <div className="method-card-desc" style={{ color: 'var(--text-secondary)' }}>
                                                    {t(method.description)}
                                                </div>
                                                <div className="method-card-tags">
                                                    {method.outputCharts.map((chart, i) => (
                                                        <span key={i} className="chart-tag">
                                                            {t(chart)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Font Settings - Switch Card */}
            <SettingsGroup>
                <div className="settings-group-title">
                    {t('settings.chartDisplayConfig')}
                </div>
                <div className="font-setting-card">
                    <div className="font-setting-main">
                        <div className="font-icon-wrapper">
                            <Type size={20} />
                        </div>
                        <div className="font-info">
                            <div className="font-header">
                                <span className="font-title">
                                    {t('settings.simheiTitle')}
                                </span>
                                <span className="font-size-badge">{t('settings.simheiSize')}</span>
                            </div>
                            <span className="font-desc">
                                {t('settings.simheiDesc')}
                            </span>
                        </div>
                    </div>
                    <label className="switch-label">
                        <input
                            type="checkbox"
                            checked={isSimHeiEnabled}
                            onChange={handleToggleChineseFont}
                            className="switch-input"
                        />
                        <div className={`switch-track ${isSimHeiEnabled ? 'checked' : ''}`}>
                            <div className="switch-thumb"></div>
                        </div>
                    </label>
                </div>
            </SettingsGroup>
        </>
    );
};
