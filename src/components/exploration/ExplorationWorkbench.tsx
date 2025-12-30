import { useState, useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Database, Lightbulb, FileText } from 'lucide-react';
import { NavigationPanel } from './NavigationPanel';
import { ContentPanel } from './ContentPanel';
import { Project } from '@/utils/projectUtils';
import './ExplorationWorkbench.css';

/** 导航节点类型 */
export type NavNodeType = 'section' | 'insight';

/** 导航Section */
export interface NavSection {
    id: string;
    type: 'section';
    icon: typeof Database | typeof Lightbulb | typeof FileText;
    label: string;
    status?: 'completed' | 'current' | 'locked';  // 状态指示
    complete?: boolean;  // 保留兼容性
    count?: number;  // 洞察数量
    adoptedCount?: number;  // 已采纳数量
    children?: NavInsightNode[];
}

/** 洞察导航节点 */
export interface NavInsightNode {
    id: string;
    type: 'insight';
    label: string;
    qualityScore?: number;
    depth: number;
    children?: NavInsightNode[];
}

/** 工作台Props */
interface ExplorationWorkbenchProps {
    project: Project | null;
    insightChain: any; // TODO: 使用正确的类型
    onProjectUpdate: (project: Project) => void;
    cleaningTrigger: number;
    cleaningComplete: boolean;
    reportReady: boolean;
}

/**
 * 数据探索工作台
 * 包含智能折叠导航 + 动态内容区
 */
export function ExplorationWorkbench({
    project,
    insightChain,
    onProjectUpdate,
    cleaningTrigger,
    cleaningComplete,
    reportReady
}: ExplorationWorkbenchProps) {
    const { t } = useI18n();
    const [selectedItemId, setSelectedItemId] = useState<string>('cleaning');

    // 构建导航树
    const navigationTree = useMemo((): NavSection[] => {
        const sections: NavSection[] = [
            {
                id: 'cleaning',
                type: 'section',
                icon: Database,
                label: t('workshop.cleaning'),
                complete: cleaningComplete
            },
            {
                id: 'insights',
                type: 'section',
                icon: Lightbulb,
                label: t('workshop.exploration'),
                children: buildInsightNavNodes(insightChain?.rootCards ?? [])
            },
            {
                id: 'report',
                type: 'section',
                icon: FileText,
                label: t('workshop.assessment'),
                complete: reportReady
            }
        ];

        return sections;
    }, [t, insightChain, cleaningComplete, reportReady]);

    return (
        <div className="exploration-workbench">
            {/* 左侧智能折叠导航 */}
            <NavigationPanel
                sections={navigationTree}
                selectedId={selectedItemId}
                onSelect={setSelectedItemId}
            />

            {/* 右侧内容区 */}
            <ContentPanel
                selectedItemId={selectedItemId}
                project={project}
                onProjectUpdate={onProjectUpdate}
                cleaningTrigger={cleaningTrigger}
            />
        </div>
    );
}

/**
 * 递归构建洞察导航节点
 */
function buildInsightNavNodes(
    insightNodes: any[],
    depth: number = 2
): NavInsightNode[] {
    if (!insightNodes || insightNodes.length === 0) return [];

    return insightNodes
        // 按质量评分降序排序（仅对根节点）
        .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
        .map(node => ({
            id: node.id,
            type: 'insight',
            label: node.title,
            qualityScore: node.qualityScore,
            depth,
            children: buildInsightNavNodes(node.children ?? [], depth + 1)
        }));
}
