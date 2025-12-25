import React from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { Project } from '@/utils/projectUtils';
import { useI18n } from '@/contexts/I18nContext';

interface ProjectTreeItemProps {
    project: Project;
    /** 当前选中项的类型和ID */
    selectedItem: { type: 'project' | 'file'; id: string } | null;
    /** 正在编辑的项目状态 */
    editingProject: { id: string; name: string } | null;
    /** 项目点击回调 */
    onProjectClick: (project: Project) => void;
    /** 文件点击回调 */
    onFileClick: (project: Project, fileId: string) => void;
    /** 展开/折叠切换 */
    onToggleExpand: (projectId: string) => void;
    /** 重命名输入变更 */
    onRenameChange: (name: string) => void;
    /** 提交重命名 */
    onRenameSubmit: () => void;
    /** 取消重命名 */
    onRenameCancel: () => void;
}

/**
 * 单个项目树节点组件
 * 包含项目行及展开后的文件列表
 */
export const ProjectTreeItem: React.FC<ProjectTreeItemProps> = ({
    project,
    selectedItem,
    editingProject,
    onProjectClick,
    onFileClick,
    onToggleExpand,
    onRenameChange,
    onRenameSubmit,
    onRenameCancel
}) => {
    // 判断项目是否被选中
    const isProjectSelected = selectedItem?.type === 'project' && selectedItem.id === project.id;
    // 判断当前是否有正在重命名的项目
    const isRenaming = editingProject?.id === project.id;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onRenameSubmit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onRenameCancel();
        }
    };

    return (
        <div className="project-tree-item">
            {/* 1. 项目行 (Folder) */}
            <div
                onClick={() => !isRenaming && onProjectClick(project)}
                style={{
                    position: 'relative',
                    height: '28px',
                    padding: '0 var(--gap-s)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: isRenaming ? 'default' : 'pointer',
                    transition: 'background 0.1s',
                    background: isProjectSelected
                        ? 'linear-gradient(to right, var(--highlight-row), transparent)'
                        : 'transparent',
                    borderLeft: isProjectSelected
                        ? '2px solid var(--primary)'
                        : '2px solid transparent',
                    color: isProjectSelected
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                }}
                className="tree-row project-row"
                onMouseEnter={(e) => {
                    if (!isRenaming && !isProjectSelected) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isRenaming && !isProjectSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                }}
            >
                {/* 展开/折叠图标 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                    }}
                    onClick={(e) => {
                        console.log('Toggle expand clicked', project.id);
                        e.stopPropagation();
                        onToggleExpand(project.id);
                    }}
                >
                    {project.isExpanded ? (
                        <ChevronDown size={14} />
                    ) : (
                        <ChevronRight size={14} />
                    )}
                </div>

                {/* 项目名称 / 重命名输入框 */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                    {isRenaming ? (
                        <input
                            type="text"
                            value={editingProject.name}
                            onChange={(e) => onRenameChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={onRenameSubmit}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                height: '24px',
                                padding: '0 4px',
                                fontSize: '13px',
                                background: 'var(--bg-main)',
                                border: '1px solid var(--primary)',
                                borderRadius: '2px',
                                color: 'var(--text-primary)',
                                outline: 'none',
                            }}
                        />
                    ) : (
                        <span
                            style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            title={project.name}
                        >
                            {project.name}
                        </span>
                    )}
                    {/* 文件计数标记 */}
                    {!isRenaming && (
                        <span style={{
                            fontSize: '11px',
                            marginLeft: '6px',
                            opacity: 0.5
                        }}>
                            {project.files.length}
                        </span>
                    )}
                </div>
            </div>

            {/* 2. 文件列表 (Files) */}
            {project.isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                    {project.files.map((file) => {
                        const isFileSelected = selectedItem?.type === 'file' && selectedItem.id === file.id;

                        return (
                            <div
                                key={file.id}
                                className="tree-row file-row"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFileClick(project, file.id);
                                }}
                                style={{
                                    height: 'var(--tree-row-height)',
                                    paddingLeft: 'calc(var(--tree-indent) + var(--gap-s))',
                                    paddingRight: 'var(--gap-s)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    transition: 'background 0.1s',
                                    background: isFileSelected
                                        ? 'var(--bg-hover)' // 文件选中可以用浅色背景
                                        : 'transparent',
                                    color: isFileSelected
                                        ? 'var(--text-primary)'
                                        : 'var(--text-secondary)',
                                    fontWeight: isFileSelected ? 600 : 400,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isFileSelected) {
                                        e.currentTarget.style.background = 'var(--bg-hover)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isFileSelected) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                <FileText size={13} style={{ opacity: 0.7 }} />
                                <span style={{
                                    fontSize: 'var(--fs-sm)',
                                    flex: 1,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }} title={file.data.fileName}>
                                    {file.data.fileName}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
