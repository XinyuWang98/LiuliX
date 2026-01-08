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
    const [useLocalModel, setUseLocalModel] = useState(
        localStorage.getItem('use_local_model') === 'true'
    );

    // 监听邀请码变化
    useEffect(() => {
        const handleUpdate = () => setIsActivated(hasInviteCode());
        window.addEventListener('free-trial-update', handleUpdate);
        return () => window.removeEventListener('free-trial-update', handleUpdate);
    }, []);

    // 处理模式切换
    const handleToggle = () => {
        const newValue = !useLocalModel;
        setUseLocalModel(newValue);
        localStorage.setItem('use_local_model', newValue ? 'true' : 'false');
        // 触发全局更新事件
        window.dispatchEvent(new CustomEvent('ai-mode-change', { detail: newValue ? 'local' : 'cloud' }));
    };

    // 是否需要邀请码门槛
    const needsInviteCode = isFeatureEnabled('ENABLE_INVITE_CODE_GATE');
    const canToggle = !needsInviteCode || isActivated;

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
                    maxWidth: '500px',
                    width: '90%',
                    padding: 'var(--gap-xl)',
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

                {/* 当前模式提示（前置） */}
                <div style={{
                    padding: 'var(--gap-m)',
                    background: useLocalModel
                        ? 'rgba(100, 150, 255, 0.1)'
                        : 'rgba(0, 200, 100, 0.1)',
                    borderRadius: 'var(--radius-m)',
                    border: `1px solid ${useLocalModel ? 'rgba(100, 150, 255, 0.3)' : 'var(--primary)'}`,
                    marginBottom: 'var(--gap-l)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--gap-m)',
                }}>
                    {useLocalModel ? (
                        <HardDrive size={20} color="rgba(100, 150, 255, 1)" />
                    ) : (
                        <Cloud size={20} color="var(--primary)" />
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: 'var(--fs-sm)',
                            fontWeight: 'var(--fw-medium)',
                            color: useLocalModel ? 'rgba(100, 150, 255, 1)' : 'var(--primary)',
                            marginBottom: 'var(--gap-xs)',
                        }}>
                            {useLocalModel
                                ? t('settings.aiSettings.localMode')
                                : t('settings.aiSettings.cloudMode')
                            }
                        </div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--line-height)' }}>
                            💡 {useLocalModel
                                ? t('settings.modelLogicLocal')
                                : t('settings.aiSettings.cloudModeHint')
                            }
                        </div>
                    </div>
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

                {/* 简化的模式切换 */}
                <div style={{
                    opacity: canToggle ? 1 : 0.5,
                    pointerEvents: canToggle ? 'auto' : 'none'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--gap-m)',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-m)',
                        border: '1px solid var(--border)',
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: 'var(--fs-m)',
                                fontWeight: 'var(--fw-medium)',
                                marginBottom: 'var(--gap-xs)',
                            }}>
                                {t('settings.aiSettings.useLocalModel')}
                            </div>
                            <div style={{
                                fontSize: 'var(--fs-xs)',
                                color: 'var(--text-secondary)',
                            }}>
                                {useLocalModel
                                    ? t('settings.aiSettings.localModeDesc')
                                    : t('settings.aiSettings.cloudModeDescNew')
                                }
                            </div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                            onClick={handleToggle}
                            disabled={!canToggle}
                            style={{
                                position: 'relative',
                                width: '48px',
                                height: '28px',
                                background: useLocalModel ? 'rgba(100, 150, 255, 1)' : 'var(--primary)',
                                borderRadius: '14px',
                                border: 'none',
                                cursor: canToggle ? 'pointer' : 'not-allowed',
                                transition: 'background 0.2s',
                                flexShrink: 0,
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: useLocalModel ? '22px' : '2px',
                                width: '24px',
                                height: '24px',
                                background: 'white',
                                borderRadius: '50%',
                                transition: 'left 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                {useLocalModel ? (
                                    <HardDrive size={12} color="rgba(100, 150, 255, 1)" />
                                ) : (
                                    <Cloud size={12} color="var(--primary)" />
                                )}
                            </div>
                        </button>
                    </div>
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
