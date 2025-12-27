/**
 * 数据隐私设置组件（简化MVP版）
 */

import React from 'react';
import { getPrivacyConfig, savePrivacyConfig, PrivacyMode } from '@/utils/dataPrivacy';
import { useI18n } from '@/contexts/I18nContext';

export function DataPrivacySection() {
    const { t } = useI18n();
    const [privacyMode, setPrivacyMode] = React.useState<PrivacyMode>('auto_sanitize');

    // 初始化：读取用户设置
    React.useEffect(() => {
        const config = getPrivacyConfig();
        setPrivacyMode(config.mode);
    }, []);

    // 保存设置
    const handleModeChange = (mode: PrivacyMode) => {
        setPrivacyMode(mode);
        savePrivacyConfig({ mode });
    };

    return (
        <div className="settings-section">
            <h3 className="settings-section-title">
                {t('settings.dataPrivacyTitle')}
            </h3>
            <p className="settings-section-desc">
                {t('settings.dataPrivacyDesc')}
            </p>

            <div className="settings-options">
                <label className="settings-option">
                    <input
                        type="radio"
                        name="privacy-mode"
                        value="auto_sanitize"
                        checked={privacyMode === 'auto_sanitize'}
                        onChange={() => handleModeChange('auto_sanitize')}
                    />
                    <div className="option-content">
                        <div className="option-label">
                            {t('settings.dataPrivacy.autoSanitize')}
                            <span className="badge">{t('settings.dataPrivacy.autoSanitizeBadge')}</span>
                        </div>
                        <div className="option-desc">
                            {t('settings.dataPrivacy.autoSanitizeDesc')}
                        </div>
                    </div>
                </label>

                <label className="settings-option">
                    <input
                        type="radio"
                        name="privacy-mode"
                        value="send_raw"
                        checked={privacyMode === 'send_raw'}
                        onChange={() => handleModeChange('send_raw')}
                    />
                    <div className="option-content">
                        <div className="option-label">
                            {t('settings.dataPrivacy.sendRaw')}
                        </div>
                        <div className="option-desc">
                            {t('settings.dataPrivacy.sendRawDesc')}
                        </div>
                    </div>
                </label>
            </div>

            <div className="settings-note">
                {t('settings.dataPrivacy.localModelHint')}
            </div>
        </div>
    );
}
