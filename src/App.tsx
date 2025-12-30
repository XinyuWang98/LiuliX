import { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider, useI18n } from './contexts/I18nContext';
import { EvidenceProvider } from './contexts/EvidenceContext';
import { InsightChainProvider } from './contexts/InsightChainContext';
import { NavigationBar } from './components/layout/NavigationBar';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { PromptLibrary } from './components/prompt/PromptLibrary';
import { AIWorkshopTools } from './components/workshop/AIWorkshopTools';
import { FeatureFlags } from '@/utils/featureFlags'; // Feature Flag
import { Project } from './utils/projectUtils';
import { PanelRight, PanelLeft } from 'lucide-react';
import { ExplorationFlow } from './components/exploration/ExplorationFlow';
import { ExplorationFlowV2 } from './components/ExplorationFlowV2'; // V2预览页面
import { LandingPage } from './components/landing/LandingPage';
import { pyodideManager } from './services/PyodideManager';
import { SettingsPage } from './components/settings/SettingsPage';
import { useResizable } from '@/hooks/useResizable';
import { logger } from './utils/logger';
import { Logo } from './components/common/Logo/Logo';
import { LiuliShowcase } from './pages/LiuliShowcase'; // [NEW] Design System
import './App.css';
import { ingestFilesAndCreateProject } from './utils/projectImporter';
import { saveProjects, loadProjects } from './utils/indexedDB';



interface LoadingScreenProps {
    progress: number;
    message: string;
}

