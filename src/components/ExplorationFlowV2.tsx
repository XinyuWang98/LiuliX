import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { ExplorationHeader } from './exploration/ExplorationHeader';
import { NavigationPanel } from './exploration/NavigationPanel';
import { ContentPanel } from './exploration/ContentPanel';
import { Project } from '@/utils/projectUtils';
import { FolderOpen, Database, Lightbulb, FileText } from 'lucide-react';
import './ExplorationFlowV2.css';

interface ExplorationFlowV2Props {
    project: Project | null;
    onProjectUpdate: (project: Project) => void;
    cleaningTrigger: number;
    onFilesUploaded?: (files: any[], sampledFlags: boolean[]) => void;
}

export function ExplorationFlowV2({
    project,
    onProjectUpdate,
    cleaningTrigger,
    onFilesUploaded
}: ExplorationFlowV2Props) {
    const { t } = useI18n();
    const [selectedItemId, setSelectedItemId] = useState('project-selection');

    const insightCount = 3;
    const adoptedCount = 0;

    // 监听project变化，输出调试日志
    useEffect(() => {
        console.log('[ExplorationFlowV2] project变化：', project ? project.name : 'null');
    }, [project]);

    const navigationTree = [
        {
            id: 'project-selection',
            type: 'section' as const,
            label: '项目选择',
            icon: FolderOpen,
            status: project ? 'completed' : 'current',
            children: []
        },
        {
            id: 'cleaning',
            type: 'section' as const,
            label: '数据清洗',
            icon: Database,
            status: project ? 'current' : 'locked',
            children: []
        },
        {
            id: 'insights',
            type: 'section' as const,
            label: '洞察分析',
            icon: Lightbulb,
            status: project ? 'current' : 'locked',
            count: insightCount,
            children: []
        },
        {
            id: 'report',
            type: 'section' as const,
            label: '分析报告',
            icon: FileText,
            status: adoptedCount > 0 ? 'current' : 'locked',
            adoptedCount: adoptedCount,
            children: []
        }
    ];

    return (
        <div className="exploration-flow-v2">
            <ExplorationHeader title={t('workshop.dataExploration')} />
            <div className="workbench-v2">
                <NavigationPanel
                    sections={navigationTree}
                    selectedId={selectedItemId}
                    onSelect={setSelectedItemId}
                />
                <ContentPanel
                    selectedItemId={selectedItemId}
                    project={project}
                    onProjectUpdate={onProjectUpdate}
                    cleaningTrigger={cleaningTrigger}
                    onFilesUploaded={onFilesUploaded}
                />
            </div>
        </div>
    );
}
