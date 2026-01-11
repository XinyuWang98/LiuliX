/**
 * 浏览器版本 Worker Pool
 * 渐进式预热：首个Worker立即初始化，其余Worker后台异步初始化
 */

import { PyodideWorkerManager } from '@/utils/pyodideWorker';
import { getBrowserMemory } from '@/utils/resourceLimits';
import { logger } from '@/utils/logger';

/**
 * 任务队列项
 */
interface Task {
    code: string;
    context: any;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
}

/**
 * 浏览器Worker Pool
 * 支持动态并发（1/3/5）和渐进式预热
 */
export class BrowserWorkerPool {
    private workers: PyodideWorkerManager[] = [];
    private idleWorkers: PyodideWorkerManager[] = [];
    private queue: Task[] = [];
    private poolSize: number;
    private initialized = false;
    private initPromise: Promise<void> | null = null;  // 初始化锁

    constructor() {
        // 动态配置并发数
        const browserMemory = getBrowserMemory();
        if (browserMemory >= 16000) {
            this.poolSize = 5;
        } else if (browserMemory >= 8000) {
            this.poolSize = 3;
        } else {
            this.poolSize = 1;  // 降级为单Worker
        }

        logger.log('AI服务', `[WorkerPool] 配置并发数: ${this.poolSize} (内存: ${browserMemory}MB)`);
    }

    /**
     * 渐进式预热初始化（带并发锁）
     * 先初始化首个Worker（阻塞），然后后台异步初始化其余Worker
     */
    private async init(): Promise<void> {
        // 并发锁：如果正在初始化，等待完成
        if (this.initPromise) {
            return this.initPromise;
        }

        if (this.initialized) return;

        this.initPromise = (async () => {
            logger.log('AI服务', `[WorkerPool] 开始渐进式初始化 ${this.poolSize} 个Worker...`);
            const startTime = performance.now();

            // 第1步：立即初始化首个Worker（阻塞3秒）
            const firstWorker = new PyodideWorkerManager();
            await firstWorker.initialize();
            this.workers.push(firstWorker);
            this.idleWorkers.push(firstWorker);

            const firstDuration = performance.now() - startTime;
            logger.log('AI服务', `[WorkerPool] Worker #0 就绪，耗时 ${firstDuration.toFixed(0)}ms`);

            this.initialized = true;  // 标记为已初始化，首个Worker可用

            // 第2步：后台异步初始化其余Worker（不阻塞）
            if (this.poolSize > 1) {
                Promise.all(
                    Array(this.poolSize - 1).fill(0).map(async (_, i) => {
                        const worker = new PyodideWorkerManager();
                        await worker.initialize();
                        this.workers.push(worker);
                        this.idleWorkers.push(worker);
                        logger.log('AI服务', `[WorkerPool] Worker #${i + 1} 就绪（后台）`);
                    })
                ).then(() => {
                    const totalDuration = performance.now() - startTime;
                    logger.log('AI服务', `[WorkerPool] 全部Worker就绪，总耗时 ${totalDuration.toFixed(0)}ms`);
                });
            }
        })();

        return this.initPromise;
    }

    /**
     * 执行Python代码（自动初始化）
     */
    async execute(code: string, context: any): Promise<any> {
        // 渐进式预热：首次调用时初始化
        if (!this.initialized) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const task = { code, context, resolve, reject };

            if (this.idleWorkers.length > 0) {
                this.runTask(task);
            } else {
                this.queue.push(task);
            }
        });
    }

    /**
     * 执行单个任务
     */
    private async runTask(task: Task): Promise<void> {
        const worker = this.idleWorkers.pop()!;

        try {
            const result = await worker.runPython(task.code);
            task.resolve(result);
        } catch (error) {
            task.reject(error as Error);
        } finally {
            // Worker重新空闲
            this.idleWorkers.push(worker);

            // 处理队列中的下一个任务
            if (this.queue.length > 0) {
                this.runTask(this.queue.shift()!);
            }
        }
    }

    /**
     * 获取Worker Pool状态
     */
    getStatus() {
        return {
            poolSize: this.poolSize,
            initialized: this.initialized,
            workersReady: this.workers.length,
            idleWorkers: this.idleWorkers.length,
            queueLength: this.queue.length,
        };
    }
}

// 全局单例
export const browserWorkerPool = new BrowserWorkerPool();
