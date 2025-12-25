import { useI18n } from '@contexts/I18nContext';
import { Settings, User } from 'lucide-react';
import { Logo } from '@/components/common/Logo/Logo';

interface NavigationBarProps {
    onOpenAPISettings?: () => void;
    backendStatus?: 'connected' | 'disconnected' | 'checking';
}

export function NavigationBar({ onOpenAPISettings, backendStatus = 'checking' }: NavigationBarProps = {}) {
    const { t } = useI18n();

    return (
        <header
            style={{
                height: 'var(--nav-height)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--gap-l)',
                flexShrink: 0,
                zIndex: 100,
                position: 'relative',
                background: 'transparent',
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

                <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 var(--gap-xs)' }} />

                {/* Settings Button - 直接打开设置页 */}
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
