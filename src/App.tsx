import { useState, useEffect, useRef } from 'react';
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
import { EmptyStateWelcome } from './components/exploration/EmptyStateWelcome';
import { pyodideManager } from './services/PyodideManager';
import { SettingsPage } from './components/settings/SettingsPage';
import { useResizable } from '@/hooks/useResizable';
import { logger } from './utils/logger';
import { Logo } from './components/common/Logo/Logo';
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

function AppContent() {
    const { t } = useI18n();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeView, setActiveView] = useState<'dashboard' | 'library'>('dashboard');
    const [cleaningTrigger, setCleaningTrigger] = useState(0); // 用于触发数据清洗建议生成
    const [isPyodideReady, setIsPyodideReady] = useState(false);
    const [showLeft, setShowLeft] = useState(() => localStorage.getItem('layout.showLeft') !== 'false');
    const [showRight, setShowRight] = useState(() => localStorage.getItem('layout.showRight') !== 'false');
    const [showAPISettings, setShowAPISettings] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
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

    const isPyodideReadyRef = useRef(false);

    useEffect(() => {
        // 防止Strict Mode重复执行
        if (isPyodideReadyRef.current) return;
        isPyodideReadyRef.current = true;

        const init = async () => {
            logger.group('系统', '🚀 应用初始化');
            try {
                // 🔍 WebLLM缓存诊断（自动运行）
                const { diagnoseWebLLMCache } = await import('./utils/webllmDiagnostics');
                diagnoseWebLLMCache().catch(err => console.error('诊断失败:', err));

                // 自动启用本地模型
                if (!localStorage.getItem('use_local_model')) {
                    localStorage.setItem('use_local_model', 'true');
                    console.log('✅ 已自动启用本地模型');
                }

                // ⚡ 并行加载：Python引擎 + 本地模型
                const shouldPreload = localStorage.getItem('use_local_model') === 'true';

                // 启动Python引擎加载（Promise 1）
                logger.log('Python', '引擎加载中...');
                const pyodidePromise = (async () => {
                    await pyodideManager.initialize();
                    await pyodideManager.waitForReady();
                    logger.log('Python', '引擎加载完成');
                })();

                // 并行启动模型加载（Promise 2）
                const modelPromise = shouldPreload
                    ? (async () => {
                        logger.log('本地模型', '后台加载启动（并行）...');
                        try {
                            const { localLLMService, SUPPORTED_MODELS } = await import('@/services/localLLMService');

                            // 定义进度里程碑：加载至 50% 即可进入
                            return new Promise<void>((resolve) => {
                                let resolved = false;
                                localLLMService.reload(SUPPORTED_MODELS.QWEN, (progress, message) => {
                                    setLoadingProgress(progress);

                                    // 简单的消息翻译映射
                                    let translatedMsg = message;
                                    const lowerMsg = message.toLowerCase();
                                    if (lowerMsg.includes('loading model from cache') || lowerMsg.includes('webllm cache')) {
                                        translatedMsg = t('localModel.status.loadingFromCache');
                                    } else if (lowerMsg.includes('downloading')) {
                                        translatedMsg = t('localModel.status.downloading');
                                    } else if (lowerMsg.includes('finish loading')) {
                                        translatedMsg = t('localModel.status.finish');
                                    } else if (lowerMsg.includes('fetching param cache')) {
                                        translatedMsg = t('localModel.status.fetching', { progress: '' });
                                    }

                                    setLoadingMessage(translatedMsg);

                                    // 达到 50% 或加载完成时，允许进入
                                    if (!resolved && (progress >= 50 || progress === 100)) {
                                        resolved = true;
                                        resolve();
                                    }
                                }).catch(err => {
                                    // 如果加载失败，也不要阻塞进入
                                    logger.warn('本地模型', '加载过程出错', err);
                                    if (!resolved) resolve();
                                });
                            });
                        } catch (err) {
                            logger.warn('本地模型', '模块导入失败', err);
                        }
                    })()
                    : Promise.resolve();

                // 等待Python引擎（UI必需）
                await pyodidePromise;

                // 等待模型加载至 50%（根据用户需求）
                if (shouldPreload) {
                    await modelPromise;
                }

                // UI就绪，用户可以开始使用（模型后续在后台继续完成剩余 50%）
                setTimeout(() => setIsPyodideReady(true), 500);

            } catch (err) {
                logger.error('Python', '引擎加载失败', err);
                setIsPyodideReady(true);
            } finally {
                logger.groupEnd();
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
            logger.group('UI', '欢迎界面上传文件处理');

            const themeMap = {
                game: t('dataSource.project.themes.game'),
                sales: t('dataSource.project.themes.sales'),
                finance: t('dataSource.project.themes.finance'),
                analytics: t('dataSource.project.themes.analytics'),
                user: t('dataSource.project.themes.user'),
            };

            // 1. 创建新项目对象
            const newProject = await ingestFilesAndCreateProject(
                files,
                sampledFlags,
                'zh-CN', // 强制中文活 MVP 默认
                themeMap
            );

            // 2. 读取现有项目并追加 (防止覆盖)
            const existingProjects = await loadProjects();
            const updatedProjects = [newProject, ...existingProjects];

            // 3. 保存到 IndexedDB
            await saveProjects(updatedProjects);
            logger.log('UI', '项目已保存到数据库', { data: { id: newProject.id } });

            // 4. 更新当前选中项目 (这将触发界面切换到 ExplorationFlow)
            setSelectedProject(newProject);

            // 5. 自动展开左侧栏 (可选，增加沉浸感可不展开，但为了让用户看到文件列表，展开较好)
            setShowLeft(true);

            logger.groupEnd();
        } catch (err) {
            logger.error('UI', '项目创建失败', err);
            logger.groupEnd();
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
                        {selectedProject === null ? (
                            <EmptyStateWelcome onFilesUploaded={handleWelcomeUpload} />
                        ) : activeView === 'dashboard' ? (
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
