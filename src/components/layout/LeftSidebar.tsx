import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { FolderPlus, FileText, X, ChevronDown, ChevronRight, PanelLeft } from 'lucide-react';
import { FileUploader, FileUploaderRef } from '@components/data/FileUploader';
import { ParsedFileData } from '@utils/fileParser';
import { createProject, Project } from '@utils/projectUtils';
import { loadProjects, saveProjects, deleteProject as deleteProjectFromDB } from '@utils/indexedDB';
import { pyodideManager } from '../../services/PyodideManager';
import { DuckDBEngine } from '../../db/duckdbEngine';
import { logger } from '@/utils/logger';
import { Logo } from '../common/Logo/Logo';

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
    const fileUploaderRef = useRef<FileUploaderRef>(null);
    // const [selectedFileId, setSelectedFileId] = useState<string | null>(null); // TODO: 文件选中功能待实现

    // 组件加载时从 IndexedDB 加载项目
    useEffect(() => {
        loadProjects().then(loadedProjects => {
            setProjects(loadedProjects);

            // 安全检查：只自动选择小文件项目
            if (loadedProjects.length > 0) {
                const firstProject = loadedProjects[0];
                const hasSafeFiles = firstProject.files.every(f => {
                    const fileSize = f.data?.fileSize || 0;
                    const sizeMB = fileSize / (1024 * 1024);
                    return sizeMB < 5;
                });

                if (hasSafeFiles) {
                    setSelectedProjectId(firstProject.id);
                    onProjectSelect?.(firstProject);
                }
            }
        }).catch(error => {
            logger.error('文件管理', '加载项目失败', error);
        });
    }, []);

    // projects 变化时自动保存到 IndexedDB
    useEffect(() => {
        if (projects.length > 0) {
            saveProjects(projects).catch(error => {
                logger.error('文件管理', '保存项目失败', error);
            });
        }
    }, [projects]);

    const handleFilesUploaded = async (filesData: ParsedFileData[], sampledFlags: boolean[]) => {
        const filesSummary = filesData.map((f, i) => ({
            name: f.fileName,
            size: f.originalFile ? `${(f.originalFile.size / 1024 / 1024).toFixed(2)}MB` : 'N/A',
            sampled: sampledFlags[i]
        }));
        logger.log('文件管理', '批量文件上传成功', { count: filesData.length, data: filesSummary });

        // 🆕 为CSV文件预先ingest到DuckDB并获取tableName
        const engine = DuckDBEngine.getInstance();
        await engine.init();

        for (let i = 0; i < filesData.length; i++) {
            const fileData = filesData[i];

            // 如果是CSV文件，立即ingest到DuckDB获取tableName
            if (fileData.fileName.toLowerCase().endsWith('.csv') && fileData.originalFile) {
                try {
                    logger.log('DuckDB', `开始导入CSV: ${fileData.fileName}`);
                    const result = await engine.ingestCSV(fileData.originalFile, {
                        sampleSize: fileData.isSampled ? 200000 : -1,
                        sampleRate: 0.2,
                        autoSampleThreshold: 200000
                    });

                    // ✅ P0修复：正确设置file.data，包含columns信息
                    // 🔍 调试日志：验证result.columns
                    console.log('📊 [LeftSidebar调试] result.columns:', result.columns);
                    console.log('📊 [LeftSidebar调试] result.columns长度:', result.columns?.length);
                    if (result.columns && result.columns.length > 0) {
                        console.log('📊 [LeftSidebar调试] 第一个column:', result.columns[0]);
                    } else {
                        console.warn('⚠️ [LeftSidebar调试] result.columns为空！');
                    }

                    (fileData as any).data = {
                        tableName: result.tableName,
                        columns: result.columns || [],
                        rowCount: result.rowCount,
                        isSampled: result.isSampled
                    };

                    // 🔍 调试日志：验证设置后的值
                    console.log('📊 [LeftSidebar调试] 设置后fileData.data:', (fileData as any).data);
                    console.log('📊 [LeftSidebar调试] 设置后fileData.data.columns长度:', (fileData as any).data.columns?.length);

                    // 同时设置tableName（向后兼容）
                    fileData.tableName = result.tableName;

                    logger.log('DuckDB', `CSV导入完成`, {
                        data: {
                            table: result.tableName,
                            rows: result.rowCount,
                            columns: result.columns?.length || 0,
                            sampled: result.isSampled
                        }
                    });
                } catch (err) {
                    logger.error('DuckDB', 'CSV导入失败', err);
                }
            }

            // Send data to Pyodide
            if (fileData.rawContent) {
                try {
                    logger.log('Python', `发送数据到Python引擎: ${fileData.fileName}`);
                    const result = await pyodideManager.loadData(fileData.fileName, fileData.rawContent);
                    logger.log('Python', `数据加载完成 shape: [${result.shape.join(', ')}]`);
                } catch (error) {
                    logger.error('Python', '数据加载失败', error);
                }
            }
        }

        // Create new project
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
                logger.error('文件管理', '删除项目失败', error);
            });

            setProjects(prev => prev.filter(p => p.id !== projectId));

            // If deleted project was selected, clear selection
            if (selectedProjectId === projectId) {
                setSelectedProjectId(null);
                onProjectSelect?.(null as any);
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
                        logger.error('文件管理', '删除项目失败', error);
                    });
                    return null;
                }
                return { ...p, files: newFiles };
            }
            return p;
        }).filter(Boolean) as Project[]);
    };

    const handleProjectClick = (project: Project) => {
        if (selectedProjectId !== project.id) {
            setSelectedProjectId(project.id);
            onProjectSelect?.(project);
            if (!project.isExpanded) {
                toggleProject(project.id);
            }
        } else {
            toggleProject(project.id);
        }
    };

    const handleFileClick = (project: Project, _fileId: string) => {
        if (selectedProjectId !== project.id) {
            handleProjectClick(project);
        }
        // setSelectedFileId(fileId); // TODO: 文件选中功能待实现
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
                <Logo layout="horizontal" size="l" />
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
                        title={t('sidebar.collapse')}
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
                {/* 上传文件按钮 */}
                <button
                    className="btn-primary"
                    onClick={() => fileUploaderRef.current?.openFileDialog()}
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
                    {t('fileUpload.uploadButton')}
                </button>

                {/* 文件上传器 - 不可见，通过ref触发 */}
                <FileUploader ref={fileUploaderRef} onFilesUploaded={handleFilesUploaded} />

                {/* 项目列表 - 树状视图 */}
                {projects.length > 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px', // 极小间距
                    }}>
                        {projects.map((project) => (
                            <div key={project.id} className="project-tree-item">
                                {/* 项目行 (Folder) */}
                                <div
                                    onClick={() => !editingProject && handleProjectClick(project)}
                                    style={{
                                        position: 'relative',
                                        height: '28px', // 紧凑行高
                                        padding: '0 var(--gap-s)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: editingProject ? 'default' : 'pointer',
                                        borderRadius: '0px',
                                        transition: 'background 0.1s',
                                        // Active State Logic for Project
                                        background: selectedProjectId === project.id
                                            ? 'linear-gradient(to right, var(--highlight-row), transparent)'
                                            : 'transparent',
                                        borderLeft: selectedProjectId === project.id
                                            ? '2px solid var(--primary)'
                                            : '2px solid transparent',
                                        color: selectedProjectId === project.id
                                            ? 'var(--text-primary)'
                                            : 'var(--text-secondary)',
                                    }}
                                    className="tree-row project-row"
                                    onMouseEnter={(e) => {
                                        if (!editingProject && selectedProjectId !== project.id) {
                                            e.currentTarget.style.background = 'var(--bg-hover)';
                                            e.currentTarget.style.color = 'var(--text-primary)';
                                        }
                                        const actions = e.currentTarget.querySelector('.project-actions') as HTMLElement;
                                        if (actions) actions.style.display = 'flex';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!editingProject && selectedProjectId !== project.id) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }
                                        const actions = e.currentTarget.querySelector('.project-actions') as HTMLElement;
                                        if (actions) actions.style.display = 'none';
                                    }}
                                >
                                    {/* 展开/折叠图标 */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'pointer'
                                    }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleProject(project.id);
                                        }}>
                                        {project.isExpanded ? (
                                            <ChevronDown size={14} />
                                        ) : (
                                            <ChevronRight size={14} />
                                        )}
                                    </div>

                                    {/* 项目名称 */}
                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                                        {editingProject?.id === project.id ? (
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
                                                    startRenaming(project.id, project.name);
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

                                    {/* 项目操作按钮 (悬浮显示) */}
                                    <div className="project-actions" style={{
                                        display: 'none',
                                        gap: '4px',
                                        marginLeft: 'auto'
                                    }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeProject(project.id);
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
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--warning)'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* 文件列表 (Files) */}
                                {project.isExpanded && (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0px',
                                    }}>
                                        {project.files.map((file) => {
                                            return (
                                                <div
                                                    key={file.id}
                                                    className="tree-row file-row"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileClick(project, file.id);
                                                    }}
                                                    style={{
                                                        height: 'var(--tree-row-height)',
                                                        paddingLeft: 'calc(var(--tree-indent) + var(--gap-s))',
                                                        paddingRight: 'var(--gap-s)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        cursor: 'pointer',
                                                        background: 'transparent',
                                                        borderLeft: '2px solid transparent',
                                                        color: 'var(--text-secondary)',
                                                        borderRadius: '0px',
                                                        transition: 'background 0.1s',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'var(--bg-hover)';
                                                        e.currentTarget.style.color = 'var(--text-primary)';
                                                        const actions = e.currentTarget.querySelector('.file-actions') as HTMLElement;
                                                        if (actions) actions.style.display = 'flex';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                                        const actions = e.currentTarget.querySelector('.file-actions') as HTMLElement;
                                                        if (actions) actions.style.display = 'none';
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

                                                    {/* 文件操作按钮 */}
                                                    <div className="file-actions" style={{
                                                        display: 'none',
                                                        marginLeft: 'auto'
                                                    }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeFile(project.id, file.id);
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                padding: '2px',
                                                                color: 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                            }}
                                                            title={t('common.delete')}
                                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--warning)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