function LoadingScreen({ progress, message }: LoadingScreenProps) {
    const { t } = useI18n();
    return (
        <div className="loading-screen">
            <Logo layout="vertical" size="l" variant="flow" />
            <div className="loading-status">
                <p className="loading-text">
                    {message || t('common.initializing')}
                </p>
                {progress > 0 && (
                    <div className="loading-progress-container">
                        <span className="loading-progress-percent">{Math.round(progress)}%</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ... imports

function AppContent() {
    const { t } = useI18n();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeView, setActiveView] = useState<'dashboard' | 'library' | 'v2' | 'design'>('dashboard');
    const [cleaningTrigger, setCleaningTrigger] = useState(0); // 用于触发数据清洗建议生成
    const [isPyodideReady, setIsPyodideReady] = useState(false);
    const [showLeft, setShowLeft] = useState(() => localStorage.getItem('layout.showLeft') !== 'false');
    const [showRight, setShowRight] = useState(() => localStorage.getItem('layout.showRight') !== 'false');
    const [showAPISettings, setShowAPISettings] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

    // Simple Hash Router
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash === '#/prompts') {
                setActiveView('library');
            } else if (hash === '#/v2') {
                setActiveView('v2' as any); // V2预览页面
            } else if (hash === '#/design') {
                setActiveView('design'); // [NEW] Design System
            } else if (hash === '#/' || hash === '') {
                setActiveView('dashboard');
            }
        };

        // Check on mount
        handleHashChange();

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
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
        if (window.location.hash === '#/v2') restoreLatestProject();
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

    const isPyodideReadyRef = useRef(false);

    useEffect(() => {
        // 防止Strict Mode重复执行
        if (isPyodideReadyRef.current) return;
        isPyodideReadyRef.current = true;

        const init = async () => {
            logger.log('系统', '应用初始化开始');
            try {
                // 🔍 WebLLM缓存诊断
                const { diagnoseWebLLMCache } = await import('./utils/webllmDiagnostics');
                diagnoseWebLLMCache().catch(err => logger.error('诊断工具', '诊断失败', err));

                // 自动启用本地模型
                if (!localStorage.getItem('use_local_model')) {
                    localStorage.setItem('use_local_model', 'true');
                    logger.log('系统', '已自动启用本地模型');
                }

                // 💡 检查是否首次运行 (用于显示友好提示)
                const isFirstRun = !localStorage.getItem('app_has_run_before');
                if (isFirstRun) {
                    // 显示首次运行提示
                    setLoadingMessage(t('common.firstTimeTip'));
                }

                // --- Phase 1: 核心环境加载 (Blocking) ---
                logger.log('Python', '阶段1: 加载核心环境...');
                setLoadingProgress(10); // 起始进度

                await pyodideManager.initialize((msg, _progress) => {
                    // 更新进度文案 (支持多语言替换)
                    if (msg.includes('Loading Pyodide')) {
                        setLoadingMessage(t('common.initCore', { current: 1, total: 3 }));
                        setLoadingProgress(30);
                    } else if (msg.includes('Loading Pandas')) {
                        setLoadingMessage(t('common.loadPandas'));
                        setLoadingProgress(60);
                    } else {
                        // 其他消息透传
                        setLoadingMessage(msg);
                    }
                });

                // 显式等待核心包就绪
                await pyodideManager.loadEssentials((msg) => {
                    logger.log('Python', msg);
                    setLoadingProgress(90);
                });

                logger.log('Python', '核心环境加载完成');
                setIsPyodideReady(true);

                // 标记非首次运行
                if (isFirstRun) {
                    localStorage.setItem('app_has_run_before', 'true');
                }

                // --- Phase 2: 用户扩展加载 (Silent/Background) ---
                // 不阻塞 UI，延迟执行避免争抢资源
                setTimeout(async () => {
                    logger.log('Python', '阶段2: 静默加载扩展包...');
                    try {
                        await pyodideManager.loadUserConfigExtensions((msg) => {
                            logger.log('Python', `[扩展] ${msg}`);
                        });
                    } catch (extErr) {
                        logger.warn('Python', '扩展包加载部分失败 (不影响主功能)', extErr);
                    }

                    // 并行启动本地模型预加载 (Silent)
                    const shouldPreload = localStorage.getItem('use_local_model') === 'true';
                    if (shouldPreload) {
                        logger.log('本地模型', '后台预加载启动...');
                        import('@/services/localLLMService').then(({ localLLMService, SUPPORTED_MODELS }) => {
                            localLLMService.reload(SUPPORTED_MODELS.QWEN_7B, (_p, _m) => {
                                // 仅记录日志，不更新 UI Loading
                                // logger.debug('本地模型', `后台进度 ${p}%: ${m}`);
                            }).catch(err => logger.warn('本地模型', '后台加载失败', err));
                        });
                    }
                }, 1000);

                logger.log('系统', '应用初始化完成');
            } catch (err) {
                logger.error('Python', '引擎加载失败', err);
                setIsPyodideReady(true);
            }
        };
        init();
    }, [t]);

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
                    logger.log('系统', '后端服务已连接');
                } else {
                    throw new Error('Health check failed');
                }
            } catch (error) {
                setBackendStatus('disconnected');
                logger.warn('系统', 'AI后端服务未启动，功能降级');
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

    // 处理欢迎界面的文件上传
    const handleWelcomeUpload = async (files: any[], sampledFlags: boolean[]) => {
        try {
            logger.log('UI', '欢迎界面上传文件处理开始');
            logger.log('UI', 'Step 1: 准备themeMap');

            const themeMap = {
                game: t('dataSource.project.themes.game'),
                sales: t('dataSource.project.themes.sales'),
                finance: t('dataSource.project.themes.finance'),
                analytics: t('dataSource.project.themes.analytics'),
                user: t('dataSource.project.themes.user'),
            };

            logger.log('UI', 'Step 2: 调用ingestFilesAndCreateProject');
            // 1. 创建新项目对象
            const newProject = await ingestFilesAndCreateProject(
                files,
                sampledFlags,
                'zh-CN', // 强制中文活 MVP 默认
                themeMap
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

            logger.log('UI', 'Step 8: 准备调用setSelectedProject');
            // 4. 更新当前选中项目 (这将触发界面切换到 ExplorationFlow)
            setSelectedProject(newProject);
            logger.log('UI', 'Step 9: setSelectedProject调用完成！！！');

            // 5. 自动展开左侧栏 (可选，增加沉浸感可不展开，但为了让用户看到文件列表，展开较好)
            setShowLeft(true);

            logger.log('UI', 'Step 10: 全流程完成');
        } catch (err) {
            logger.error('UI', '项目创建失败 - 捕获异常', err);
        }
    };

    if (!isPyodideReady) {
        return <LoadingScreen progress={loadingProgress} message={loadingMessage} />;
    }

    return (
        <div className={`app-container ${(isLeftResizing || isRightResizing) ? 'resizing' : ''}`}>
            <NavigationBar
                onOpenAPISettings={() => setShowAPISettings(true)}
                backendStatus={backendStatus}
                activeView={activeView}
            />

            {activeView === 'library' ? (
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <PromptLibrary
                        activeView={activeView}
                        onNavigate={setActiveView}
                    />
                </div>
            ) : activeView === 'v2' ? (
                /* V2预览页面：全屏显示 */
                <ExplorationFlowV2
                    project={selectedProject}
                    onProjectUpdate={setSelectedProject}
                    cleaningTrigger={cleaningTrigger}
                    onFilesUploaded={handleWelcomeUpload}
                />
            ) : activeView === 'design' ? (
                /* [NEW] Design System Showcase */
                <LiuliShowcase />
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
                    <InsightChainProvider>
                        <AppContent />
                    </InsightChainProvider>
                </EvidenceProvider>
            </ThemeProvider>
        </I18nProvider>
    );
}

