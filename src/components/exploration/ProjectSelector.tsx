import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Project } from '@/utils/projectUtils';
import { loadProjects } from '@/utils/indexedDB';
import { ChevronDown, Plus, FolderOpen } from 'lucide-react';
import './ProjectSelector.css';

interface ProjectSelectorProps {
    currentProject: Project | null;
    onProjectSelect: (project: Project | null) => void;
    onNewProject: () => void;
}

export function ProjectSelector({ currentProject, onProjectSelect, onNewProject }: ProjectSelectorProps) {
    const { t } = useI18n();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadProjectsList();
    }, []);

    const loadProjectsList = async () => {
        try {
            const allProjects = await loadProjects();
            setProjects(allProjects);
        } catch (err) {
            console.error('加载项目列表失败:', err);
        }
    };

    const handleSelect = (project: Project) => {
        onProjectSelect(project);
        setIsOpen(false);
    };

    return (
        <div className="project-selector">
            <button
                className="project-selector-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <FolderOpen size={18} />
                <span className="current-project-name">
                    {currentProject?.name || t('project.selectProject')}
                </span>
                <ChevronDown size={16} className={isOpen ? 'rotated' : ''} />
            </button>

            {isOpen && (
                <>
                    <div className="project-selector-backdrop" onClick={() => setIsOpen(false)} />
                    <div className="project-selector-dropdown">
                        <div className="dropdown-header">
                            <span>{t('project.recentProjects')}</span>
                        </div>

                        <div className="dropdown-list">
                            {projects.length === 0 ? (
                                <div className="dropdown-empty">
                                    {t('project.noProjects')}
                                </div>
                            ) : (
                                projects.map(project => (
                                    <div
                                        key={project.id}
                                        className={`dropdown-item ${currentProject?.id === project.id ? 'active' : ''}`}
                                        onClick={() => handleSelect(project)}
                                    >
                                        <FolderOpen size={16} />
                                        <div className="project-info">
                                            <div className="project-name">{project.name}</div>
                                            <div className="project-meta">
                                                {t('dataSource.project.filesCount', { count: project.files.length })} · {new Date(project.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            className="dropdown-new-project"
                            onClick={() => {
                                onNewProject();
                                setIsOpen(false);
                            }}
                        >
                            <Plus size={16} />
                            {t('project.newProject')}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
