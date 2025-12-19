import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { ThemeSwitcher } from '@components/common/ThemeSwitcher';
import { Settings, User } from 'lucide-react';

interface NavigationBarProps {
    onOpenAPISettings?: () => void;
}

export function NavigationBar({ onOpenAPISettings }: NavigationBarProps = {}) {
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
            {/* 左侧:应用标题 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '220px',
                }}
            >
                {/* Logo Icon */}
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(var(--primary-rgb), 0.3)',
                    flexShrink: 0,
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>

                {/* Logo Text */}
                <h1
                    style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        letterSpacing: '-0.5px',
                        margin: 0,
                        background: 'linear-gradient(90deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                >
                    DataPrism
                </h1>
            </div>

            {/* 右侧:工具栏 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--gap-s)',
                }}
            >
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
