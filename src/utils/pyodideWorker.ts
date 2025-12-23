/**
 * Pyodide Worker 管理器
 * 提供简洁的 API 来使用 Pyodide Web Worker
 */

import { logger } from './logger';

export interface PyodideWorkerMessage {
    id: string;
    type: string;
    payload?: any;
}

export class PyodideWorkerManager {
    private worker: Worker | null = null;
    private messageId = 0;
    private pendingMessages: Map<string, {
        resolve: (value: any) => void;
        reject: (error: Error) => void;
    }> = new Map();

    /**
     * 初始化 Worker
     */
    async initialize(): Promise<void> {
        if (this.worker) {
            return;
        }

        this.worker = new Worker('/pyodide.worker.js');

        this.worker.addEventListener('message', (event: MessageEvent<PyodideWorkerMessage>) => {
            const { id, type, payload } = event.data;

            if (type === 'WORKER_READY') {
                logger.log('Python', 'Pyodide Worker就绪');
                return;
            }

            const pending = this.pendingMessages.get(id);
            if (!pending) {
                console.warn(`No pending message found for id: ${id} `);
                return;
            }

            this.pendingMessages.delete(id);

            if (type === 'ERROR') {
                pending.reject(new Error(payload.message));
            } else {
                pending.resolve(payload);
            }
        });

        this.worker.addEventListener('error', (error) => {
            console.error('Pyodide Worker error:', error);
        });

        // 初始化 Pyodide
        return this.sendMessage('INIT');
    }

    /**
     * 发送消息给 Worker
     */
    private sendMessage(type: string, payload?: any): Promise<any> {
        if (!this.worker) {
            throw new Error('Worker not initialized. Call initialize() first.');
        }

        const id = `msg_${this.messageId++} `;

        return new Promise((resolve, reject) => {
            this.pendingMessages.set(id, { resolve, reject });

            this.worker!.postMessage({
                id,
                type,
                payload,
            });
        });
    }

    /**
     * 运行 Python 代码
     * @param code Python 代码字符串
     * @param namespace 可选的变量命名空间
     */
    async runPython(code: string, namespace?: Record<string, any>): Promise<any> {
        const response = await this.sendMessage('RUN_PYTHON', { code, namespace });
        return response.result;
    }

    /**
     * 加载数据到 Pandas DataFrame
     * @param data 数据对象 {columns: string[], data: any[][]}
     * @param variableName 变量名，默认为 'df'
     */
    async loadData(data: { columns: string[]; data: any[][] }, variableName = 'df'): Promise<void> {
        await this.sendMessage('LOAD_DATA', { data, variableName });
    }

    /**
     * 获取数据统计信息
     * @param variableName DataFrame 变量名
     */
    async getStats(variableName = 'df'): Promise<any> {
        const response = await this.sendMessage('GET_STATS', { variableName });
        return response.stats;
    }

    /**
     * 终止 Worker
     */
    terminate(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.pendingMessages.clear();
        }
    }
}

// 全局单例
let workerInstance: PyodideWorkerManager | null = null;

/**
 * 获取 Pyodide Worker 实例（单例）
 */
export function getPyodideWorker(): PyodideWorkerManager {
    if (!workerInstance) {
        workerInstance = new PyodideWorkerManager();
    }
    return workerInstance;
}
