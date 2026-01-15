import { useI18n } from '@contexts/I18nContext';
import { Settings, User } from 'lucide-react';
import { Logo } from '@/components/common/Logo/Logo';
import { DiscordIcon } from '@/components/common/DiscordIcon';
import { FreeTrialBadge } from '@/components/Header/FreeTrialBadge';
import '@/components/Header/FreeTrialBadge.css';
import './NavigationBar.css';

interface NavigationBarProps {
    onOpenAPISettings?: () => void;
    backendStatus?: 'connected' | 'disconnected' | 'checking';
    activeView?: 'dashboard' | 'library' | 'v2' | 'design' | 'welcome' | 'whitepaper';
}

export function NavigationBar({
    onOpenAPISettings,
    backendStatus = 'checking',
    activeView = 'dashboard'
}: NavigationBarProps = {}) {
    const { t } = useI18n();

    return (
        <header className="navigation-bar">
            {/* Left: Logo + Navigation Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Logo
                    layout="horizontal"
                    size="l"
                />

                <div className="nav-divider" />

                <nav className="nav-tabs">
                    {/* <button
                        className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
                        onClick={() => {
                            window.history.pushState(null, '', '/');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                    >
                        {t('nav.dashboard')}
                    </button> */}

                    <button
                        className={`nav-tab ${activeView === 'library' ? 'active' : ''}`}
                        onClick={() => {
                            window.history.pushState(null, '', '/prompts');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                    >
                        {t('nav.promptLibrary')}
                    </button>

                </nav>
            </div>

            {/* Right: Tools */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--gap-s)',
                }}
            >
                {/* Backend Status */}
                <div
                    title={backendStatus === 'connected' ? '后端服务已连接' : backendStatus === 'disconnected' ? '后端服务未启动，AI 功能已降级' : '正在检测后端服务...'}
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: backendStatus === 'connected' ? 'var(--success)' : backendStatus === 'disconnected' ? 'var(--warning)' : 'var(--text-secondary)',
                        boxShadow: backendStatus === 'connected' ? '0 0 8px var(--success)' : backendStatus === 'disconnected' ? '0 0 8px var(--warning)' : 'none',
                        flexShrink: 0,
                        animation: backendStatus === 'checking' ? 'pulse 1.5s infinite' : 'none',
                    }}
                />

                <FreeTrialBadge />

                <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 var(--gap-xs)' }} />

                {/* Discord Link */}
                <a
                    className="btn-ghost"
                    title="Discord"
                    href="https://discord.gg/RnDvjtrs72"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'inherit',
                        textDecoration: 'none'
                    }}
                >
                    <DiscordIcon size={18} />
                </a>

                <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 var(--gap-xs)' }} />

                {/* Settings Button */}
                <button
                    className="btn-ghost"
                    title={t('nav.settings')}
                    onClick={() => onOpenAPISettings?.()}
                >
                    <Settings size={18} />
                </button>

                <button
                    className="btn-ghost"
                    title={t('nav.user')}
                >
                    <User size={18} />
                </button>
            </div>
        </header>
    );
}
