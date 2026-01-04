import { useState, useEffect } from 'react';
import { AscensionBackground } from '@/components/common/liulix/AscensionBackground';
import { WorkbenchSidebar, WorkbenchSection } from './exploration/WorkbenchSidebar';
import { ContentPanel } from './exploration/ContentPanel';
import { Project } from '@/utils/projectUtils';
import { logger } from '@/utils/logger';
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
    const [selectedSection, setSelectedSection] = useState<WorkbenchSection>('project-selection');
    const [adoptedCount, setAdoptedCount] = useState(0);

    // 监听project变化，输出调试日志
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
