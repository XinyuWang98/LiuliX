import { useRef, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useEvidence } from '@/contexts/EvidenceContext';
import { DataCleaner } from '../cleaning/DataCleaner';
import { ReportGenerator } from '../report/ReportGenerator';
import { InsightChainFlow } from '../insights/InsightChainFlow';
import { EmptyStateWelcome } from './EmptyStateWelcome';
import { ProjectCardGrid } from './ProjectCardGrid';
import { Project } from '@/utils/projectUtils';
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
            {/* 项目选择区域 - 始终渲染在顶部，可通过滚动访问 */}
            <div
                ref={projectRef}
                id="project-selection"
                className={`project-section ${selectedItemId === 'project-selection' ? 'expanded' : 'collapsed'}`}
            >
                {project ? (
                    <ProjectCardGrid
                        currentProject={project}
                        onProjectSelect={(selectedProject) => {
                            onProjectUpdate(selectedProject);
                        }}
                        onNewProject={() => {
                            // 点击新建项目时触发文件上传
                            if (onFilesUploaded) {
                                // 触发文件选择器
                            }
                        }}
                    />
                ) : (
                    <EmptyStateWelcome onFilesUploaded={handleProjectUpload} />
                )}
            </div>

            {/* 数据清洗 Section */}
            {project && (
                <div ref={cleaningRef} id="cleaning" className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('exploration.sections.cleaning')}</h2>
                    </div>
                    <DataCleaner
                        project={project}
                        onProjectUpdate={onProjectUpdate}
                        cleaningTrigger={cleaningTrigger}
                    />
                </div>
            )}

            {/* 洞察分析 Section */}
            {project && (
                <div ref={insightsRef} id="insights" className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('exploration.sections.insights')}</h2>
                    </div>
                    <InsightChainFlow
                        columns={project.files?.[0]?.columns?.map(c => c.name) || []}
                        rowCount={project.files?.[0]?.rowCount || 0}
                        tableName={project.files?.[0]?.tableName}
                        fileName={project.files?.[0]?.originalName || project.files?.[0]?.name}
                        hideTitle={true}
                    />
                </div>
            )}

            {/* 分析报告 Section */}
            {project && evidenceRecords.length > 0 && (
                <div ref={reportRef} id="report" className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('exploration.sections.report')}</h2>
                        <span className="evidence-badge">
                            已采纳 {evidenceRecords.length} 条
                        </span>
                    </div>
                    <ReportGenerator />
                </div>
            )}
        </div>
    );
}
