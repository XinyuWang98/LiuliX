import { logger } from '../utils/logger';

export interface PyodideResponse {
    id: string;
    type: 'SUCCESS' | 'ERROR' | 'STATUS' | 'READY';
    result?: any;
    error?: string;
    message?: string;
}

class PyodideManager {
    private worker: Worker | null = null;
    private listeners: Map<string, (response: PyodideResponse) => void> = new Map();
    private readyResolver: (() => void) | null = null;
    private isReady: boolean = false;
    private readyPromise: Promise<void>;

    constructor() {
        this.readyPromise = new Promise((resolve) => {
            this.readyResolver = resolve;
        });
    }

    public initialize() {
        if (this.worker) return;

        // Create worker using Vite's worker import syntax
        this.worker = new Worker(new URL('../workers/pyodide/worker.ts', import.meta.url), {
            type: 'module',
        });

        this.worker.onmessage = (event) => {
            const data = event.data as PyodideResponse;

            if (data.type === 'READY') {
                this.isReady = true;
                logger.log('Python', '引擎就绪');
                if (this.readyResolver) this.readyResolver();
            } else if (data.type === 'STATUS') {
                logger.log('Python', `状态: ${data.message}`);
            } else {
                // Handle request responses
                if (data.id && this.listeners.has(data.id)) {
                    this.listeners.get(data.id)!(data);
                    this.listeners.delete(data.id);
                }
            }
        };
    }

    public async waitForReady() {
        if (this.isReady) return;
        return this.readyPromise;
    }

    public async runPython(code: string): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('RUN_CODE', code);
    }

    public async loadData(filename: string, csvContent: string): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('LOAD_DATA', { filename, csv: csvContent });
    }

    /**
     * 从文件内容加载数据到 DataFrame
     * @param fileContent - 文件内容（CSV/JSON 字符串）
     * @param fileType - 文件类型 ('csv' | 'json')
     * @param options - 加载选项
     * @returns DataFrameInfo 对象
     */
    public async loadDataFromFile(
        fileContent: string,
        fileType: 'csv' | 'json',
        options: { maxRows?: number; sample?: boolean } = {}
    ): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('LOAD_DATA_FILE', {
            content: fileContent,
            fileType,
            options
        });
    }

    /**
     * 计算 DataFrame 的列统计信息
     * @returns ColumnStats[] 数组
     */
    public async calculateColumnStats(): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('CALCULATE_STATS', {});
    }

    /**
     * 获取 DataFrame 预览数据（前 N 行）
     * @param rows - 获取的行数，默认 100
     * @returns 二维数组数据
     */
    public async getPreviewData(rows: number = 100): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('GET_PREVIEW', { rows });
    }

    private sendMessage(type: string, content: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error('Pyodide worker not initialized.'));
                return;
            }

            const id = Math.random().toString(36).substring(7);

            this.listeners.set(id, (response) => {
                if (response.type === 'SUCCESS') {
                    resolve(response.result);
                } else {
                    reject(new Error(response.error || 'Unknown worker error'));
                }
            });

            this.worker.postMessage({ id, type, content });
        });
    }
}

export const pyodideManager = new PyodideManager();
