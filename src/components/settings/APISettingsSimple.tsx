/**
 * MVP阶段简易AI配置组件
 * 提供：邀请码验证 + 本地/云端模式选择
 * 云端模式使用后端内置DeepSeek API，无需用户填写API Key
 */
import { useState, useEffect } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { X, Cloud, HardDrive, Sparkles, CheckCircle, Key } from 'lucide-react';
import { hasInviteCode } from '@/utils/userIdManager';
import { InviteCodeModal } from '@/components/InviteCodeModal/InviteCodeModal';
import { isFeatureEnabled } from '@/config/featureFlags';
import './APISettings.css';

interface APISettingsSimpleProps {
    onClose: () => void;
}

export function APISettingsSimple({ onClose }: APISettingsSimpleProps) {
    const { t } = useI18n();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [isActivated, setIsActivated] = useState(hasInviteCode());
    const [selectedMode, setSelectedMode] = useState<'local' | 'cloud'>(
        localStorage.getItem('use_local_model') === 'true' ? 'local' : 'cloud'
    );

    // 监听邀请码变化
    useEffect(() => {
        const handleUpdate = () => setIsActivated(hasInviteCode());
        window.addEventListener('free-trial-update', handleUpdate);
        return () => window.removeEventListener('free-trial-update', handleUpdate);
    }, []);

    // 处理模式切换
    const handleModeChange = (mode: 'local' | 'cloud') => {
        setSelectedMode(mode);
        localStorage.setItem('use_local_model', mode === 'local' ? 'true' : 'false');
        // 触发全局更新事件
        window.dispatchEvent(new CustomEvent('ai-mode-change', { detail: mode }));
    };

    // 是否需要邀请码门槛
    const needsInviteCode = isFeatureEnabled('ENABLE_INVITE_CODE_GATE');
    const canSelectMode = !needsInviteCode || isActivated;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{
                    maxWidth: '600px',
                    width: '90%',
                    padding: 'var(--gap-xl)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--gap-l)',
                }}>
                    <h2 style={{
                        fontSize: 'var(--fs-xl)',
                        fontWeight: 'var(--fw-bold)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--gap-s)',
                        margin: 0,
                    }}>
                        <Sparkles size={24} />
                        {t('settings.aiSettings.title')}
                    </h2>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '4px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* 邀请码激活区 - 仅在门槛开启时显示 */}
                {needsInviteCode && (
                    <div style={{
                        padding: 'var(--gap-m)',
                        borderRadius: 'var(--radius-m)',
                        background: isActivated
                            ? 'rgba(0, 200, 100, 0.1)'
                            : 'var(--warning)',
                        border: `1px solid ${isActivated ? 'var(--primary)' : 'transparent'}`,
                        marginBottom: 'var(--gap-l)',
                    }}>
                        {isActivated ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-s)' }}>
                                <CheckCircle size={20} color="var(--primary)" />
                                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--primary)' }}>
                                    {t('inviteCode.hint')}
                                </span>
                            </div>
                        ) : (
                            <div>
                                <p style={{ margin: '0 0 var(--gap-s) 0', fontSize: 'var(--fs-sm)' }}>
                                    {t('settings.aiSettings.unlockFirst')}
                                </p>
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)' }}
                                >
                                    <Key size={16} />
                                    {t('inviteCode.activate')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 模式选择区 */}
                <div style={{ opacity: canSelectMode ? 1 : 0.5, pointerEvents: canSelectMode ? 'auto' : 'none' }}>
                    <label style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 'var(--fw-medium)',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: 'var(--gap-m)',
                    }}>
                        {t('settings.aiSettings.modeSelection')}
                    </label>

                    <div style={{ display: 'grid', gap: 'var(--gap-m)' }}>
                        {/* 本地模式 */}
                        <div
                            onClick={() => canSelectMode && handleModeChange('local')}
                            style={{
                                padding: 'var(--gap-m)',
                                border: `2px solid ${selectedMode === 'local' ? 'var(--primary)' : 'var(--border)'}`,
                                borderRadius: 'var(--radius-m)',
                                cursor: canSelectMode ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                background: selectedMode === 'local' ? 'rgba(0, 200, 100, 0.05)' : 'var(--bg-main)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--gap-m)' }}>
                                <HardDrive size={32} color={selectedMode === 'local' ? 'var(--primary)' : 'var(--text-secondary)'} />
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: 'var(--fs-m)',
                                        fontWeight: 'var(--fw-medium)',
                                        marginBottom: 'var(--gap-xs)',
                                        color: selectedMode === 'local' ? 'var(--primary)' : 'var(--text-primary)',
                                    }}>
                                        {t('settings.aiSettings.localMode')}
                                    </div>
                                    <div style={{
                                        fontSize: 'var(--fs-sm)',
                                        color: 'var(--text-secondary)',
                                        marginBottom: 'var(--gap-xs)',
                                    }}>
                                        {t('settings.aiSettings.localModeDesc')}
                                    </div>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        background: 'rgba(0, 200, 100, 0.1)',
                                        color: 'var(--primary)',
                                        borderRadius: 'var(--radius-s)',
                                        fontSize: 'var(--fs-xs)',
                                    }}>
                                        {t('settings.aiSettings.unlimited')}
                                    </div>
                                </div>
                                {selectedMode === 'local' && (
                                    <CheckCircle size={20} color="var(--primary)" />
                                )}
                            </div>
                        </div>

                        {/* 云端模式 */}
                        <div
                            onClick={() => canSelectMode && handleModeChange('cloud')}
                            style={{
                                padding: 'var(--gap-m)',
                                border: `2px solid ${selectedMode === 'cloud' ? 'var(--primary)' : 'var(--border)'}`,
                                borderRadius: 'var(--radius-m)',
                                cursor: canSelectMode ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                background: selectedMode === 'cloud' ? 'rgba(0, 200, 100, 0.05)' : 'var(--bg-main)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--gap-m)' }}>
                                <Cloud size={32} color={selectedMode === 'cloud' ? 'var(--primary)' : 'var(--text-secondary)'} />
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: 'var(--fs-m)',
                                        fontWeight: 'var(--fw-medium)',
                                        marginBottom: 'var(--gap-xs)',
                                        color: selectedMode === 'cloud' ? 'var(--primary)' : 'var(--text-primary)',
                                    }}>
                                        {t('settings.aiSettings.cloudMode')}
                                    </div>
                                    <div style={{
                                        fontSize: 'var(--fs-sm)',
                                        color: 'var(--text-secondary)',
                                        marginBottom: 'var(--gap-xs)',
                                    }}>
                                        {t('settings.aiSettings.cloudModeDescNew')}
                                    </div>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        background: 'var(--warning)',
                                        borderRadius: 'var(--radius-s)',
                                        fontSize: 'var(--fs-xs)',
                                    }}>
                                        {t('settings.aiSettings.quotaBased')}
                                    </div>
                                </div>
                                {selectedMode === 'cloud' && (
                                    <CheckCircle size={20} color="var(--primary)" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 提示信息 */}
                <div style={{
                    marginTop: 'var(--gap-l)',
                    padding: 'var(--gap-m)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-m)',
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                }}>
                    💡 {selectedMode === 'local' ? t('settings.modelLogicLocal') : t('settings.aiSettings.cloudModeHint')}
                </div>
            </div>

            {/* 邀请码输入弹窗 */}
            {showInviteModal && (
                <InviteCodeModal
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => {
                        setShowInviteModal(false);
                        setIsActivated(true);
                    }}
                />
            )}
        </div>
    );
}
