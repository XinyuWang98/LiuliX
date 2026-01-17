import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider, useI18n } from './contexts/I18nContext';
import { EvidenceProvider } from './contexts/EvidenceContext';
import { InsightChainProvider } from './contexts/InsightChainContext';
import { AnalysisContextProvider } from './contexts/AnalysisContext'; // 🆕 EDA 闭环
import { NavigationBar } from './components/layout/NavigationBar';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { PromptLibrary } from './components/prompt/PromptLibrary';
import { AIWorkshopTools } from './components/workshop/AIWorkshopTools';
import { FeatureFlags } from '@/utils/featureFlags'; // Feature Flag
import { isFeatureEnabled } from '@/config/featureFlags'; // 邀请码门槛检查
import { Project } from './utils/projectUtils';
import { PanelRight, PanelLeft } from 'lucide-react';
import { ExplorationFlow } from './components/exploration/ExplorationFlow';
import { ExplorationFlowV2 } from './components/ExplorationFlowV2'; // V2预览页面
import { LandingPage } from './components/landing/LandingPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { useResizable } from '@/hooks/useResizable';
import { logger } from './utils/logger';
import { LiuliShowcase } from './pages/LiuliShowcase'; // [NEW] Design System
import { initializeConfig } from './services/configService'; // [NEW 2026-01-08] Feature Flags配置
import { WhitepaperLayout } from './components/whitepaper/WhitepaperLayout'; // [NEW] Whitepaper
import './App.css';
import { ingestFilesAndCreateProject } from './utils/projectImporter';
import { saveProjects, loadProjects } from './utils/indexedDB';
import { useGlobalErrorHandler } from './hooks/useGlobalErrorHandler'; // 配额错误处理
import { Toaster } from 'react-hot-toast'; // Toast 组件


