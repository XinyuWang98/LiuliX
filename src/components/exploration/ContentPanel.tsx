import { useRef, useEffect } from 'react';
import { useEvidence } from '@/contexts/EvidenceContext';
import { DataCleaner } from '../cleaning/DataCleaner';
import { ReportGenerator } from '../report/ReportGenerator';
import { InsightChainFlow } from '../insights/InsightChainFlow';
import { EmptyStateWelcome } from './EmptyStateWelcome';
import { ProjectSelector } from './ProjectSelector';
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
    const { records: evidenceRecords } = useEvidence();
    const projectRef = useRef<HTMLDivElement>(null);
    const cleaningRef = useRef<HTMLDivElement>(null);
    const insightsRef = useRef<HTMLDivElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    // 移除自动折叠逻辑，改为由selectedItemId控制渲染
    // 原逻辑：有project时自动折叠，导致ProjectCardGrid永远不显示
    // 新逻辑：通过selectedItemId判断是否显示ProjectCardGrid

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
                block: 'start'
            });
        }
    }, [selectedItemId]);

    // 项目加载后自动滚动到数据清洗
    useEffect(() => {
        if (project && cleaningRef.current) {
            setTimeout(() => {
                cleaningRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 500); // 等待折叠动画完成
        }
    }, [project]);

    const handleProjectUpload = async (files: any[], sampledFlags: boolean[]) => {
        if (onFilesUploaded) {
            onFilesUploaded(files, sampledFlags);
        }
    };

    return (
        <div className="content-panel-v2">
            <div
                ref={projectRef}
                id="project-selection"
                className={`project-section ${selectedItemId === 'project-selection' && project ? 'expanded' : 'collapsed'}`}
            >
                {selectedItemId === 'project-selection' ? (
                    // 当导航选中"项目选择"时，显示ProjectCardGrid或EmptyStateWelcome
                    project ? (
                        <ProjectCardGrid
                            currentProject={project}
                            onProjectSelect={(selectedProject) => {
                                onProjectUpdate(selectedProject);
                                // 切换项目后保持在项目选择页面
                            }}
                            onNewProject={() => {
                                // 点击新建项目时触发文件上传
                                if (onFilesUploaded) {
                                    // 这里需要触发文件选择器，暂时留空
                                }
                            }}
                        />
                    ) : (
                        <EmptyStateWelcome onFilesUploaded={handleProjectUpload} />
                    )
                ) : (
                    // 当导航选中其他section时，显示collapsed的ProjectSelector
                    project && (
                        <div className="project-header-compact">
                            <ProjectSelector
                                currentProject={project}
                                onProjectSelect={(selectedProject) => {
                                    if (selectedProject) {
                                        onProjectUpdate(selectedProject);
                                    }
                                }}
                                onNewProject={() => {
                                    // 点击新建项目，这里不需要特殊处理
                                }}
                            />
                        </div>
                    )
                )}
            </div>

            {project && (
                <div ref={cleaningRef} id="cleaning" className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">数据清洗建议</h2>
                    </div>
                    <DataCleaner
                        project={project}
                        onProjectUpdate={onProjectUpdate}
                        cleaningTrigger={cleaningTrigger}
                    />
                </div>
            )}

            {project && (
                <div ref={insightsRef} id="insights" className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">洞察分析</h2>
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

            {/* Section 3: Analysis Report */}
            {project && evidenceRecords.length > 0 && (
                <div ref={reportRef} id="report" className="content-section">
                    <div className="section-header">
                        <h2 className="section-title">分析报告</h2>
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
