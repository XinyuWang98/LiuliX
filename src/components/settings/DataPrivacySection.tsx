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
                {t('settings.dataPrivacyTitle') || '数据隐私'}
            </h3>
            <p className="settings-section-desc">
                {t('settings.dataPrivacyDesc') || '选择发送给云端AI的数据形式（本地模型无需配置）'}
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
                            自动脱敏（推荐）
                            <span className="badge">推荐</span>
                        </div>
                        <div className="option-desc">
                            仅发送列名和统计信息，不含具体数据值
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
                            发送原始数据
                        </div>
                        <div className="option-desc">
                            发送采样数据到云端API以获得更准确的建议
                        </div>
                    </div>
                </label>
            </div>

            <div className="settings-note">
                💡 提示：使用本地模型时，数据完全不会离开浏览器
            </div>
        </div>
    );
}
