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
    const [expandedIds, setExpandedIds] = useState<string[]>(analysisPackages.map(p => p.id));
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

    const checkboxStyle = {
        width: '18px',
        height: '18px',
        cursor: 'pointer',
        accentColor: 'var(--primary-color, #22d3ee)'
    };

    // 辅助文本样式：使用 CSS 变量，无硬编码
    const subtleTextStyle = {
        color: 'var(--text-secondary)',
        fontSize: '12px',
        fontWeight: 400
    };

    return (
        <>
            <h2 className="settings-section-title">
                {t('settings.analysisPackages') || '分析能力'}
            </h2>
            <p className="settings-section-desc">
                {t('settings.analysisPackagesDesc') || '勾选需要的分析能力，系统将在启动时下载对应的 Python 库'}
            </p>

            {/* Packaging List */}
            <div className="flex flex-col gap-4 mb-8">
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
                                                style={{ ...checkboxStyle, cursor: 'not-allowed', opacity: 0.8 }}
                                            />
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={() => { }}
                                                style={checkboxStyle}
                                            />
                                        )}
                                    </div>

                                    <span className="text-xl opacity-80">{pkg.icon}</span>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">
                                                {pkg.name}
                                            </span>
                                            {pkg.isBuiltIn && (
                                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded opacity-60">
                                                    {t('settings.builtIn') || '内置'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Size + Chevron */}
                                <div className="flex items-center gap-4 text-secondary-text">
                                    <span style={subtleTextStyle}>
                                        {pkg.sizeEstimate}
                                    </span>
                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="analysis-pkg-content">
                                    <div className="analysis-methods-grid">
                                        {pkg.methods.map(method => (
                                            <div key={method.promptId} className="method-grid-card">
                                                <div className="method-card-header">
                                                    <span className="font-medium text-sm text-primary-300">
                                                        {method.name}
                                                    </span>
                                                </div>
                                                <div className="method-card-desc">
                                                    {method.description}
                                                </div>
                                                <div className="method-card-tags">
                                                    {method.outputCharts.map((chart, i) => (
                                                        <span key={i} className="chart-tag">
                                                            {chart}
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
                    {t('settings.chartDisplayConfig') || '图表显示配置'}
                </div>
                <div className="font-setting-card">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-primary-400">
                            <Type size={20} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-primary-text">
                                    {/* 这里暂时保留中文硬编码，因为这是对配置项本身的描述，如果需要也可以国际化但不急 */}
                                    中文图表支持 (SimHei)
                                </span>
                                <span style={subtleTextStyle}>~10MB</span>
                            </div>
                            <span className="text-xs text-secondary-text max-w-[400px]">
                                启用后将自动下载字体文件，确保图表中的中文能正确显示。
                            </span>
                        </div>
                    </div>

                    <label className="settings-switch">
                        <input
                            type="checkbox"
                            checked={isSimHeiEnabled}
                            onChange={handleToggleChineseFont}
                        />
                        <span className="settings-slider"></span>
                    </label>
                </div>
            </SettingsGroup>
        </>
    );
};