function AppContent() {
    const { t, language } = useI18n(); // t is stable and will update when language changes

    // 配额错误处理
    useGlobalErrorHandler();

    // Update document title when language changes
    useEffect(() => {
        document.title = t('common.pageTitle');
    }, [language, t]);

    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeView, setActiveView] = useState<'dashboard' | 'library' | 'workbench' | 'design' | 'welcome' | 'whitepaper'>('welcome');
    const [cleaningTrigger, setCleaningTrigger] = useState(0);
    const [showLeft, setShowLeft] = useState(() => localStorage.getItem('layout.showLeft') !== 'false');
    const [showRight, setShowRight] = useState(() => localStorage.getItem('layout.showRight') !== 'false');
    const [showAPISettings, setShowAPISettings] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

    // 导航辅助函数
    const navigateTo = (path: string) => {
        window.history.pushState(null, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    // History Router
    useEffect(() => {
        const handleRouteChange = () => {
            const pathname = window.location.pathname;
            if (pathname === '/prompts') {
                setActiveView('library');
            } else if (pathname === '/welcome') {
                setActiveView('welcome');
            } else if (pathname === '/workbench') {
                // 邀请码门槛检查：未授权用户重定向到首页
                const needsInviteCode = isFeatureEnabled('ENABLE_INVITE_CODE_GATE');
                const userHasCode = localStorage.getItem('liulix_invite_code') !== null;
                if (needsInviteCode && !userHasCode) {
                    window.history.replaceState({}, '', '/');
                    setActiveView('welcome');
                } else {
                    setActiveView('workbench');
                }
            } else if (pathname === '/design') {
                setActiveView('design'); // Design System
            } else if (pathname.startsWith('/whitepaper')) {
                setActiveView('whitepaper'); // Whitepaper Portal
            } else if (pathname === '/' || pathname === '/welcome') {
                // 根路径和 /welcome 都显示欢迎页
                setActiveView('welcome');
            }
        };

        // Check on mount
        handleRouteChange();

        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, []);

    // 页面加载时从IndexedDB恢复最新项目（修复ProjectSelector未显示Bug）
    useEffect(() => {
        const restoreLatestProject = async () => {
            try {
                const projects = await loadProjects();
                if (projects.length > 0) {
                    setSelectedProject(projects[0]);
                    logger.log('UI', '恢复最新项目', { data: { name: projects[0].name } });
                }
            } catch (error) {
                logger.error('UI', '恢复项目失败', { data: error });
            }
        };
        if (window.location.pathname === '/workbench') restoreLatestProject();
    }, []);

    // ========== Feature Flag：多层级导航 ==========
    // 当启用新导航且处于数据探索页面时，隐藏左右侧栏
    useEffect(() => {
        if (FeatureFlags.MULTI_LEVEL_NAV && activeView === 'dashboard') {
            setShowLeft(false);
            setShowRight(false);
        }
    }, [activeView]);

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

    // 后端健康检查（立即执行，不等待 Pyodide）
    useEffect(() => {
        const checkBackendHealth = async () => {
            try {
                // 环境变量优先，本地开发为空则使用 Vite Proxy
                const API_BASE_URL = import.meta.env.VITE_API_URL || '';
                const response = await fetch(`${API_BASE_URL}/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000)
                });
                if (response.ok) {
                    setBackendStatus('connected');
                    logger.log('系统', '后端服务已连接');
                } else {
                    throw new Error('Health check failed');
                }
            } catch (error) {
                setBackendStatus('disconnected');
                logger.warn('系统', 'AI后端服务未启动，功能降级');
            }
        };

        checkBackendHealth();
        const interval = setInterval(checkBackendHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    // 🆕 Feature Flags 配置初始化（2026-01-08 新增）
    const [configLoaded, setConfigLoaded] = useState(false);
    useEffect(() => {
        const loadRemoteConfig = async () => {
            await initializeConfig();
            logger.log('系统', 'Feature Flags 配置初始化完成');
            setConfigLoaded(true);
        };

        loadRemoteConfig();
    }, []);

    // 如果配置未加载完成，显示全屏 Loading
    if (!configLoaded) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-app)',
                color: 'var(--text-secondary)',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div className="spinner" />
                <div style={{ fontSize: '14px' }}>Initializing System...</div>
            </div>
        );
    }

    // 处理欢迎界面的文件上传
    const handleWelcomeUpload = async (files: any[], sampledFlags: boolean[]) => {
        try {
            logger.log('UI', '欢迎界面上传文件处理开始');
            logger.log('UI', 'Step 1: 准备themeMap');



            logger.log('UI', 'Step 2: 调用ingestFilesAndCreateProject');
            // 1. 创建新项目对象
            const newProject = await ingestFilesAndCreateProject(
                files,
                sampledFlags
            );
            logger.log('UI', 'Step 3: ingestFilesAndCreateProject完成', { data: { id: newProject?.id } });

            logger.log('UI', 'Step 4: 读取现有项目');
            // 2. 读取现有项目并追加 (防止覆盖)
            const existingProjects = await loadProjects();
            logger.log('UI', 'Step 5: 读取完成，现有项目数', { data: { count: existingProjects.length } });

            const updatedProjects = [newProject, ...existingProjects];

            logger.log('UI', 'Step 6: 保存到IndexedDB');
            // 3. 保存到 IndexedDB
            await saveProjects(updatedProjects);
            logger.log('UI', 'Step 7: IndexedDB保存完成');

            logger.log('UI', 'Step 8: 准备更新项目并导航到V2页面');
            // 4. 更新当前选中项目
            setSelectedProject(newProject);

            // 5. 导航到工作台页面（新的交互流程）
            navigateTo('/workbench');
            logger.log('UI', 'Step 9: 导航至工作台完成');

            logger.log('UI', 'Step 10: 全流程完成');
        } catch (err) {
            logger.error('UI', '项目创建失败 - 捕获异常', err);
        }
    };

    return (
        <div className={`app-container ${(isLeftResizing || isRightResizing) ? 'resizing' : ''}`}>
            {/* 工作台页面和白皮书不显示顶部导航栏 */}
            {(activeView !== 'workbench' && activeView !== 'whitepaper') && (
                <NavigationBar
                    onOpenAPISettings={() => setShowAPISettings(true)}
                    backendStatus={backendStatus}
                    activeView={activeView}
                />
            )}

            {activeView === 'library' ? (
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <PromptLibrary
                        activeView={activeView}
                        onNavigate={setActiveView}
                    />
                </div>
            ) : activeView === 'welcome' ? (
                /* [NEW] 独立欢迎页 */
                <LandingPage onFilesUploaded={handleWelcomeUpload} />
            ) : activeView === 'workbench' ? (
                /* 工作台页面：全屏显示 (若无项目则显示落地页) */
                selectedProject ? (
                    <ExplorationFlowV2
                        project={selectedProject}
                        onProjectUpdate={setSelectedProject}
                        cleaningTrigger={cleaningTrigger}
                        onFilesUploaded={handleWelcomeUpload}
                        backendStatus={backendStatus}
                        onOpenAPISettings={() => setShowAPISettings(true)}
                    />
                ) : (
                    <LandingPage onFilesUploaded={handleWelcomeUpload} />
                )
            ) : activeView === 'design' ? (
                /* [NEW] Design System Showcase */
                <LiuliShowcase />
            ) : activeView === 'whitepaper' ? (
                /* [NEW] Whitepaper Portal */
                <WhitepaperLayout onBack={() => {
                    navigateTo('/welcome');
                    setActiveView('welcome');
                }} />
            ) : selectedProject === null ? (
                /* [NEW] 独立产品首页 (无侧边栏) */
                <LandingPage onFilesUploaded={handleWelcomeUpload} />
            ) : (
                /* [EXISTING] 主工作台 (带侧边栏) */
                <div className="main-content-wrapper">
                    {(showLeft && !(FeatureFlags.MULTI_LEVEL_NAV && activeView === 'dashboard')) ? (
                        <div className="sidebar-container" style={{ width: leftWidth }}>
                            <LeftSidebar
                                onProjectSelect={(project) => {
                                    setSelectedProject(project);
                                    // 导航到工作台页面（废弃旧 dashboard）
                                    navigateTo('/workbench');
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
                            <ExplorationFlow
                                project={selectedProject}
                                onNavigate={(view) => setActiveView(view as 'dashboard' | 'library')}
                                cleaningTrigger={cleaningTrigger}
                                onProjectUpdate={setSelectedProject}
                                aiSuggestions={aiSuggestions}
                            />
                        </div>
                    </div>

                    {(showRight && !(FeatureFlags.MULTI_LEVEL_NAV && activeView === 'dashboard')) ? (
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
                                                logger.log('UI', `收到AI清洗建议: ${suggestions.length}条`);
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
            )}

            {showAPISettings && <SettingsPage onClose={() => setShowAPISettings(false)} />}
        </div>
    );
}


export default function App() {
    return (
        <I18nProvider>
            <ThemeProvider>
                <EvidenceProvider>
                    <AnalysisContextProvider>
                        <InsightChainProvider>
                            <AppContent />
                            {/* Toast 提示组件 */}
                            <Toaster position="top-right" />
                        </InsightChainProvider>
                    </AnalysisContextProvider>
                </EvidenceProvider>
            </ThemeProvider>
        </I18nProvider>
    );
}

