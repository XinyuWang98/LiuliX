import { useState, useEffect, useRef } from 'react';
import { AscensionBackground } from '@/components/common/liulix/AscensionBackground';
import { WorkbenchSidebar, WorkbenchSection } from './exploration/WorkbenchSidebar';
import { ContentPanel } from './exploration/ContentPanel';
import { LoadingScreen } from './common/LoadingScreen/LoadingScreen';
import { Project } from '@/utils/projectUtils';
import { pyodideManager } from '@/services/PyodideManager';
import { logger } from '@/utils/logger';
import { useI18n } from '@/contexts/I18nContext';
import './ExplorationFlowV2.css';

interface ExplorationFlowV2Props {
    project: Project | null;
    onProjectUpdate: (project: Project) => void;
    cleaningTrigger: number;
    onFilesUploaded?: (files: any[], sampledFlags: boolean[]) => void;
    backendStatus?: 'connected' | 'disconnected' | 'checking';
    onOpenAPISettings?: () => void;
}

export function ExplorationFlowV2({
    project,
    onProjectUpdate,
    cleaningTrigger,
    onFilesUploaded,
    backendStatus,
    onOpenAPISettings
}: ExplorationFlowV2Props) {
    const { t } = useI18n();
    const [selectedSection, setSelectedSection] = useState<WorkbenchSection>('project-selection');
    const [adoptedCount, setAdoptedCount] = useState(0);

    // 🆕 Pyodide 加载状态
    const [isPyodideLoading, setIsPyodideLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    const isPyodideInitialized = useRef(false);

    // 🆕 页面级 Pyodide 初始化
    useEffect(() => {
        // 防止 Strict Mode 重复执行
        if (isPyodideInitialized.current) return;
        isPyodideInitialized.current = true;

        const initPyodide = async () => {
            logger.log('Python', 'V2 Workstation: 开始加载 Pyodide');
            try {
                // 🔍 WebLLM 缓存诊断
                const { diagnoseWebLLMCache } = await import('@/utils/webllmDiagnostics');
                diagnoseWebLLMCache().catch(err => logger.error('诊断工具', '诊断失败', err));

                // 自动启用本地模型 (MVP阶段禁用: 移除强制开启)
                // if (!localStorage.getItem('use_local_model')) {
                //     localStorage.setItem('use_local_model', 'true');
                //     logger.log('系统', '已自动启用本地模型');
                // }

                // 💡 检查是否首次运行
                const isFirstRun = !localStorage.getItem('app_has_run_before');
                if (isFirstRun) {
                    setLoadingMessage(t('common.firstTimeTip'));
                }

                // 🎨 加载中文字体（后台异步）
                pyodideManager.loadChineseFont();

                // --- Phase 1: 核心环境加载 ---
                setLoadingProgress(10);
                await pyodideManager.initialize((msg, _progress) => {
                    if (msg.includes('Loading Pyodide')) {
                        setLoadingMessage(t('common.initCore', { current: 1, total: 3 }));
                        setLoadingProgress(30);
                    } else if (msg.includes('Loading Pandas')) {
                        setLoadingMessage(t('common.loadPandas'));
                        setLoadingProgress(60);
                    } else {
                        setLoadingMessage(msg);
                    }
                });

                await pyodideManager.loadEssentials((msg) => {
                    logger.log('Python', msg);
                    setLoadingProgress(90);
                });

                logger.log('Python', '核心环境加载完成');
                setIsPyodideLoading(false);

                // 标记非首次运行
                if (isFirstRun) {
                    localStorage.setItem('app_has_run_before', 'true');
                }

                // --- Phase 2: 扩展包后台加载（✅ 立即触发） ---
                pyodideManager.loadUserConfigExtensions((msg) => {
                    logger.log('Python', `[扩展] ${msg}`);
                }).then(() => {
                    logger.log('Python', '✅ 用户配置的扩展包预加载完成');
                }).catch(extErr => {
                    logger.warn('Python', '扩展包加载部分失败（不影响使用）', extErr);
                });

                // 本地模型预加载（延迟2秒，避免资源竞争）
                setTimeout(() => {
                    const featureEnabled = localStorage.getItem('feature_LOCAL_AI_MODEL') === 'true';
                    const userEnabled = localStorage.getItem('use_local_model') === 'true';
                    const shouldPreload = featureEnabled && userEnabled;

                    if (shouldPreload) {
                        import('@/services/localLLMService').then(({ localLLMService, SUPPORTED_MODELS }) => {
                            localLLMService.reload(SUPPORTED_MODELS.QWEN_7B, () => { }).catch(err =>
                                logger.warn('本地模型', '后台加载失败', err)
                            );
                        });
                    }
                }, 2000);

            } catch (err) {
                logger.error('Python', 'Pyodide 初始化失败', err);
                setIsPyodideLoading(false);
            }
        };

        initPyodide();
    }, [t]);

    // 监听 project 变化
    useEffect(() => {
        if (project) {
            logger.log('UI', 'ExplorationFlowV2 project update', { data: { name: project.name } });
        }
    }, [project]);

    // 处理洞察采纳
    const handleInsightAdopt = () => {
        setAdoptedCount(prev => prev + 1);
        logger.log('UI', '洞察被采纳，自动跳转至报告', { count: adoptedCount + 1 });
        setSelectedSection('report');
    };

    // 🆕 加载中显示 LoadingScreen
    if (isPyodideLoading) {
        return <LoadingScreen progress={loadingProgress} message={loadingMessage} />;
    }

    return (
        <div className="exploration-flow-v2">
            <AscensionBackground />
            <div className="workbench-v2">
                <WorkbenchSidebar
                    selectedSection={selectedSection}
                    onSectionChange={setSelectedSection}
                    projectCount={project ? project.files.length : 0}
                    backendStatus={backendStatus}
                    onOpenAPISettings={onOpenAPISettings}
                />
                <ContentPanel
                    selectedItemId={selectedSection}
                    project={project}
                    onProjectUpdate={onProjectUpdate}
                    cleaningTrigger={cleaningTrigger}
                    onFilesUploaded={onFilesUploaded}
                    onInsightAdopt={handleInsightAdopt}
                />
            </div>
        </div>
    );
}
