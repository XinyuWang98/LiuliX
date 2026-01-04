import { useRef, useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useEvidence } from '@/contexts/EvidenceContext';
import { DataCleaner } from '../cleaning/DataCleaner';
import { ReportGenerator } from '../report/ReportGenerator';
import { InsightChainFlow } from '../insights/InsightChainFlow';
import { ProjectCardGrid } from './ProjectCardGrid';
import { FileUploader, FileUploaderRef } from '@/components/data/FileUploader';
import { Project } from '@/utils/projectUtils';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import './ContentPanel.css';

interface ContentPanelProps {
    selectedItemId: string;
    project: Project | null;
    onProjectUpdate: (project: Project) => void;
    cleaningTrigger: number;
    onFilesUploaded?: (files: any[], sampledFlags: boolean[]) => void;
}

export function ContentPanel({
    selectedItemId,
    project,
    onProjectUpdate,
    cleaningTrigger,
    onFilesUploaded
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

    // 🆕 Notebook 显示/隐藏状态（从 localStorage 读取）
    const [showNotebook, setShowNotebook] = useState(() => {
        const saved = localStorage.getItem('insightFlow.showNotebook');
        return saved !== null ? saved === 'true' : true;
    });

    // 持久化 showNotebook 状态
    useEffect(() => {
        localStorage.setItem('insightFlow.showNotebook', String(showNotebook));
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
                                {/* Notebook 切换按钮 */}
                                <button
                                    className="notebook-toggle-btn"
                                    onClick={() => setShowNotebook(!showNotebook)}
                                >
                                    {showNotebook ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                                    <span>{showNotebook ? '收起 Notebook' : '展开 Notebook'}</span>
                                </button>
                            </div>
                            <InsightChainFlow
                                columns={activeFile.columns?.map(c => c.name) || []}
                                rowCount={activeFile.rowCount || 0}
                                tableName={activeFile.tableName}
                                file={activeFile}
                                fileName={activeFile.originalName || activeFile.name}
                                hideTitle={true}
                                showNotebook={showNotebook}
                            />
                        </LiuliGlass>
                    </div>
                );
            })()}

            {/* 分析报告 Section */}
            {project && evidenceRecords.length > 0 && (
                <div ref={reportRef} id="report" className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('exploration.sections.report')}</h2>
                        <span className="evidence-badge">
                            {t('report.evidenceAdopted', { count: evidenceRecords.length })}
                        </span>
                    </div>
                    <ReportGenerator />
                </div>
            )}

            {/* 隐藏的 FileUploader 组件 - 复用现有的文件上传逻辑 */}
            <div style={{ display: 'none' }}>
                <FileUploader ref={fileUploaderRef} onFilesUploaded={handleProjectUpload} />
            </div>
        </div>
    );
}
