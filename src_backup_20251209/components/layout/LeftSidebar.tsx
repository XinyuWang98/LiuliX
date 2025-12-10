import { useState, useEffect } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { FolderPlus, FileText, X, ChevronDown, ChevronRight, PanelLeft } from 'lucide-react';
import { FileUploader } from '@components/data/FileUploader';
import { ParsedFileData } from '@utils/fileParser';
import { createProject, Project } from '@utils/projectUtils';
import { loadProjects, saveProjects, deleteProject as deleteProjectFromDB } from '@utils/indexedDB';
import { pyodideManager } from '../../services/PyodideManager';

interface LeftSidebarProps {
    onProjectSelect?: (project: Project) => void;
    onClose?: () => void;
}

/**
 * 左侧边栏组件
 * 显示项目列表和文件管理
 */
export function LeftSidebar({ onProjectSelect, onClose }: LeftSidebarProps) {
    const { t, language } = useI18n();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [editingProject, setEditingProject] = useState<{ id: string; name: string } | null>(null);

    // 组件加载时从 IndexedDB 加载项目
    // 组件加载时从 IndexedDB 加载项目（带安全检查）
    useEffect(() => {
        loadProjects().then(loadedProjects => {
            setProjects(loadedProjects);

            // 安全检查：只自动选择小文件项目
            if (loadedProjects.length > 0) {
                const firstProject = loadedProjects[0];

                // 检查项目中是否有大文件
                const hasSafeFiles = firstProject.files.every(f => {
                    const fileSize = f.data?.fileSize || 0;
                    const sizeMB = fileSize / (1024 * 1024);
                    return sizeMB < 5; // 只自动加载<5MB的文件
                });

                if (hasSafeFiles) {
                    setSelectedProjectId(firstProject.id);
                    onProjectSelect?.(firstProject);
                } else {
                    console.warn('项目包含大文件，跳过自动选择。请手动选择项目。');
                }
            }
        }).catch(error => {
            console.error('Failed to load projects:', error);
        });
    }, []);

    // projects 变化时自动保存到 IndexedDB
    useEffect(() => {
        if (projects.length > 0) {
            saveProjects(projects).catch(error => {
                console.error('Failed to save projects:', error);
            });
        }
    }, [projects]);

    const handleFilesUploaded = async (filesData: ParsedFileData[], sampledFlags: boolean[]) => {
        console.log('批量文件上传成功:', filesData);
        console.log('抽样标记:', sampledFlags);

        // Send data to Pyodide
        for (const fileData of filesData) {
            if (fileData.rawContent) {
                try {
                    console.log(`Sending ${fileData.fileName} to Python Engine...`);
                    const result = await pyodideManager.loadData(fileData.fileName, fileData.rawContent);
                    console.log('Python Load Result:', result);

                    // Show a simple alert/toast for Verification (Temporary)
                    // In a real app we would use a proper notification system
                    const message = `Python Engine Loaded: ${fileData.fileName}\nShape: (${result.shape[0]}, ${result.shape[1]})`;
                    // We can use a custom event or valid UI approach. For MVP verification:
                    const toast = document.createElement('div');
                    toast.style.cssText = `
                        position: fixed; top: 20px; right: 20px; 
                        background: var(--bg-panel); border: 1px solid var(--primary); 
                        color: var(--text-primary); padding: 16px; borderRadius: 8px; 
                        zIndex: 10000; boxShadow: 0 4px 12px rgba(0,0,0,0.5);
                        animation: slideIn 0.3s ease-out;
                    `;
                    toast.innerText = message;
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 5000);

                } catch (error) {
                    console.error('Failed to load data into Pyodide:', error);
                }
            }
        }

        // Create new project
        // 创建新项目 - 使用 language.code
        const themeTranslations = {
            game: t('dataSource.project.themes.game'),
            sales: t('dataSource.project.themes.sales'),
            finance: t('dataSource.project.themes.finance'),
            analytics: t('dataSource.project.themes.analytics'),
            user: t('dataSource.project.themes.user'),
            data: t('dataSource.project.themes.data'),
        };

        const newProject = createProject(
            filesData,
            sampledFlags,
            language.code,
            themeTranslations
        );

        setProjects(prev => [...prev, newProject]);

        // Auto select the new project
        setSelectedProjectId(newProject.id);
        onProjectSelect?.(newProject);
    };

    const toggleProject = (projectId: string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, isExpanded: !p.isExpanded } : p
        ));
    };

    const removeProject = (projectId: string) => {
        if (confirm(t('dataSource.project.confirmDelete'))) {
            // 从数据库删除
            deleteProjectFromDB(projectId).catch(error => {
                console.error('Failed to delete project from DB:', error);
            });

            setProjects(prev => prev.filter(p => p.id !== projectId));

            setProjects(prev => prev.filter(p => p.id !== projectId));

            // If deleted project was selected, clear selection
            if (selectedProjectId === projectId) {
                setSelectedProjectId(null);
                onProjectSelect?.(null as any); // Or handle null upstream
            }
        }
    };

    const removeFile = (projectId: string, fileId: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                const newFiles = p.files.filter(f => f.id !== fileId);
                // 如果项目没有文件了,删除整个项目
                if (newFiles.length === 0) {
                    deleteProjectFromDB(projectId).catch(error => {
                        console.error('Failed to delete project from DB:', error);
                    });
                    return null;
                }
                return { ...p, files: newFiles };
            }
            return p;
        }).filter(Boolean) as Project[]);
    };

    // Modified Interaction: Click Project Header to Select Project
    const handleProjectClick = (project: Project) => {
        if (selectedProjectId !== project.id) {
            setSelectedProjectId(project.id);
            onProjectSelect?.(project);

            // Also ensure it is expanded
            if (!project.isExpanded) {
                toggleProject(project.id);
            }
        } else {
            // Toggle expand if already selected
            toggleProject(project.id);
        }
    };

    const isProjectSelected = (projectId: string) => {
        return selectedProjectId === projectId;
    };

    // 项目重命名相关函数
    const startRenaming = (projectId: string, currentName: string) => {
        setEditingProject({ id: projectId, name: currentName });
    };

    const saveRename = () => {
        if (editingProject && editingProject.name.trim()) {
            setProjects(prev => prev.map(p =>
                p.id === editingProject.id ? { ...p, name: editingProject.name.trim() } : p
            ));
        }
        setEditingProject(null);
    };

    const cancelRename = () => {
        setEditingProject(null);
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveRename();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelRename();
        }
    };

    return (
        <aside
            className="glass-panel"
            style={{
                width: '100%',
                height: 'calc(100% - 2 * var(--gap-m))',
                margin: 'var(--gap-m)',
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRight: 'none',
                marginRight: 0,
            }}>
            {/* 标题栏 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                padding: '24px var(--gap-l) 24px',
                flexShrink: 0,
            }}>
                <h2 style={{
                    fontSize: 'var(--fs-xxl)',
                    fontWeight: 'var(--fw-bold)',
                    margin: 0,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                }}>
                    {t('dataSource.title')}
                </h2>
                {onClose && (
                    <button
                        className="btn-ghost"
                        onClick={onClose}
                        style={{
                            padding: '4px',
                            color: 'var(--text-secondary)',
                            borderRadius: 'var(--radius-s)',
                            cursor: 'pointer',
                        }}
                        title="收起侧边栏"
                    >
                        <PanelLeft size={18} />
                    </button>
                )}
            </div>

            {/* 滚动内容区域 */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--gap-m)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--gap-m)',
            }}>
                {/* 新增项目按钮 */}
                <button
                    className="btn-primary"
                    onClick={() => {
                        // TODO: 实现新增空项目功能
                        console.log('新增项目');
                    }}
                    style={{
                        width: '100%',
                        padding: 'var(--gap-m)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--gap-s)',
                    }}
                >
                    <FolderPlus size={18} />
                    {t('dataSource.project.newProject')}
                </button>

                {/* 文件上传器 - 常驻显示 */}
                <FileUploader onFilesUploaded={handleFilesUploaded} />

                {/* 项目列表 */}
                {
                    projects.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--gap-m)',
                        }}>
                            {projects.map((project) => (
                                <div key={project.id} style={{
                                    background: 'var(--bg-main)',
                                    borderRadius: 'var(--radius-m)',
                                    border: '1px solid var(--border)',
                                    overflow: 'hidden',
                                }}>
                                    {/* 项目头部 */}
                                    <div
                                        onClick={() => !editingProject && handleProjectClick(project)}
                                        style={{
                                            padding: 'var(--gap-m)',
                                            cursor: editingProject ? 'default' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--gap-s)',
                                            background: isProjectSelected(project.id) ? 'var(--bg-accent)' : 'var(--bg-panel)',
                                            borderLeft: isProjectSelected(project.id) ? '3px solid var(--primary)' : '3px solid transparent',
                                            transition: 'background var(--transition-s)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!editingProject && !isProjectSelected(project.id)) {
                                                e.currentTarget.style.background = 'var(--hover-bg)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!editingProject && !isProjectSelected(project.id)) {
                                                e.currentTarget.style.background = 'var(--bg-panel)';
                                            }
                                        }}
                                    >
                                        {/* 展开/折叠图标 */}
                                        {project.isExpanded ? (
                                            <ChevronDown size={16} style={{ flexShrink: 0 }} />
                                        ) : (
                                            <ChevronRight size={16} style={{ flexShrink: 0 }} />
                                        )}

                                        {/* 项目名称 */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {editingProject?.id === project.id ? (
                                                // 编辑模式
                                                <input
                                                    type="text"
                                                    value={editingProject.name}
                                                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                                                    onKeyDown={handleRenameKeyDown}
                                                    onBlur={saveRename}
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        width: '100%',
                                                        padding: '4px 8px',
                                                        fontSize: 'var(--fs-sm)',
                                                        fontWeight: 'var(--btn-font-weight)',
                                                        background: 'var(--bg-main)',
                                                        border: '1px solid var(--primary)',
                                                        borderRadius: 'var(--radius-s)',
                                                        color: 'var(--text-primary)',
                                                        outline: 'none',
                                                    }}
                                                />
                                            ) : (
                                                // 显示模式
                                                <>
                                                    <div
                                                        onDoubleClick={(e) => {
                                                            e.stopPropagation();
                                                            startRenaming(project.id, project.name);
                                                        }}
                                                        style={{
                                                            fontSize: 'var(--fs-sm)',
                                                            fontWeight: 'var(--btn-font-weight)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            cursor: 'text',
                                                        }}
                                                        title={t('dataSource.project.rename')}
                                                    >
                                                        {project.name}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 'var(--fs-xs)',
                                                        color: 'var(--text-secondary)',
                                                    }}>
                                                        {t('dataSource.project.filesCount', { count: project.files.length })}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* 删除项目按钮 */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeProject(project.id);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                color: 'var(--text-secondary)',
                                                borderRadius: 'var(--radius-s)',
                                                transition: 'all var(--transition-s)',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--warning)';
                                                e.currentTarget.style.color = 'var(--text-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'none';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                            }}
                                            title={t('dataSource.project.delete')}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* 文件列表 */}
                                    {project.isExpanded && (
                                        <div style={{
                                            padding: 'var(--gap-s)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 'var(--gap-xs)',
                                        }}>
                                            {project.files.map((file) => {
                                                return (
                                                    <div
                                                        key={file.id}
                                                        style={{
                                                            padding: 'var(--gap-s)',
                                                            background: 'transparent',
                                                            borderRadius: 'var(--radius-s)',
                                                            border: '1px solid transparent',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--gap-s)',
                                                            cursor: 'default',
                                                            opacity: 0.8,
                                                        }}
                                                    >
                                                        <FileText size={14} style={{ flexShrink: 0 }} />
                                                        <span style={{
                                                            fontSize: 'var(--fs-xs)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {file.data.fileName}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeFile(project.id, file.id);
                                                            }}
                                                            style={{
                                                                marginLeft: 'auto',
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '2px',
                                                                color: 'var(--text-secondary)',
                                                                display: 'flex',
                                                            }}
                                                            title={t('common.delete')}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>
        </aside>
    );
}
