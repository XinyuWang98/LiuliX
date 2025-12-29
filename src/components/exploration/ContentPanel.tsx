import { useRef, useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useEvidence } from '@/contexts/EvidenceContext';
import { DataCleaner } from '../cleaning/DataCleaner';
import { ReportGenerator } from '../report/ReportGenerator';
import { InsightChainFlow } from '../insights/InsightChainFlow';
import { EmptyStateWelcome } from './EmptyStateWelcome';
import { ProjectSelector } from './ProjectSelector';
import { ProjectCardGrid } from './ProjectCardGrid';
import { Project } from '@/utils/projectUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './ContentPanel.css';

interface ContentPanelProps {
    selectedItemId: string;
    project: Project | null;
    insightChain: any;
    onProjectUpdate: (project: Project) => void;
    cleaningTrigger: number;
    onProjectSelect?: (project: Project) => void;
    onFilesUploaded?: (files: any[], sampledFlags: boolean[]) => void;
}

export function ContentPanel({
    selectedItemId,
    project,
    insightChain,
    onProjectUpdate,
    cleaningTrigger,
    onProjectSelect,
    onFilesUploaded
}: ContentPanelProps) {
    const { t } = useI18n();
    const { records: evidenceRecords } = useEvidence();
    const projectRef = useRef<HTMLDivElement>(null);
    const cleaningRef = useRef<HTMLDivElement>(null);
    const insightsRef = useRef<HTMLDivElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const [projectCollapsed, setProjectCollapsed] = useState(false);

    useEffect(() => {
        if (project) {
            setProjectCollapsed(true);
        } else {
            setProjectCollapsed(false);
        }
    }, [project]);

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
                className={`project-section ${projectCollapsed ? 'collapsed' : 'expanded'}`}
            >
                {projectCollapsed && project ? (
                    <div className="project-header-compact">
                        <ProjectSelector
                            currentProject={project}
                            onProjectSelect={(selectedProject) => {
                                if (selectedProject) {
                                    onProjectUpdate(selectedProject);
                                }
                            }}
                            onNewProject={() => setProjectCollapsed(false)}
                        />
                        <button
                            className="btn-ghost btn-sm"
                            onClick={() => setProjectCollapsed(false)}
                            title="展开项目列表"
                        >
                            <ChevronDown size={16} />
                        </button>
                    </div>
                ) : (
                    // expanded态：显示项目卡片网格或欢迎界面
                    project ? (
                        <ProjectCardGrid
                            currentProject={project}
                            onProjectSelect={(selectedProject) => {
                                onProjectUpdate(selectedProject);
                                setProjectCollapsed(true); // 选择后自动折叠
                            }}
                            onNewProject={handleProjectUpload}
                        />
                    ) : (
                        <EmptyStateWelcome onFilesUploaded={handleProjectUpload} />
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
                        project={project}
                        fileName={project.files?.[0]?.name || ''}
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
