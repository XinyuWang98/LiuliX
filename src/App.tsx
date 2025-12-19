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

    // 首次加载检测 - 自动弹出API设置
    useEffect(() => {
        const hasConfigured = localStorage.getItem('api_configured');
        if (!hasConfigured && isPyodideReady) {
            setShowAPISettings(true);
        }
    }, [isPyodideReady]);

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
        }}>
            <NavigationBar onOpenAPISettings={() => setShowAPISettings(true)} />

            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                position: 'relative',
            }}>
                {showLeft ? (
                    <div style={{
                        width: '25%',
                        flexShrink: 0,
                        display: 'flex',
                        overflow: 'hidden',
                    }}>
                        <LeftSidebar
                            onProjectSelect={(project) => {
                                setSelectedProject(project);
                                setActiveView('dashboard');
                            }}
                            onClose={() => setShowLeft(false)}
                        />
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
                    <div
                        className="glass-panel"
                        style={{
                            width: '25%',
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
