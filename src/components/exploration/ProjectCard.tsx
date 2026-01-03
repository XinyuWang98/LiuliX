import { useState, forwardRef, useImperativeHandle } from 'react';
import { FolderOpen, FileText, MoreVertical, Plus } from 'lucide-react';
import { Project } from '@/utils/projectUtils';
import { formatRelativeTime } from '@/utils/time';
import { useI18n } from '@/contexts/I18nContext';
import './ProjectCard.css';

// 导出 Handle 类型，供父组件使用
export interface ProjectCardHandle {
    startEdit: () => void;
}

interface ProjectCardProps {
    project: Project;
    isActive: boolean;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onRename: (newName: string) => void;
}


export const ProjectCard = forwardRef<ProjectCardHandle, ProjectCardProps>(
    ({ project, isActive, onClick, onContextMenu, onRename }, ref) => {
        const { t } = useI18n();
        const [isEditing, setIsEditing] = useState(false);
        const [editName, setEditName] = useState(project.name);

        // 暴露给父组件的方法
        useImperativeHandle(ref, () => ({
            startEdit: () => {
                setIsEditing(true);
                setEditName(project.name);
            }
        }));

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
                {/* 标题行：图标 + 项目名称 */}
                <div className="card-header">
                    <div className="card-icon">
                        <FolderOpen size={24} />
                    </div>
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
                </div>

                {/* 项目元信息 */}
                <div className={`card-meta ${project.files.length >= 9 ? 'near-limit' : ''}`}>
                    <span className="file-count">
                        {project.files.length} / 10 {t('exploration.project.card.filesLabel')}
                    </span>
                    {project.files.length >= 9 && (
                        <span className="limit-warning" title={t('exploration.project.card.nearLimit')}>⚠</span>
                    )}
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
    });

// 设置 displayName 供调试使用
ProjectCard.displayName = 'ProjectCard';

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
