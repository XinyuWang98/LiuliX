import React, { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { WhitepaperDoc } from '@/types/whitepaper';
import { ChevronRight, ChevronDown, FileText } from 'lucide-react';

interface DocSidebarProps {
    docs: WhitepaperDoc[];
    activeDocId: string;
    onSelect: (docId: string) => void;
}

export const DocSidebar: React.FC<DocSidebarProps> = ({ docs, activeDocId, onSelect }) => {
    const { t } = useI18n();

    const renderItem = (doc: WhitepaperDoc, depth = 0) => {
        if (doc.hidden) return null;

        const hasChildren = doc.children && doc.children.length > 0;
        // 默认展开所有一级菜单
        const [isExpanded, setIsExpanded] = useState(depth === 0);
        const isActive = doc.id === activeDocId;

        return (
            <div key={doc.id} className="doc-nav-item-wrapper">
                <div
                    className={`doc-nav-item depth-${depth} ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) {
                            setIsExpanded(!isExpanded);
                        } else {
                            onSelect(doc.id);
                        }
                    }}
                    style={{ paddingLeft: `${depth * 16 + 12}px` }}
                >
                    {hasChildren && (
                        <span className="nav-icon toggle-icon">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                    )}
                    {!hasChildren && (
                        <span className="nav-icon file-icon">
                            {/* 只有活跃时才显示图标，保持极致简洁 */}
                            {isActive && <FileText size={14} />}
                        </span>
                    )}
                    <span className="nav-label">
                        {/* 尝试作为Key翻译，如果不是Key则直接显示 */}
                        {doc.title.includes('.') ? t(doc.title) : doc.title}
                    </span>
                </div>
                {hasChildren && isExpanded && (
                    <div className="doc-nav-children">
                        {doc.children!.map(child => renderItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <nav className="doc-sidebar">
            <div className="doc-sidebar-content">
                {docs.map(doc => renderItem(doc))}
            </div>

            <style>{`
                .doc-sidebar {
                    width: 260px;
                    height: 100%;
                    border-right: 1px solid var(--border);
                    background: var(--bg-panel);
                    overflow-y: auto;
                    flex-shrink: 0;
                }
                .doc-sidebar-content {
                    padding: 24px 0;
                }
                .doc-nav-item {
                    display: flex;
                    align-items: center;
                    height: 36px;
                    cursor: pointer;
                    font-size: 14px;
                    color: var(--text-secondary);
                    transition: all 0.2s;
                    margin: 2px 12px;
                    border-radius: 4px;
                    user-select: none;
                }
                .doc-nav-item:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }
                .doc-nav-item.active {
                    background: var(--primary-light);
                    color: var(--primary);
                    font-weight: 500;
                }
                .nav-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    margin-right: 4px;
                    color: inherit;
                    opacity: 0.7;
                }
                .nav-label {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            `}</style>
        </nav>
    );
};
