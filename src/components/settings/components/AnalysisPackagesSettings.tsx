/**
 * 分析能力包设置组件 (V4: 扁平化库配置)
 * 重构说明：
 * 1. 移除能力包层级，改为扁平化库列表
 * 2. 新增全局策略开关（自动加载 vs 过滤建议）
 * 3. 复用现有 .settings-option 样式
 */

import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsGroup } from './SettingsSection';
import {
    getEnabledFonts,
    setEnabledFonts
} from '@/config/analysisPackages';
import { libraryConfigs } from '@/config/libraryConfig';
import {
    getEnabledLibraries,
    toggleLibrary,
    getLibraryMissingStrategy,
    setLibraryMissingStrategy
} from '@/config/libraryStorage';
import { LibraryMissingStrategy } from '@/types/analysisPackage';
import { Type } from 'lucide-react';
import '../SettingsPage.css';

export const AnalysisPackagesSettings = () => {
    const { t, language } = useI18n();
    const fontSettings = getEnabledFonts(language.code);

    // 状态管理
    const [enabledLibraries, setEnabledLibrariesState] = useState<string[]>(getEnabledLibraries());
    const [missingStrategy, setMissingStrategyState] = useState<LibraryMissingStrategy>(
        getLibraryMissingStrategy()
    );
    const [enabledFontIds, setEnabledFontIds] = useState<string[]>(fontSettings.fonts);

    const isSimHeiEnabled = enabledFontIds.includes('simhei');

    // 切换库启用状态
    const handleToggleLibrary = (libraryName: string) => {
        toggleLibrary(libraryName);
        setEnabledLibrariesState(getEnabledLibraries());
    };

    // 切换全局策略
    const handleStrategyChange = (strategy: LibraryMissingStrategy) => {
        setLibraryMissingStrategy(strategy);
        setMissingStrategyState(strategy);
    };

    // 切换中文字体
    const handleToggleChineseFont = () => {
        const newFonts = isSimHeiEnabled ? [] : ['simhei'];
        setEnabledFontIds(newFonts);
        setEnabledFonts(newFonts);
    };

    return (
        <>
            <h2 className="settings-section-title">
                {t('settings.pythonLibraries')}
            </h2>
            <p className="settings-section-desc">
                {t('settings.pythonLibrariesDesc')}
            </p>

            {/* 全局策略开关 */}
            <SettingsGroup>
                <div className="settings-group-title">
                    {t('settings.libraryMissingStrategy')}
                </div>
                <div className="settings-options">
                    <label className="settings-option">
                        <input
                            type="radio"
                            name="library-strategy"
                            checked={missingStrategy === LibraryMissingStrategy.AUTO_LOAD}
                            onChange={() => handleStrategyChange(LibraryMissingStrategy.AUTO_LOAD)}
                        />
                        <div className="option-content">
                            <div className="option-label">
                                {t('settings.strategy.autoLoad')}
                                <span className="badge default">{t('settings.recommended')}</span>
                            </div>
                            <div className="option-desc">
                                {t('settings.strategy.autoLoadDesc')}
                            </div>
                        </div>
                    </label>

                    <label className="settings-option">
                        <input
                            type="radio"
                            name="library-strategy"
                            checked={missingStrategy === LibraryMissingStrategy.FILTER_SUGGESTIONS}
                            onChange={() => handleStrategyChange(LibraryMissingStrategy.FILTER_SUGGESTIONS)}
                        />
                        <div className="option-content">
                            <div className="option-label">
                                {t('settings.strategy.filter')}
                            </div>
                            <div className="option-desc">
                                {t('settings.strategy.filterDesc')}
                            </div>
                        </div>
                    </label>
                </div>
            </SettingsGroup>

            {/* 扁平化库列表 */}
            <SettingsGroup>
                <div className="settings-group-title">
                    {t('settings.availableLibraries')}
                </div>
                <div className="library-list">
                    {libraryConfigs.map(lib => {
                        const isEnabled = enabledLibraries.includes(lib.name);

                        return (
                            <div key={lib.name} className="library-row">
                                <div className="library-main">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        disabled={lib.isRequired}
                                        onChange={() => handleToggleLibrary(lib.name)}
                                        className={`lib-checkbox ${lib.isRequired ? 'disabled' : ''}`}
                                    />

                                    {/* Library info */}
                                    <div className="library-info">
                                        <span className="lib-name">{lib.name}</span>
                                        {lib.isRequired && (
                                            <span className="badge default">
                                                {t('settings.required')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Meta info */}
                                <div className="library-meta">
                                    {lib.sizeEstimate && (
                                        <span className="lib-size">{lib.sizeEstimate}</span>
                                    )}
                                    {lib.loadTime && (
                                        <span className="lib-load-time">{lib.loadTime}</span>
                                    )}
                                    <span className="lib-usage">
                                        {t('settings.usedBy', { count: lib.usedByPrompts.length })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SettingsGroup>

            {/* Font Settings - 保持原样 */}
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
