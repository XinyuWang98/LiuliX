/**
 * 用户角色设置页面
 * 
 * 功能：
 * - 角色选择（数据分析师 vs 业务专家）
 * - 配置详情展示（只读）
 * - 立即应用配置
 */

import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsGroup, SettingsRow } from './SettingsSection';
import {
    USER_ROLE_PRESETS,
    applyRolePreset,
    getCurrentUserRole,
    type UserRole
} from '@/config/userRolePresets';
import { LineChart, Zap } from 'lucide-react';
import '../SettingsPage.css';
import './UserRoleSettings.css';

export const UserRoleSettings = () => {
    const { t } = useI18n();
    const [userRole, setUserRole] = useState<UserRole>(getCurrentUserRole);

    const config = USER_ROLE_PRESETS[userRole];

    /**
     * 处理角色切换
     */
    const handleRoleChange = (newRole: UserRole) => {
        setUserRole(newRole);
        applyRolePreset(newRole);
    };

    return (
        <>
            <h2 className="settings-section-title">{t('settings.userRole')}</h2>
            <p className="settings-section-desc">
                {t('settings.userRoleDesc')}
            </p>

            {/* 角色选择卡片 */}
            <div className="role-selection-grid">
                {/* 数据分析师 */}
                <div
                    className={`role-card ${userRole === 'analyst' ? 'active' : ''}`}
                    onClick={() => handleRoleChange('analyst')}
                >
                    <div className="role-icon-wrapper">
                        <LineChart className="role-icon-svg" />
                    </div>
                    <div className="role-title">{t('settings.roleAnalyst')}</div>
                    <div className="role-desc">
                        {t('settings.roleAnalystDesc')}
                    </div>
                    <div className="role-features">
                        {t('settings.roleAnalystFeatures').split('\n').map((feature, idx) => (
                            <div key={idx}>{feature}</div>
                        ))}
                    </div>
                </div>

                {/* 业务专家 */}
                <div
                    className={`role-card ${userRole === 'expert' ? 'active' : ''}`}
                    onClick={() => handleRoleChange('expert')}
                >
                    <div className="role-icon-wrapper">
                        <Zap className="role-icon-svg" />
                    </div>
                    <div className="role-title">{t('settings.roleExpert')}</div>
                    <div className="role-desc">
                        {t('settings.roleExpertDesc')}
                    </div>
                    <div className="role-features">
                        {t('settings.roleExpertFeatures').split('\n').map((feature, idx) => (
                            <div key={idx}>{feature}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 提示信息 */}
            <div className="settings-info-text role-info-text">
                {t('settings.roleSwitchHint')}
            </div>

            {/* 配置详情（只读展示） */}
            <div className="settings-group-title config-detail-title">
                {t('settings.currentConfigDetail')}
            </div>

            {/* 数据清洗配置 */}
            <SettingsGroup title={t('settings.skillsModuleDataCleaning')}>
                <SettingsRow
                    label={t('settings.cleaningEngine')}
                    description={config.cleaning.enableRouter ? t('settings.cleaningRouter') : t('settings.cleaningAI')}
                    action={
                        <span className="config-value-badge">
                            {config.cleaning.enableRouter ? 'Router' : 'AI'}
                        </span>
                    }
                />
                <SettingsRow
                    label={t('settings.minSuggestions')}
                    description={t('settings.minSuggestions')}
                    action={
                        <span className="config-value-badge">{config.cleaning.minSuggestions}</span>
                    }
                />
                {config.cleaning.showSQL !== undefined && (
                    <SettingsRow
                        label={t('settings.showSQL')}
                        description={t('settings.showSQL')}
                        action={
                            <div className="config-badge-wrapper">
                                <span className="setting-badge-hint">P1</span>
                                <span className="config-value-badge">
                                    {config.cleaning.showSQL ? t('settings.defaultExpanded') : t('settings.defaultCollapsed')}
                                </span>
                            </div>
                        }
                    />
                )}
            </SettingsGroup>

            {/* 洞察分析配置 */}
            <SettingsGroup title={t('settings.skillsModuleInsightChain')}>
                <SettingsRow
                    label={t('config.maxColumns')}
                    description={t('config.maxColumnsDesc')}
                    action={<span className="config-value-badge">{config.insights.maxColumns}</span>}
                />
                <SettingsRow
                    label={t('config.timeout')}
                    description={t('config.timeoutDesc')}
                    action={<span className="config-value-badge">{config.insights.timeout}s</span>}
                />
                <SettingsRow
                    label={t('config.samplingRows')}
                    description={t('config.samplingRowsDesc')}
                    action={<span className="config-value-badge">{config.insights.samplingRows}</span>}
                />
            </SettingsGroup>

            {/* 分析报告配置（P2阶段） */}
            {config.reports && (
                <SettingsGroup title={t('settings.skillsModuleAutoReport')}>
                    <SettingsRow
                        label={t('settings.reportTemplate')}
                        description={t('settings.reportTemplate')}
                        action={
                            <div className="config-badge-wrapper">
                                <span className="setting-badge-hint">P2</span>
                                <span className="config-value-badge">
                                    {config.reports.template === 'business' ? t('settings.templateBusiness') : t('settings.templateTechnical')}
                                </span>
                            </div>
                        }
                    />
                </SettingsGroup>
            )}
        </>
    );
};
