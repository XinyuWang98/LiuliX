import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider, useI18n } from './contexts/I18nContext';
import { EvidenceProvider } from './contexts/EvidenceContext';
import { InsightChainProvider } from './contexts/InsightChainContext';
import { NavigationBar } from './components/layout/NavigationBar';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { PromptLibrary } from './components/prompt/PromptLibrary';
import { AIWorkshopTools } from './components/workshop/AIWorkshopTools';
import { Project } from './utils/projectUtils';
import { PanelRight, PanelLeft } from 'lucide-react';
import { ExplorationFlow } from './components/exploration/ExplorationFlow';
import { pyodideManager } from './services/PyodideManager';
import { AIConfigModal } from './components/AIConfigModal';
import { useResizable } from '@/hooks/useResizable';

function LoadingScreen() {
    const { t } = useI18n();
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-main)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            color: 'var(--text-primary)',
        }}>
            <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: '3px solid var(--bg-panel)',
                borderTopColor: 'var(--primary)',
                animation: 'spin 1s linear infinite',
                marginBottom: 'var(--gap-l)',
            }} />
            <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '600', marginBottom: 'var(--gap-s)' }}>
                DataPrism AI Engine
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-m)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {t('common.initializing')}
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function AppContent() {
    const { t } = useI18n();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeView, setActiveView] = useState<'dashboard' | 'library'>('dashboard');
    const [cleaningTrigger, setCleaningTrigger] = useState(0); // 用于触发数据清洗建议生成
    const [isPyodideReady, setIsPyodideReady] = useState(false);
    const [showLeft, setShowLeft] = useState(() => localStorage.getItem('layout.showLeft') !== 'false');
    const [showRight, setShowRight] = useState(() => localStorage.getItem('layout.showRight') !== 'false');
    const [showAPISettings, setShowAPISettings] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

    // 左侧边栏拖拽处理
    const { width: leftWidth, startResizing: startLeftResizing, isResizing: isLeftResizing } = useResizable({
        initialWidth: 280,
        minWidth: 220,
        maxWidth: 500,
        direction: 'right',
        storageKey: 'layout.leftWidth'
    });

    // 右侧边栏拖拽处理
    const { width: rightWidth, startResizing: startRightResizing, isResizing: isRightResizing } = useResizable({
        initialWidth: 320,
        minWidth: 280,
        maxWidth: 600,
        direction: 'left',
        storageKey: 'layout.rightWidth'
    });

    useEffect(() => localStorage.setItem('layout.showLeft', showLeft.toString()), [showLeft]);
    useEffect(() => localStorage.setItem('layout.showRight', showRight.toString()), [showRight]);

    useEffect(() => {
        const init = async () => {
            try {
                await pyodideManager.initialize();
                await pyodideManager.waitForReady();
                setTimeout(() => setIsPyodideReady(true), 500);
            } catch (err) {
                console.error("Failed to initialize Pyodide:", err);
                setIsPyodideReady(true);
            }
        };
        init();
    }, []);

    // 后端健康检查
    useEffect(() => {
        const checkBackendHealth = async () => {
            try {
                const response = await fetch('http://localhost:3001/health', {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000) // 3秒超时
                });
                if (response.ok) {
                    setBackendStatus('connected');
                    console.log('[系统] 后端服务已连接');
                } else {
                    throw new Error('Health check failed');
                }
            } catch (error) {
                setBackendStatus('disconnected');
                console.warn('[系统] 后端服务未启动，AI 功能已降级');
            }
        };

        // 首次检查
        if (isPyodideReady) {
            checkBackendHealth();
            // 每30秒重新检查一次
            const interval = setInterval(checkBackendHealth, 30000);
            return () => clearInterval(interval);
        }
    }, [isPyodideReady]);

    // ⚠️ MVP阶段：免费提供API Key服务，暂时禁用自动弹窗
    // 等到正式部署上线后再启用此功能，引导用户配置自己的Key
    // 首次加载检测 - 自动弹出API设置（已禁用）
    // useEffect(() => {
    //     const hasConfigured = localStorage.getItem('api_configured');
    //     if (!hasConfigured && isPyodideReady) {
    //         setShowAPISettings(true);
    //     }
    // }, [isPyodideReady]);

    if (!isPyodideReady) {
        return <LoadingScreen />;
    }

    return (
        <div className="app-container" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            cursor: (isLeftResizing || isRightResizing) ? 'col-resize' : 'default', // 全局光标控制
        }}>
            <NavigationBar
                onOpenAPISettings={() => setShowAPISettings(true)}
                backendStatus={backendStatus}
            />

            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                position: 'relative',
            }}>
                {showLeft ? (
                    <div className="sidebar-enter" style={{
                        width: leftWidth,
                        flexShrink: 0,
                        display: 'flex',
                        position: 'relative',
                    }}>
                        <LeftSidebar
                            onProjectSelect={(project) => {
                                setSelectedProject(project);
                                setActiveView('dashboard');
                            }}
                            onClose={() => setShowLeft(false)}
                        />
                        {/* Drag Handle */}
                        <div
                            onMouseDown={startLeftResizing}
                            style={{
                                position: 'absolute',
                                right: '-4px',
                                top: 'var(--gap-m)',
                                bottom: 'var(--gap-m)',
                                width: '8px',
                                cursor: 'col-resize',
                                zIndex: 10,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            title="Drag to resize"
                        >
                            <div style={{
                                width: '2px',
                                height: '100%',
                                background: isLeftResizing ? 'var(--primary)' : 'transparent',
                                transition: 'background 0.2s',
                                borderRadius: '1px',
                            }} />
                        </div>
                    </div>
                ) : (
                    <div
                        className="glass-panel"
                        style={{
                            width: '48px',
                            margin: 'var(--gap-m)',
                            marginRight: 0,
                            height: 'calc(100% - 2 * var(--gap-m))',
                            borderRadius: 'var(--radius-l)',
                            overflow: 'hidden',
                            border: 'none',
                            background: 'var(--bg-panel)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: 'var(--gap-m)',
                            flexShrink: 0,
                        }}>
                        <button
                            className="btn-ghost"
                            onClick={() => setShowLeft(true)}
                            title="展开侧边栏"
                            style={{ padding: '8px', color: 'var(--text-secondary)' }}
                        >
                            <PanelLeft size={20} />
                        </button>
                    </div>
                )}

                <div
                    className="glass-panel"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'row',
                        margin: 'var(--gap-m)',
                        height: 'calc(100% - 2 * var(--gap-m))',
                        borderRadius: 'var(--radius-l)',
                        overflow: 'hidden',
                        border: 'none',
                    }}>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        minWidth: 0,
                    }}>
                        {activeView === 'dashboard' ? (
                            <ExplorationFlow
                                project={selectedProject}
                                onNavigate={(view) => setActiveView(view as 'dashboard' | 'library')}
                                cleaningTrigger={cleaningTrigger}
                                onProjectUpdate={setSelectedProject}
                                aiSuggestions={aiSuggestions}
                            />
                        ) : (
                            <PromptLibrary
                                activeView={activeView}
                                onNavigate={setActiveView}
                            />
                        )}
                    </div>
                </div>

                {showRight ? (
                    <div style={{
                        width: rightWidth,
                        flexShrink: 0,
                        display: 'flex',
                        position: 'relative', // for handle positioning
                    }}>
                        {/* 拖拽手柄 (左侧) */}
                        <div
                            onMouseDown={startRightResizing}
                            style={{
                                position: 'absolute',
                                left: '-4px', // 向左偏移覆盖空隙
                                top: 'var(--gap-m)',
                                bottom: 'var(--gap-m)',
                                width: '8px',
                                cursor: 'col-resize',
                                zIndex: 10,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            title="Drag to resize"
                        >
                            {/* 可视化指示条 */}
                            <div style={{
                                width: '2px',
                                height: '100%',
                                background: isRightResizing ? 'var(--primary)' : 'transparent',
                                transition: 'background 0.2s',
                                borderRadius: '1px',
                            }} />
                        </div>

                        <div
                            className="glass-panel"
                            style={{
                                width: '100%',
                                flexShrink: 0,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                margin: 'var(--gap-m)',
                                height: 'calc(100% - 2 * var(--gap-m))',
                                marginLeft: 0,
                                borderLeft: 'none',
                            }}>
                            <aside style={{
                                width: '100%',
                                height: '100%',
                                padding: 0,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-end',
                                    padding: '24px var(--gap-l) 24px',
                                    flexShrink: 0,
                                }}>
                                    <h2 style={{
                                        fontSize: 'var(--fs-xxl)',
                                        fontWeight: 'var(--fw-bold)',
                                        margin: 0,
                                        color: 'var(--text-primary)',
                                        whiteSpace: 'nowrap',
                                        lineHeight: 1,
                                    }}>
                                        {t('workshop.title')}
                                    </h2>
                                    <button
                                        className="btn-ghost"
                                        onClick={() => setShowRight(false)}
                                        style={{
                                            padding: '4px',
                                            borderRadius: 'var(--radius-s)',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                        }}
                                        title={t('sidebar.collapse')}
                                    >
                                        <PanelRight size={18} />
                                    </button>
                                </div>
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: 'var(--gap-l)',
                                }}>
                                    <AIWorkshopTools
                                        project={selectedProject}
                                        onToolClick={(toolId) => {
                                            if (toolId === 'cleaning') {
                                                setCleaningTrigger(prev => prev + 1);
                                            }
                                        }}
                                        onSuggestionsGenerated={(suggestions) => {
                                            setAiSuggestions(suggestions);
                                            console.log('[App] 收到AI建议:', suggestions.length);
                                        }}
                                    />
                                </div>
                            </aside>
                        </div>
                    </div>
                ) : (
                    <div
                        className="glass-panel"
                        style={{
                            width: '48px',
                            margin: 'var(--gap-m)',
                            marginLeft: 0,
                            height: 'calc(100% - 2 * var(--gap-m))',
                            borderRadius: 'var(--radius-l)',
                            overflow: 'hidden',
                            border: 'none',
                            background: 'var(--bg-panel)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: 'var(--gap-m)',
                            flexShrink: 0,
                        }}>
                        <button
                            className="btn-ghost"
                            onClick={() => setShowRight(true)}
                            title="展开侧边栏"
                            style={{ padding: '8px', color: 'var(--text-secondary)' }}
                        >
                            <PanelRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {showAPISettings && <AIConfigModal isOpen={showAPISettings} onClose={() => setShowAPISettings(false)} />}
        </div>
    );
}

export default function App() {
    return (
        <I18nProvider>
            <ThemeProvider>
                <EvidenceProvider>
                    <InsightChainProvider>
                        <AppContent />
                    </InsightChainProvider>
                </EvidenceProvider>
            </ThemeProvider>
        </I18nProvider>
    );
}
