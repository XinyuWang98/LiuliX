import { useRef, useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useEvidence } from '@/contexts/EvidenceContext';
import { ReportProvider } from '@/contexts/ReportContext';
import { DataCleaner } from '../cleaning/DataCleaner';
import { ReportWorkbench } from '../report/ReportWorkbench';
import { ReportActions } from '../report/ReportActions';
import { InsightChainFlow } from '../insights/InsightChainFlow';
import { ProjectCardGrid } from './ProjectCardGrid';
import { FileUploader, FileUploaderRef } from '@/components/data/FileUploader';
import { Project } from '@/utils/projectUtils';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import './ContentPanel.css';

interface ContentPanelProps {
    selectedItemId: string;
    project: Project | null;
    onProjectUpdate: (project: Project) => void;
    cleaningTrigger: number;
    onFilesUploaded?: (files: any[], sampledFlags: boolean[]) => void;
    onInsightAdopt?: () => void; // 🆕
}

export function ContentPanel({
    selectedItemId,
    project,
    onProjectUpdate,
    cleaningTrigger,
    onFilesUploaded,
    onInsightAdopt // 🆕
}: ContentPanelProps) {
    const { t } = useI18n();
    const { records: evidenceRecords } = useEvidence();
    const fileUploaderRef = useRef<FileUploaderRef>(null);
    const projectRef = useRef<HTMLDivElement>(null);
    const cleaningRef = useRef<HTMLDivElement>(null);
    const insightsRef = useRef<HTMLDivElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    // 🆕 Active File Management - 支持多文件项目的洞察刷新
    const [activeFileId, setActiveFileId] = useState<string | null>(null);

    // 🆕 Notebook 显示/隐藏状态管理
    const [showNotebook, setShowNotebook] = useState(() => {
        const saved = localStorage.getItem('insightFlow.showNotebook');
        return saved ? saved === 'true' : false; // 默认收起
    });

    // 保存 Notebook 显示状态
    useEffect(() => {
        localStorage.setItem('insightFlow.showNotebook', showNotebook.toString());
    }, [showNotebook]);

    // 🆕 当project.files变化时，自动选择第一个文件（如果当前没有选中文件）
    useEffect(() => {
        if (project?.files && project.files.length > 0) {
            // 如果当前activeFileId不存在或已不在files列表中，选择第一个文件
            const currentFileExists = project.files.some(f => f.id === activeFileId);
            if (!currentFileExists) {
                setActiveFileId(project.files[0].id);
            }
        } else {
            setActiveFileId(null);
        }
    }, [project?.files, activeFileId]);

    // 导航滚动逻辑
    useEffect(() => {
        const refs: Record<string, React.RefObject<HTMLDivElement>> = {
            'project-selection': projectRef,
            'cleaning': cleaningRef,
            'insights': insightsRef,
            'report': reportRef
        };

        const targetRef = refs[selectedItemId];
        if (targetRef?.current) {
            targetRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }
    }, [selectedItemId]);

    const handleProjectUpload = async (files: any[], sampledFlags: boolean[]) => {
        if (onFilesUploaded) {
            onFilesUploaded(files, sampledFlags);
        }
    };

    return (
        <div className="content-panel-v2">
            {/* 1. 项目选择模块 (Project Selection) */}
            <div
                ref={projectRef}
                id="project-selection"
                className={`project-section ${selectedItemId === 'project-selection' ? 'expanded' : 'collapsed'}`}
            >
                <LiuliGlass className="content-module-container">
                    {/* 模块标题 */}
                    <div className="section-header">
                        <h2 className="section-title">{t('exploration.sections.projects')}</h2>
                    </div>
                    <ProjectCardGrid
                        currentProject={project}
                        onProjectSelect={(selectedProject) => {
                            onProjectUpdate(selectedProject);
                        }}
                        onNewProject={() => {
                            // 复用 FileUploader 组件的文件选择功能
                            fileUploaderRef.current?.triggerUpload();
                        }}
                    />
                </LiuliGlass>
            </div>

            {/* 2. 数据清洗 Section */}
            {project && (
                <div ref={cleaningRef} id="cleaning" className="content-section">
                    <LiuliGlass className="content-module-container no-shadow"> {/* 移除阴影 */}
                        <div className="section-header">
                            <h2 className="section-title">{t('exploration.sections.cleaning')}</h2>
                        </div>
                        <DataCleaner
                            project={project}
                            onProjectUpdate={onProjectUpdate}
                            cleaningTrigger={cleaningTrigger}
                        />
                    </LiuliGlass>
                </div>
            )}

            {/* 3. 洞察分析 Section */}
            {project && (() => {
                // 🆕 根据activeFileId查找当前激活的文件
                const activeFile = project.files?.find(f => f.id === activeFileId);
                if (!activeFile) return null;

                return (
                    <div ref={insightsRef} id="insights" className="content-section">
                        <LiuliGlass className="content-module-container"> {/* Added Container */}
                            <div className="section-header">
                                <h2 className="section-title">{t('exploration.sections.insights')}</h2>
                                <button
                                    className="notebook-toggle-btn"
                                    onClick={() => setShowNotebook(!showNotebook)}
                                    title={showNotebook ? t('exploration.actions.collapseNotebook') : t('exploration.actions.expandNotebook')}
                                >
                                    {showNotebook ? t('exploration.actions.collapseNotebook') : t('exploration.actions.expandNotebook')}
                                </button>
                            </div>
                            <InsightChainFlow
                                columns={activeFile.columns?.map(c => c.name) || []}
                                rowCount={activeFile.rowCount || 0}
                                tableName={activeFile.data?.tableName}
                                file={activeFile}
                                fileName={activeFile.originalName || activeFile.name}
                                hideTitle={true}
                                showNotebook={showNotebook}
                                onInsightAdopt={onInsightAdopt} // 🆕
                            />
                        </LiuliGlass>
                    </div>
                );
            })()}

            {/* 4. 分析报告工作台 ReportWorkbench (替换原 ReportGenerator) */}
            {project && evidenceRecords.length > 0 && (
                <div ref={reportRef} id="report" className="content-section">
                    <LiuliGlass className="content-module-container">
                        {/* ✅ 用 ReportProvider 包裹整个报告模块 */}
                        <ReportProvider files={project.files}>
                            {/* ✅ 恢复 Section Header，与其他模块保持一致 */}
                            <div className="section-header">
                                <h2 className="section-title">
                                    {t('exploration.sections.report')}
                                    <span className="beta-badge">Beta</span>
                                </h2>
                                {/* ✅ 新增操作按钮区域 */}
                                <div className="section-actions">
                                    <ReportActions />
                                </div>
                            </div>
                            <ReportWorkbench />
                        </ReportProvider>
                    </LiuliGlass>
                </div>
            )}

            {/* 隐藏的 FileUploader 组件 - 复用现有的文件上传逻辑 */}
            <div className="hidden">
                <FileUploader ref={fileUploaderRef} onFilesUploaded={handleProjectUpload} />
            </div>
        </div>
    );
}
