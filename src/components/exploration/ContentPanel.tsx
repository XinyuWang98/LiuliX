import { useRef, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useEvidence } from '@/contexts/EvidenceContext';
import { DataCleaner } from '../cleaning/DataCleaner';
import { ReportGenerator } from '../report/ReportGenerator';
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
            {project && (
                <div ref={insightsRef} id="insights" className="content-section">
                    <LiuliGlass className="content-module-container"> {/* Added Container */}
                        <div className="section-header">
                            <h2 className="section-title">{t('exploration.sections.insights')}</h2>
                        </div>
                        <InsightChainFlow
                            columns={project.files?.[0]?.columns?.map(c => c.name) || []}
                            rowCount={project.files?.[0]?.rowCount || 0}
                            tableName={project.files?.[0]?.tableName}
                            file={project.files?.[0]}
                            fileName={project.files?.[0]?.originalName || project.files?.[0]?.name}
                            hideTitle={true}
                        />
                    </LiuliGlass>
                </div>
            )}

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
