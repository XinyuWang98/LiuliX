import { useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { NavSection, NavInsightNode } from './ExplorationWorkbench';
import { logger } from '@/utils/logger';
import './FullNavTree.css';

interface FullNavTreeProps {
    sections: NavSection[];
    selectedId: string;
    onSelect: (id: string) => void;
}

/**
 * 完整导航树（展开态280px）
 * 显示所有Section和洞察节点的多层级结构
 */
export function FullNavTree({ sections, selectedId, onSelect }: FullNavTreeProps) {
    return (
        <div className="full-nav-tree">
            <h3 className="nav-tree-title">数据探索流程</h3>
            {sections.map(section => (
                <SectionNode
                    key={section.id}
                    section={section}
                    selectedId={selectedId}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}

/** Section节点组件 */
function SectionNode({ section, selectedId, onSelect }: {
    section: NavSection;
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    const Icon = section.icon;
    const isSelected = selectedId === section.id;
    const [isExpanded, setIsExpanded] = useState(section.id === 'insights' || isSelected);

    const handleClick = () => {
        onSelect(section.id);
        logger.log('UI', `导航切换到Section: ${section.label}`);
    };

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="nav-section">
            <button
                className={`nav-section-item ${isSelected ? 'selected' : ''}`}
                onClick={handleClick}
            >
                <Icon size={18} />
                <span className="nav-label">{section.label}</span>
                {section.complete && <Check size={14} className="complete-icon" />}
                {section.children && section.children.length > 0 && (
                    <button
                        className="expand-btn"
                        onClick={toggleExpand}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                )}
            </button>

            {/* 子节点（洞察列表） */}
            {isExpanded && section.children && section.children.length > 0 && (
                <div className="nav-children">
                    {section.children.map(child => (
                        <InsightNodeItem
                            key={child.id}
                            node={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            depth={child.depth}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/** 洞察节点组件（递归） */
function InsightNodeItem({ node, selectedId, onSelect, depth }: {
    node: NavInsightNode;
    selectedId: string;
    onSelect: (id: string) => void;
    depth: number;
}) {
    const isSelected = selectedId === node.id;
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    const handleClick = () => {
        onSelect(node.id);
        logger.log('UI', `导航切换到洞察: ${node.label}`);
        if (hasChildren) {
            setIsExpanded(true);
        }
    };

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    // 根据质量评分返回等级
    const getScoreLevel = (score: number): string => {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'fair';
        return 'poor';
    };

    return (
        <div
            className="nav-insight-node"
            style={{ marginLeft: `${(depth - 2) * 16}px` }}
        >
            <button
                className={`nav-insight-item ${isSelected ? 'selected' : ''}`}
                onClick={handleClick}
            >
                <span className="node-bullet">●</span>

                {/* 质量评分徽章 */}
                {node.qualityScore && (
                    <span className={`score-badge score-${getScoreLevel(node.qualityScore)}`}>
                        {node.qualityScore}
                    </span>
                )}

                <span className="nav-label">{node.label}</span>

                {/* 展开/折叠按钮 */}
                {hasChildren && depth < 4 && (
                    <button className="expand-btn" onClick={toggleExpand}>
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                )}
            </button>

            {/* 递归渲染子节点 */}
            {isExpanded && hasChildren && (
                <div className="nav-children">
                    {node.children!.map(child => (
                        <InsightNodeItem
                            key={child.id}
                            node={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            depth={child.depth}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
