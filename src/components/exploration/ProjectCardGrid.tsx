import { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Project } from '@/utils/projectUtils';
import { loadProjects, saveProjects, deleteProject as deleteProjectFromDB } from '@/utils/indexedDB';
import { ProjectCard, NewProjectCard, ProjectCardHandle } from './ProjectCard';
import { logger } from '@/utils/logger';
import { useI18n } from '@/contexts/I18nContext';
import './ProjectCardGrid.css';

// 菜单尺寸常量（用于防溢出计算）
const MENU_WIDTH = 140;
const MENU_HEIGHT = 80; // 预估高度

interface ProjectCardGridProps {
    currentProject: Project | null;
    onProjectSelect: (project: Project) => void;
    onNewProject: () => void;
}

export function ProjectCardGrid({ currentProject, onProjectSelect, onNewProject }: ProjectCardGridProps) {
    const { t } = useI18n();
    const [projects, setProjects] = useState<Project[]>([]);
    const [contextMenu, setContextMenu] = useState<{ projectId: string; x: number; y: number } | null>(null);
    const cardRefs = useRef<Map<string, ProjectCardHandle>>(new Map());

    // 加载项目列表（监听 currentProject 变化以自动刷新）
    useEffect(() => {
        loadProjectsList();
    }, [currentProject]);

    const loadProjectsList = async () => {
        try {
            const allProjects = await loadProjects();
            setProjects(allProjects);
            logger.log('UI', '项目列表加载完成', { data: { count: allProjects.length } });
        } catch (err) {
            logger.error('UI', '加载项目列表失败', { data: err });
        }
    };

    // 右键菜单处理（修复：添加防溢出逻辑）
    const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();

        // 计算菜单位置（防止溢出屏幕）
        let x = e.clientX;
        let y = e.clientY;

        // 右边界检测
        if (x + MENU_WIDTH > window.innerWidth) {
            x = window.innerWidth - MENU_WIDTH - 10; // 留10px边距
        }

        // 下边界检测
        if (y + MENU_HEIGHT > window.innerHeight) {
            y = window.innerHeight - MENU_HEIGHT - 10;
        }

        setContextMenu({ projectId, x, y });
    };

    // 删除项目
    const handleDeleteProject = async (projectId: string) => {
        try {
            await deleteProjectFromDB(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            logger.log('UI', '项目删除成功', { data: { id: projectId } });

            // 如果删除的是当前项目，通知父组件
            if (currentProject?.id === projectId) {
                const remaining = projects.filter(p => p.id !== projectId);
                if (remaining.length > 0) {
                    onProjectSelect(remaining[0]);
                }
            }
        } catch (err) {
            logger.error('UI', '删除项目失败', { data: err });
        }
        setContextMenu(null);
    };

    // 重命名项目
    const handleRenameProject = async (projectId: string, newName: string) => {
        try {
            const updatedProjects = projects.map(p =>
                p.id === projectId ? { ...p, name: newName } : p
            );
            setProjects(updatedProjects);
            await saveProjects(updatedProjects);
            logger.log('UI', '项目重命名成功', { data: { id: projectId, newName } });
        } catch (err) {
            logger.error('UI', '重命名项目失败', { data: err });
        }
    };

    // 关闭菜单点击外层
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenu]);

    return (
        <div className="project-card-grid-container">
            <div className="grid-header">
                <h3>{t('exploration.project.grid.title')}</h3>
            </div>

            <div className="card-grid">
                {projects.map(project => (
                    <ProjectCard
                        key={project.id}
                        ref={(ref) => {
                            if (ref) {
                                cardRefs.current.set(project.id, ref);
                            } else {
                                cardRefs.current.delete(project.id);
                            }
                        }}
                        project={project}
                        isActive={currentProject?.id === project.id}
                        onClick={() => onProjectSelect(project)}
                        onContextMenu={(e) => handleContextMenu(e, project.id)}
                        onRename={(newName) => handleRenameProject(project.id, newName)}
                    />
                ))}

                <NewProjectCard onClick={onNewProject} />
            </div>

            {/* 右键菜单 */}
            {contextMenu && (
                <div
                    className="context-menu"
                    style={{
                        position: 'fixed',
                        left: `${contextMenu.x}px`,
                        top: `${contextMenu.y}px`,
                        zIndex: 9999
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="context-menu-item" onClick={() => {
                        // 修复：触发卡片的重命名编辑模式
                        const cardHandle = cardRefs.current.get(contextMenu.projectId);
                        if (cardHandle) {
                            cardHandle.startEdit();
                        }
                        setContextMenu(null);
                    }}>
                        <Edit2 size={14} />
                        <span>{t('exploration.project.context.rename')}</span>
                    </div>
                    <div className="context-menu-item danger" onClick={() => handleDeleteProject(contextMenu.projectId)}>
                        <Trash2 size={14} />
                        <span>{t('exploration.project.context.delete')}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
