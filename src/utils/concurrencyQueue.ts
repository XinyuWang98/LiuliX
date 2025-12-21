/**
 * 并发队列工具类
 * 用于控制AI请求的并发数量，避免同时上传多文件时服务器过载
 */

import { logger } from './logger';

type Task<T> = () => Promise<T>;

export class ConcurrencyQueue {
    private queue: Array<{ task: Task<any>; resolve: Function; reject: Function }> = [];
    private running = 0;
    private completed = 0;
    private total = 0;

    /**
     * @param maxConcurrency 最大并发数（默认3）
     */
    constructor(private maxConcurrency: number = 3) { }

    /**
     * 添加任务到队列
     */
    async add<T>(task: Task<T>): Promise<T> {
        this.total++;

        return new Promise<T>((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    /**
     * 处理队列中的任务
     */
    private async process() {
        if (this.running >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }

        this.running++;
        const item = this.queue.shift()!;

        try {
            const result = await item.task();
            item.resolve(result);
            this.completed++;

            logger.log('AI服务', `队列任务完成 (${this.completed}/${this.total})`);
        } catch (error) {
            item.reject(error);
            logger.warn('AI服务', '队列任务失败', error);
        } finally {
            this.running--;
            this.process(); // 处理下一个任务
        }
    }

    /**
     * 获取队列状态
     */
    getStatus() {
        return {
            running: this.running,
            pending: this.queue.length,
            completed: this.completed,
            total: this.total
        };
    }

    /**
     * 清空队列
     */
    clear() {
        this.queue.forEach(item => {
            item.reject(new Error('Queue cleared'));
        });
        this.queue = [];
        this.running = 0;
        this.completed = 0;
        this.total = 0;
    }
}
