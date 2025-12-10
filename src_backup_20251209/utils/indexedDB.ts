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

    // 保存所有项目
    for (const project of projects) {
        const addRequest = store.add(project);
        await new Promise<void>((resolve, reject) => {
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
        });
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
 */
export async function saveProject(project: Project): Promise<void> {
    const db = await initDB();
    const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.put(project);

    await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });

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
