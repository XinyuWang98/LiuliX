import { useState } from 'react';
import { FolderOpen, FileText, MoreVertical, Plus } from 'lucide-react';
import { Project } from '@/utils/projectUtils';
import { formatRelativeTime } from '@/utils/time';
import { useI18n } from '@/contexts/I18nContext';
import './ProjectCard.css';

interface ProjectCardProps {
    project: Project;
    isActive: boolean;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onRename: (newName: string) => void;
}

export function ProjectCard({ project, isActive, onClick, onContextMenu, onRename }: ProjectCardProps) {
    const { t } = useI18n();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(project.name);

    const handleRenameSubmit = () => {
        if (editName.trim()) {
            onRename(editName.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleRenameSubmit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setEditName(project.name);
            setIsEditing(false);
        }
    };

    return (
        <div
            className={`project-card ${isActive ? 'active' : ''}`}
            onClick={onClick}
            onContextMenu={onContextMenu}
        >
            {/* 项目图标 */}
            <div className="card-icon">
                <FolderOpen size={32} />
            </div>

            {/* 项目名称 */}
            {isEditing ? (
                <input
                    className="card-title-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <div className="card-title" title={project.name}>
                    {project.name}
                </div>
            )}

            {/* 项目元信息 */}
            <div className="card-meta">
                <span className="file-count">{t('exploration.project.card.fileCount', { count: project.files.length })}</span>
                <span className="separator">·</span>
                <span className="time">{formatRelativeTime(project.updatedAt || project.createdAt)}</span>
            </div>

            {/* 文件列表（显示所有，可滚动） */}
            <div className="card-files-preview">
                {project.files.map(file => (
                    <div key={file.id} className="file-preview-item">
                        <FileText size={14} />
                        <span>{file.name}</span>
                    </div>
                ))}
            </div>

            {/* 更多操作按钮 */}
            <button
                className="card-more-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e);
                }}
            >
                <MoreVertical size={16} />
            </button>
        </div>
    );
}

// 新建项目卡片
interface NewProjectCardProps {
    onClick: () => void;
}

export function NewProjectCard({ onClick }: NewProjectCardProps) {
    const { t } = useI18n();
    return (
        <div className="project-card new-project-card" onClick={onClick}>
            <div className="card-icon new-icon">
                <Plus size={32} />
            </div>
            <div className="card-title">{t('exploration.project.card.uploadNew')}</div>
        </div>
    );
}
