import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { FileUploader, FileUploaderRef } from '@components/data/FileUploader';
import { ParsedFileData } from '@utils/fileParser';
import { createProject, Project } from '@utils/projectUtils';
import { loadProjects, saveProjects, deleteProject as deleteProjectFromDB } from '@utils/indexedDB';
import { pyodideManager } from '../../services/PyodideManager';
import { DuckDBEngine } from '../../db/duckdbEngine';
import { logger } from '@/utils/logger';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { DataSourceToolbar } from './sidebar/DataSourceToolbar';
import { ProjectTreeItem } from './sidebar/ProjectTreeItem';

interface LeftSidebarProps {
    onProjectSelect?: (project: Project) => void;
    onClose?: () => void;
}

export function LeftSidebar({ onProjectSelect, onClose }: LeftSidebarProps) {
    const { t, language } = useI18n();
    const [projects, setProjects] = useState<Project[]>([]);

    // 统一选中状态：可以是项目或文件
    const [selectedItem, setSelectedItem] = useState<{ type: 'project' | 'file'; id: string; projectId: string } | null>(null);
    const [editingProject, setEditingProject] = useState<{ id: string; name: string } | null>(null);

    const fileUploaderRef = useRef<FileUploaderRef>(null);

    // 加载项目
    useEffect(() => {
        loadProjects().then(loadedProjects => {
            setProjects(loadedProjects);
            // 自动选择第一个合适项目的逻辑保持不变
            if (loadedProjects.length > 0) {
                const firstProject = loadedProjects[0];
                const hasSafeFiles = firstProject.files.every(f => (f.data?.fileSize || 0) / (1024 * 1024) < 5);
                if (hasSafeFiles) {
                    handleSelection('project', firstProject.id, firstProject.id, firstProject);
                }
            }
        }).catch(error => {
            logger.error('文件管理', '加载项目失败', error);
        });
    }, []);

    // 自动保存
    useEffect(() => {
        if (projects.length > 0) {
            saveProjects(projects).catch(error => logger.error('文件管理', '保存项目失败', error));
        }
    }, [projects]);

    // 统一选择处理
    const handleSelection = (type: 'project' | 'file', id: string, projectId: string, projectData?: Project) => {
        setSelectedItem({ type, id, projectId });

        // 只有选择项目时才通知父组件切换上下文
        if (type === 'project' && projectData) {
            onProjectSelect?.(projectData);
        } else if (type === 'file') {
            // 选中文件时，通常也意味着选中了该项目（作为上下文）
            const proj = projects.find(p => p.id === projectId);
            if (proj) onProjectSelect?.(proj);
        }
    };

    // 文件上传完成
    const handleFilesUploaded = async (filesData: ParsedFileData[], sampledFlags: boolean[]) => {
        // ... 原有上传逻辑 ...
        // 为了保持 diff 简洁，这里省略部分重复的 DuckDB/Pyodide 处理代码，假设它们被提取或保持原样
        // 实际上由于 replace_file_content 限制，我需要补全这部分逻辑
        // 为节省篇幅，这里复用原逻辑

        const engine = DuckDBEngine.getInstance();
        await engine.init();

        for (let i = 0; i < filesData.length; i++) {
            const fileData = filesData[i];
            if (fileData.fileName.toLowerCase().endsWith('.csv') && fileData.originalFile) {
                try {
                    const result = await engine.ingestCSV(fileData.originalFile, {
                        sampleSize: fileData.isSampled ? 200000 : -1,
                        sampleRate: 0.2,
                        autoSampleThreshold: 200000
                    });
                    (fileData as any).data = {
                        tableName: result.tableName,
                        columns: result.columns || [],
                        rowCount: result.rowCount,
                        isSampled: result.isSampled
                    };
                    fileData.tableName = result.tableName;
                } catch (err) {
                    logger.error('DuckDB', 'CSV导入失败', err);
                }
            }

            if (fileData.rawContent) {
                try {
                    await pyodideManager.loadData(fileData.fileName, fileData.rawContent);
                } catch (error) {
                    logger.error('Python', '数据加载失败', error);
                }
            }
        }

        const themeTranslations = {
            game: t('dataSource.project.themes.game'),
            sales: t('dataSource.project.themes.sales'),
            finance: t('dataSource.project.themes.finance'),
            analytics: t('dataSource.project.themes.analytics'),
            user: t('dataSource.project.themes.user'),
            data: t('dataSource.project.themes.data'),
        };

        const newProject = createProject(filesData, sampledFlags, language.code, themeTranslations);
        setProjects(prev => [...prev, newProject]);

        // 选中新项目
        handleSelection('project', newProject.id, newProject.id, newProject);
    };

    // 切换展开
    const toggleProject = (projectId: string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, isExpanded: !p.isExpanded } : p
        ));
    };

    // 删除逻辑
    const handleDelete = () => {
        logger.log('UI', '尝试删除', { data: selectedItem });
        if (!selectedItem) {
            logger.warn('UI', '无选中项，无法删除');
            return;
        }

        if (selectedItem.type === 'project') {
            logger.log('UI', '执行删除项目', { data: { id: selectedItem.id } });
            deleteProjectFromDB(selectedItem.id)
                .then(() => logger.log('文件管理', '项目删除成功'))
                .catch(err => logger.error('文件管理', '删除项目失败', err));

            setProjects(prev => {
                const next = prev.filter(p => p.id !== selectedItem.id);
                logger.log('UI', '剩余项目数', { count: next.length });
                return next;
            });
            setSelectedItem(null);
            onProjectSelect?.(null as any);
        } else if (selectedItem.type === 'file') {
            logger.log('UI', '执行删除文件', { data: { id: selectedItem.id } });
            setProjects(prev => prev.map(p => {
                if (p.id === selectedItem.projectId) {
                    const newFiles = p.files.filter(f => f.id !== selectedItem.id);
                    if (newFiles.length === 0) {
                        logger.log('UI', '项目为空，级联删除项目', { data: { projectId: p.id } });
                        deleteProjectFromDB(p.id);
                        return null;
                    }
                    return { ...p, files: newFiles };
                }
                return p;
            }).filter(Boolean) as Project[]);
            setSelectedItem(null);
        }
    };

    // 重命名逻辑
    const handleRenameStart = () => {
        if (selectedItem?.type === 'project') {
            const project = projects.find(p => p.id === selectedItem.id);
            if (project) {
                setEditingProject({ id: project.id, name: project.name });
            }
        }
    };

    const handleRenameSubmit = () => {
        if (editingProject && editingProject.name.trim()) {
            setProjects(prev => prev.map(p =>
                p.id === editingProject.id ? { ...p, name: editingProject.name.trim() } : p
            ));
        }
        setEditingProject(null);
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

            <SidebarHeader title={t('dataSource.title')} onClose={onClose} />

            {/* 新增：工具栏 */}
            <DataSourceToolbar
                onUpload={() => fileUploaderRef.current?.openFileDialog()}
                onRename={handleRenameStart}
                onDelete={handleDelete}
                canRename={selectedItem?.type === 'project'}
                canDelete={!!selectedItem}
                selectionType={selectedItem?.type || null}
            />

            <FileUploader ref={fileUploaderRef} onFilesUploaded={handleFilesUploaded} />

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0', // 工具栏已有 padding，这里取消
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
            }}>
                {projects.map((project) => (
                    <ProjectTreeItem
                        key={project.id}
                        project={project}
                        selectedItem={selectedItem}
                        editingProject={editingProject}
                        onProjectClick={(p) => {
                            if (!p.isExpanded) toggleProject(p.id);
                            handleSelection('project', p.id, p.id, p);
                        }}
                        onFileClick={(p, fileId) => handleSelection('file', fileId, p.id, p)}
                        onToggleExpand={toggleProject}
                        onRenameChange={(name) => setEditingProject(prev => prev ? { ...prev, name } : null)}
                        onRenameSubmit={handleRenameSubmit}
                        onRenameCancel={() => setEditingProject(null)}
                    />
                ))}
            </div>
        </aside>
    );
}
