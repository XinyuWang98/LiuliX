import { useState, useRef } from 'react';
import { IconOnlyNav } from './IconOnlyNav';
import { FullNavTree } from './FullNavTree';
import { NavSection } from './ExplorationWorkbench';
import './NavigationPanel.css';

interface NavigationPanelProps {
    sections: NavSection[];
    selectedId: string;
    onSelect: (id: string) => void;
}

/**
 * 智能折叠导航面板
 * - 默认折叠至64px（仅图标模式）
 * - 鼠标悬停展开至280px（完整目录）
 */
export function NavigationPanel({ sections, selectedId, onSelect }: NavigationPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const collapseTimeoutRef = useRef<NodeJS.Timeout>();

    // 鼠标进入导航区域
    const handleMouseEnter = () => {
        setIsHovering(true);
        setIsExpanded(true);
        // 清除任何待执行的折叠定时器
        if (collapseTimeoutRef.current) {
            clearTimeout(collapseTimeoutRef.current);
        }
    };

    // 鼠标离开导航区域
    const handleMouseLeave = () => {
        setIsHovering(false);
        // 延迟折叠（给用户返回的缓冲时间）
        collapseTimeoutRef.current = setTimeout(() => {
            if (!isHovering) {
                setIsExpanded(false);
            }
        }, 300); // 300ms延迟
    };

    return (
        <div
            className={`navigation-panel ${isExpanded ? 'expanded' : 'collapsed'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {isExpanded ? (
                <FullNavTree
                    sections={sections}
                    selectedId={selectedId}
                    onSelect={onSelect}
                />
            ) : (
                <IconOnlyNav
                    sections={sections}
                    selectedId={selectedId}
                    onSelect={onSelect}
                />
            )}
        </div>
    );
}
