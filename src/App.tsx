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
import './App.css';

function LoadingScreen() {
    const { t } = useI18n();
    return (
        <div className="loading-screen">
            <div className="loading-spinner" />
            <h2 className="loading-title">
                DataPrism AI Engine
            </h2>
            <p className="loading-text">
                {t('common.initializing')}
            </p>
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
        <div className={`app-container ${(isLeftResizing || isRightResizing) ? 'resizing' : ''}`}>
            <NavigationBar
                onOpenAPISettings={() => setShowAPISettings(true)}
                backendStatus={backendStatus}
            />

            <div className="main-content-wrapper">
                {showLeft ? (
                    <div className="sidebar-container" style={{ width: leftWidth }}>
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
                            className="drag-handle drag-handle-left"
                            title="Drag to resize"
                        >
                            <div className={`drag-indicator ${isLeftResizing ? 'active' : ''}`} />
                        </div>
                    </div>
                ) : (
                    <div className="collapsed-sidebar left">
                        <button
                            className="btn-ghost sidebar-toggle-btn"
                            onClick={() => setShowLeft(true)}
                            title="展开侧边栏"
                        >
                            <PanelLeft size={20} />
                        </button>
                    </div>
                )}

                <div className="glass-panel main-panel-wrapper">
                    <div className="main-panel-content">
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
                    <div className="sidebar-container" style={{ width: rightWidth }}>
                        {/* 拖拽手柄 (左侧) */}
                        <div
                            onMouseDown={startRightResizing}
                            className="drag-handle drag-handle-right"
                            title="Drag to resize"
                        >
                            {/* 可视化指示条 */}
                            <div className={`drag-indicator ${isRightResizing ? 'active' : ''}`} />
                        </div>

                        <div className="glass-panel right-panel-container">
                            <aside className="right-panel-aside">
                                <div className="workshop-header">
                                    <h2 className="workshop-title">
                                        {t('workshop.title')}
                                    </h2>
                                    <button
                                        className="btn-ghost workshop-close-btn"
                                        onClick={() => setShowRight(false)}
                                        title={t('sidebar.collapse')}
                                    >
                                        <PanelRight size={18} />
                                    </button>
                                </div>
                                <div className="workshop-content">
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
                    <div className="collapsed-sidebar right">
                        <button
                            className="btn-ghost sidebar-toggle-btn"
                            onClick={() => setShowRight(true)}
                            title="展开侧边栏"
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
