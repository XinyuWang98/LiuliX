import { SkillsConfigType } from '../../config/skillsConfig';
import { useI18n } from '../../contexts/I18nContext';

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
        <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-m)',
            padding: 'var(--gap-l)',
        }}>
            {/* 全局总开关 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {t('settings.skillsTitle')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {t('settings.skillsDesc')}
                    </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                    <input
                        type="checkbox"
                        checked={skillsConfig.GLOBAL_ENABLED}
                        onChange={(e) => onConfigUpdate({ GLOBAL_ENABLED: e.target.checked })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: skillsConfig.GLOBAL_ENABLED ? 'var(--success)' : 'var(--bg-hover)',
                        transition: '0.3s',
                        borderRadius: '24px',
                    }}>
                        <span style={{
                            position: 'absolute',
                            content: '',
                            height: '18px',
                            width: '18px',
                            left: skillsConfig.GLOBAL_ENABLED ? '23px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            transition: '0.3s',
                            borderRadius: '50%',
                        }} />
                    </span>
                </label>
            </div>

            {/* 模块级开关（展开区域） */}
            {skillsConfig.GLOBAL_ENABLED && (
                <>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                            {t('settings.skillsModules')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.MODULES.INSIGHT_CHAIN}
                                    onChange={(e) => onConfigUpdate({ MODULES: { ...skillsConfig.MODULES, INSIGHT_CHAIN: e.target.checked } })}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{t('settings.skillsModuleInsightChain')}</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.MODULES.DATA_CLEANING}
                                    onChange={(e) => onConfigUpdate({ MODULES: { ...skillsConfig.MODULES, DATA_CLEANING: e.target.checked } })}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{t('settings.skillsModuleDataCleaning')}</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.MODULES.CHAT_PANEL}
                                    onChange={(e) => onConfigUpdate({ MODULES: { ...skillsConfig.MODULES, CHAT_PANEL: e.target.checked } })}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{t('settings.skillsModuleChatPanel')}</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.MODULES.AUTO_REPORT}
                                    onChange={(e) => onConfigUpdate({ MODULES: { ...skillsConfig.MODULES, AUTO_REPORT: e.target.checked } })}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{t('settings.skillsModuleAutoReport')}</span>
                            </label>
                        </div>
                    </div>

                    {/* 高级功能开关 */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                            {t('settings.skillsAdvanced')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.ADVANCED.MULTI_STEP}
                                    onChange={(e) => onConfigUpdate({ ADVANCED: { ...skillsConfig.ADVANCED, MULTI_STEP: e.target.checked } })}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{t('settings.skillsAdvancedMultiStep')}</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={skillsConfig.ADVANCED.ERROR_RECOVERY}
                                    onChange={(e) => onConfigUpdate({ ADVANCED: { ...skillsConfig.ADVANCED, ERROR_RECOVERY: e.target.checked } })}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{t('settings.skillsAdvancedErrorRecovery')}</span>
                            </label>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
