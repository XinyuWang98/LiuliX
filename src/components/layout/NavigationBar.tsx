import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { ThemeSwitcher } from '@components/common/ThemeSwitcher';
import { Settings, User } from 'lucide-react';
import { Logo } from '@/components/common/Logo/Logo';

interface NavigationBarProps {
    onOpenAPISettings?: () => void;
    backendStatus?: 'connected' | 'disconnected' | 'checking';
}

export function NavigationBar({ onOpenAPISettings, backendStatus = 'checking' }: NavigationBarProps = {}) {
    const { t, language, setLanguage } = useI18n();
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Close settings when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header
            style={{
                height: 'var(--nav-height)',
                // borderBottom: '1px solid var(--border)', // Removed as requested
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between', // Changed to space-between since middle is gone
                padding: '0 var(--gap-l)', // Added padding directly
                flexShrink: 0,
                zIndex: 100,
                position: 'relative',
                background: 'transparent', // No rectangle/background
            }}
        >
            {/* 左侧: LiuliX Logo */}
            <Logo layout="horizontal" size="m" />

            {/* 右侧:工具栏 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--gap-s)',
                }}
            >
                {/* 后端状态指示灯 */}
                <div
                    title={backendStatus === 'connected' ? '后端服务已连接' : backendStatus === 'disconnected' ? '后端服务未启动，AI 功能已降级' : '正在检测后端服务...'}
                    style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: backendStatus === 'connected' ? 'var(--success)' : backendStatus === 'disconnected' ? 'var(--warning)' : 'var(--text-secondary)',
                        boxShadow: backendStatus === 'connected' ? '0 0 8px var(--success)' : backendStatus === 'disconnected' ? '0 0 8px var(--warning)' : 'none',
                        flexShrink: 0,
                        animation: backendStatus === 'checking' ? 'pulse 1.5s infinite' : 'none',
                    }}
                />

                <ThemeSwitcher />

                <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 var(--gap-xs)' }} />

                {/* Settings Dropdown */}
                <div style={{ position: 'relative' }} ref={settingsRef}>
                    <button
                        className="btn-ghost"
                        title={t('nav.settings')}
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            color: showSettings ? 'var(--primary)' : 'var(--text-secondary)'
                        }}
                    >
                        <Settings size={18} />
                    </button>

                    {showSettings && (
                        <div className="glass-panel" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            padding: 'var(--gap-s)',
                            borderRadius: 'var(--radius-m)',
                            minWidth: '160px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--gap-s)',
                            boxShadow: 'var(--shadow-lg)',
                            border: '1px solid var(--border)',
                            zIndex: 1000,
                        }}>
                            {/* Language Options */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', paddingLeft: '8px', textTransform: 'uppercase' }}>
                                    {t('language.title')}
                                </span>
                                <button
                                    onClick={() => { setLanguage('en-US'); setShowSettings(false); }}
                                    className="btn-ghost"
                                    style={{
                                        justifyContent: 'flex-start',
                                        padding: '8px',
                                        fontSize: 'var(--fs-sm)',
                                        background: language.code === 'en-US' ? 'var(--bg-hover)' : 'transparent',
                                        color: language.code === 'en-US' ? 'var(--primary)' : 'var(--text-primary)',
                                    }}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => { setLanguage('zh-CN'); setShowSettings(false); }}
                                    className="btn-ghost"
                                    style={{
                                        justifyContent: 'flex-start',
                                        padding: '8px',
                                        fontSize: 'var(--fs-sm)',
                                        background: language.code === 'zh-CN' ? 'var(--bg-hover)' : 'transparent',
                                        color: language.code === 'zh-CN' ? 'var(--primary)' : 'var(--text-primary)',
                                    }}
                                >
                                    中文 (简体)
                                </button>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

                            {/* API Config */}
                            <button
                                onClick={() => {
                                    setShowSettings(false);
                                    onOpenAPISettings?.();
                                }}
                                className="btn-ghost"
                                style={{
                                    justifyContent: 'flex-start',
                                    padding: '8px',
                                    fontSize: 'var(--fs-sm)',
                                }}
                            >
                                ⚙️ {t('settings.apiConfig')}
                            </button>
                        </div>
                    )}
                </div>

                <button
                    className="btn-ghost"
                    title={t('nav.user')}
                >
                    <User size={18} />
                </button>
            </div>
        </header >
    );
}
