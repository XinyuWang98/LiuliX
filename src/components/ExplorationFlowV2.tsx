import { useState, useEffect } from 'react';
import { AscensionBackground } from '@/components/common/liulix/AscensionBackground';
import { NavigationPanel } from './exploration/NavigationPanel';
import { ContentPanel } from './exploration/ContentPanel';
import { Project } from '@/utils/projectUtils';
import { FolderOpen, Database, Lightbulb, FileText } from 'lucide-react';
import { logger } from '@/utils/logger';
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
    const [selectedItemId, setSelectedItemId] = useState('project-selection');

    const insightCount = 3;
    const [adoptedCount, setAdoptedCount] = useState(0); // 🆕 状态化，而非硬编码

    // 监听project变化，输出调试日志
    useEffect(() => {
        if (project) {
            logger.log('UI', 'ExplorationFlowV2 project update', { data: { name: project.name } });
        }
    }, [project]);

    // 🆕 处理洞察采纳
    const handleInsightAdopt = () => {
        setAdoptedCount(prev => prev + 1);
        logger.log('UI', '洞察被采纳，自动跳转至报告', { count: adoptedCount + 1 });

        // 自动跳转到分析报告 (解锁并激活)
        // 使用 setTimeout 确保状态更新后执行跳转，或者直接依赖 adoptedCount 的 effect
        setSelectedItemId('report');
    };

    const navigationTree: import('./exploration/ExplorationWorkbench').NavSection[] = [
        {
            id: 'project-selection',
            type: 'section',
            label: '项目选择',
            icon: FolderOpen,
            status: project ? 'completed' : 'current',
            children: []
        },
        {
            id: 'cleaning',
            type: 'section',
            label: '数据清洗',
            icon: Database,
            status: project ? 'current' : 'locked',
            children: []
        },
        {
            id: 'insights',
            type: 'section',
            label: '洞察分析',
            icon: Lightbulb,
            status: project ? 'current' : 'locked',
            count: insightCount,
            children: []
        },
        {
            id: 'report',
            type: 'section',
            label: '分析报告',
            icon: FileText,
            // 只要有采纳记录或者当前被选中，就视为可用
            status: (adoptedCount > 0 || selectedItemId === 'report') ? 'current' : 'locked',
            adoptedCount: adoptedCount,
            children: []
        }
    ];

    return (
        <div className="exploration-flow-v2">
            <AscensionBackground />
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
                    onInsightAdopt={handleInsightAdopt} // 🆕
                />
            </div>
        </div>
    );
}
