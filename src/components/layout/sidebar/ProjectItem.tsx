import React from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { Project, ProjectFile } from '@utils/projectUtils';
import { FileTreeItem } from './FileTreeItem'; // Import sibling

interface ProjectItemProps {
    project: Project;
    selectedProjectId: string | null;
    editingProject: { id: string; name: string } | null;
    fileAIStatus: Map<string, {
        status: 'pending' | 'processing' | 'ready' | 'error';
        progress?: number;
        fileName?: string;
    }>;
    onProjectClick: (project: Project) => void;
    onToggleProject: (projectId: string) => void;
    onRemoveProject: (projectId: string) => void;
    onFileClick: (projectId: string, fileId: string) => void;
    onRemoveFile: (projectId: string, fileId: string) => void;

    // Rename handlers
    onStartRenaming: (projectId: string, currentName: string) => void;
    onRenameChange: (value: string) => void;
    onRenameSave: () => void;
    onRenameCancel: () => void;

    t: (key: string) => string;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
    project,
    selectedProjectId,
    editingProject,
    fileAIStatus,
    onProjectClick,
    onToggleProject,
    onRemoveProject,
    onFileClick,
    onRemoveFile,
    onStartRenaming,
    onRenameChange,
    onRenameSave,
    onRenameCancel,
    t
}) => {
    const isRenaming = editingProject?.id === project.id;
    const isSelected = selectedProjectId === project.id;

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onRenameSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onRenameCancel();
        }
    };

    // Helper to resolve AI status
    const getFileAIStatus = (file: ProjectFile) => {
        // 1. 优先用file.id查找
        let status = fileAIStatus.get(file.id);

        // 2. 兼容性查找：如果map key是文件名 (旧版本数据)
        if (!status) {
            status = fileAIStatus.get(file.data.fileName);
        }

        // 3. 鲁棒性查找：遍历Map寻找匹配的fileName
        if (!status) {
            const normalizedFileName = file.data.fileName.trim();
            for (const [key, value] of fileAIStatus.entries()) {
                // Case A: 对应新数据 (value包含fileName)
                if (typeof value === 'object' && (value as any).fileName === file.data.fileName) {
                    status = value;
                    break;
                }
                // Case B: 对应旧数据 (key即为文件名)，增加trim()容错
                if (typeof key === 'string' && key.trim() === normalizedFileName) {
                    status = value;
                    break;
                }
            }
        }
        return status;
    };

    return (
        <div className="project-tree-item">
            {/* 项目行 (Folder) */}
            <div
                onClick={() => !editingProject && onProjectClick(project)}
                style={{
                    position: 'relative',
                    height: '32px',
                    padding: '0 var(--gap-s)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: editingProject ? 'default' : 'pointer',
                    borderRadius: 'var(--radius-m)',
                    transition: 'all 0.2s ease',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                    marginBottom: '2px'
                }}
            >
                {/* 展开/折叠图标 */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleProject(project.id);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        marginRight: '2px',
                        color: isSelected ? 'var(--primary)' : 'inherit'
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
                            value={editingProject!.name}
                            onChange={(e) => onRenameChange(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={() => onRenameSave()}
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
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                onStartRenaming(project.id, project.name);
                            }}
                        >
                            {project.name}
                        </span>
                    )}
                    {/* 文件计数标记 */}
                    {!editingProject && (
                        <span style={{
                            fontSize: '11px',
                            marginLeft: '6px',
                            opacity: 0.5
                        }}>
                            {project.files.length}
                        </span>
                    )}
                </div>

                {/* 项目操作按钮 (原始状态，可能被CSS隐藏) */}
                <div className="project-actions">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveProject(project.id);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                        }}
                        title={t('dataSource.project.delete')}
                    >
                        <X size={13} />
                    </button>
                </div>
            </div>

            {/* 文件列表 (Files) */}
            {project.isExpanded && (
                <div
                    className="project-files-container"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0px',
                    }}>
                    {project.files.map((file) => (
                        <div key={file.id} className="stagger-item">
                            <FileTreeItem
                                file={file}
                                projectId={project.id}
                                onFileClick={onFileClick}
                                onRemoveFile={onRemoveFile}
                                aiStatus={getFileAIStatus(file)}
                                t={t}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
