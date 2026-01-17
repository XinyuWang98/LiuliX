import { Project } from './projectUtils';

const DB_NAME = 'DataPrismDB';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';

/**
 * 初始化 IndexedDB
 */
export function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // 创建项目存储
            if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
                projectStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
    });
}

/**
 * 保存所有项目
 * 注意：Safari + COEP 环境下不支持直接存储 File 对象到 IndexedDB
 * 因此在存储前需要移除 originalFile 字段
 */
export async function saveProjects(projects: Project[]): Promise<void> {
    const db = await initDB();
    const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
    const store = transaction.objectStore(PROJECTS_STORE);

    // 清空现有数据
    const clearRequest = store.clear();
    await new Promise<void>((resolve, reject) => {
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
    });

    // 保存所有项目（移除 File 对象以兼容 Safari）
    for (const project of projects) {
        // 深拷贝并移除不可序列化的 File 对象
        const serializableProject = {
            ...project,
            files: project.files.map(file => ({
                ...file,
                data: file.data ? {
                    ...file.data,
                    // ✅ 明确保留关键数据（修复上下文丢失 #12）
                    data: file.data.data,           // JSON 数组
                    columns: file.data.columns,     // 列定义
                    fileName: file.data.fileName,
                    tableName: file.data.tableName,
                    rowCount: file.data.rowCount,
                    columnCount: file.data.columnCount,
                    fileType: file.data.fileType,
                    fileSize: file.data.fileSize,
                    originalSize: file.data.originalSize,
                    isSampled: file.data.isSampled,
                    // ❌ 删除不可序列化对象
                    originalFile: undefined,
                    rawFile: undefined,
                    file: undefined,
                    rawContent: undefined, // 大字符串，节省空间
                } : file.data,
            })),
        };

        try {
            const addRequest = store.add(serializableProject);
            await new Promise<void>((resolve, reject) => {
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(addRequest.error);
            });
        } catch (error: any) {
            if (error.name === 'QuotaExceededError') {
                console.error('❌ IndexedDB 存储空间不足，请删除旧项目');
                throw new Error('存储空间不足，请删除旧项目');
            }
            throw error;
        }
    }

    db.close();
}

/**
 * 加载所有项目
 */
export async function loadProjects(): Promise<Project[]> {
    const db = await initDB();
    const transaction = db.transaction([PROJECTS_STORE], 'readonly');
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.getAll();

    const projects = await new Promise<Project[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as Project[]);
        request.onerror = () => reject(request.error);
    });

    db.close();

    // 恢复 Date 对象
    return projects.map(p => ({
        ...p,
        createdAt: new Date(p.createdAt),
        files: p.files.map(f => ({
            ...f,
            addedAt: new Date(f.addedAt),
        })),
    }));
}

/**
 * 保存单个项目
 * 注意：同 saveProjects，需要移除 File 对象以兼容 Safari
 */
export async function saveProject(project: Project): Promise<void> {
    const db = await initDB();
    const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
    const store = transaction.objectStore(PROJECTS_STORE);

    // 深拷贝并移除不可序列化的 File 对象
    const serializableProject = {
        ...project,
        files: project.files.map(file => ({
            ...file,
            data: file.data ? {
                ...file.data,
                // ✅ 明确保留关键数据（修复上下文丢失 #12）
                data: file.data.data,
                columns: file.data.columns,
                fileName: file.data.fileName,
                tableName: file.data.tableName,
                rowCount: file.data.rowCount,
                columnCount: file.data.columnCount,
                fileType: file.data.fileType,
                fileSize: file.data.fileSize,
                originalSize: file.data.originalSize,
                isSampled: file.data.isSampled,
                // ❌ 删除不可序列化对象
                originalFile: undefined,
                rawFile: undefined,
                file: undefined,
                rawContent: undefined,
            } : file.data,
        })),
    };

    try {
        const request = store.put(serializableProject);

        await new Promise<void>((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
            console.error('❌ IndexedDB 存储空间不足，请删除旧项目');
            throw new Error('存储空间不足，请删除旧项目');
        }
        throw error;
    }

    db.close();
}

/**
 * 删除项目
 */
export async function deleteProject(projectId: string): Promise<void> {
    const db = await initDB();
    const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.delete(projectId);

    await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });

    db.close();
}

/**
 * 清空所有数据
 */
export async function clearAllData(): Promise<void> {
    const db = await initDB();
    const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.clear();

    await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });

    db.close();
}
