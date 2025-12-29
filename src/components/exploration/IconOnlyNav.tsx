import { Check } from 'lucide-react';
import { NavSection } from './ExplorationWorkbench';
import './IconOnlyNav.css';

interface IconOnlyNavProps {
    sections: NavSection[];
    selectedId: string;
    onSelect: (id: string) => void;
}

/**
 * 图标导航模式（折叠态64px）
 * 仅显示3个主Section的图标
 */
export function IconOnlyNav({ sections, selectedId, onSelect }: IconOnlyNavProps) {
    return (
        <div className="icon-only-nav">
            {sections.map(section => {
                const Icon = section.icon;
                const isActive = selectedId === section.id || isChildSelected(section, selectedId);

                return (
                    <button
                        key={section.id}
                        className={`icon-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => onSelect(section.id)}
                        title={section.label}
                    >
                        <Icon size={20} />
                        {section.complete && (
                            <Check size={12} className="complete-icon" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * 检查某个Section的子节点是否被选中
 */
function isChildSelected(section: NavSection, selectedId: string): boolean {
    if (!section.children) return false;

    const checkNode = (nodes: any[]): boolean => {
        for (const node of nodes) {
            if (node.id === selectedId) return true;
            if (node.children && checkNode(node.children)) return true;
        }
        return false;
    };

    return checkNode(section.children);
}
