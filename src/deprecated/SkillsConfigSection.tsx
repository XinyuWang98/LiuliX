import { SkillsConfigType } from '../../config/skillsConfig';
import { useI18n } from '../../contexts/I18nContext';
import './SkillsConfigSection.css';

interface SkillsConfigSectionProps {
    skillsConfig: SkillsConfigType;
    onConfigUpdate: (updated: Partial<SkillsConfigType>) => void;
}

/**
 * Skills架构配置区域组件
 * 包含全局开关、模块级开关、高级功能开关
 */
export const SkillsConfigSection = ({ skillsConfig, onConfigUpdate }: SkillsConfigSectionProps) => {
    const { t } = useI18n();

    return (
        <div className="skills-config-container">
            {/* 全局总开关 */}
            <div className="skills-header-row">
                <div>
                    <div className="skills-title">
                        {t('settings.skillsTitle')}
                    </div>
                    <div className="skills-desc">
                        {t('settings.skillsDesc')}
                    </div>
                </div>
                <label className="skills-switch-label">
                    <input
                        type="checkbox"
                        checked={skillsConfig.GLOBAL_ENABLED}
                        onChange={(e) => onConfigUpdate({ GLOBAL_ENABLED: e.target.checked })}
                        className="skills-switch-input"
                    />
                    <span className={`skills-switch-slider ${skillsConfig.GLOBAL_ENABLED ? 'checked' : ''}`}>
                        <span className="skills-switch-thumb" />
                    </span>
                </label>
            </div>

            {/* 模块级开关（展开区域） */}
            {skillsConfig.GLOBAL_ENABLED && (
                <>
                    <div className="skills-section-divider">
                        <div className="skills-section-title">
                            {t('settings.skillsModules')}
                        </div>
                        <div className="skills-options-list">
                            <label className="skills-option-label">
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.MODULES.INSIGHT_CHAIN}
                                    onChange={(e) => onConfigUpdate({ MODULES: { ...skillsConfig.MODULES, INSIGHT_CHAIN: e.target.checked } })}
                                    className="skills-option-checkbox"
                                />
                                <span className="skills-option-text">{t('settings.skillsModuleInsightChain')}</span>
                            </label>
                            <label className="skills-option-label">
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.MODULES.DATA_CLEANING}
                                    onChange={(e) => onConfigUpdate({ MODULES: { ...skillsConfig.MODULES, DATA_CLEANING: e.target.checked } })}
                                    className="skills-option-checkbox"
                                />
                                <span className="skills-option-text">{t('settings.skillsModuleDataCleaning')}</span>
                            </label>
                            <label className="skills-option-label">
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.MODULES.CHAT_PANEL}
                                    onChange={(e) => onConfigUpdate({ MODULES: { ...skillsConfig.MODULES, CHAT_PANEL: e.target.checked } })}
                                    className="skills-option-checkbox"
                                />
                                <span className="skills-option-text">{t('settings.skillsModuleChatPanel')}</span>
                            </label>
                            <label className="skills-option-label">
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.MODULES.AUTO_REPORT}
                                    onChange={(e) => onConfigUpdate({ MODULES: { ...skillsConfig.MODULES, AUTO_REPORT: e.target.checked } })}
                                    className="skills-option-checkbox"
                                />
                                <span className="skills-option-text">{t('settings.skillsModuleAutoReport')}</span>
                            </label>
                        </div>
                    </div>

                    {/* 高级功能开关 */}
                    <div className="skills-section-divider">
                        <div className="skills-section-title">
                            {t('settings.skillsAdvanced')}
                        </div>
                        <div className="skills-options-list">
                            <label className="skills-option-label">
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.ADVANCED.MULTI_STEP}
                                    onChange={(e) => onConfigUpdate({ ADVANCED: { ...skillsConfig.ADVANCED, MULTI_STEP: e.target.checked } })}
                                    className="skills-option-checkbox"
                                />
                                <span className="skills-option-text">{t('settings.skillsAdvancedMultiStep')}</span>
                            </label>
                            <label className="skills-option-label">
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.ADVANCED.ERROR_RECOVERY}
                                    onChange={(e) => onConfigUpdate({ ADVANCED: { ...skillsConfig.ADVANCED, ERROR_RECOVERY: e.target.checked } })}
                                    className="skills-option-checkbox"
                                />
                                <span className="skills-option-text">{t('settings.skillsAdvancedErrorRecovery')}</span>
                            </label>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
