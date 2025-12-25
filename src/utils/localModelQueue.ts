/**
 * 本地模型请求队列管理器
 * 解决并发调用导致GPU崩溃的问题
 */

import { logger } from './logger';

type QueuedRequest<T> = {
    id: string;
    execute: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
    priority: 'high' | 'normal'; // 优先级：high=清洗建议, normal=洞察生成
};

/**
 * 本地模型请求队列
 * 确保同一时间只有一个请求在执行
 * 支持优先级：高优先级请求可插队
 */
class LocalModelQueue {
    private queue: QueuedRequest<any>[] = [];
    private isProcessing: boolean = false;
    private requestId: number = 0;

    /**
     * 添加请求到队列
     * @param execute 要执行的异步函数
     * @param priority 优先级 (high=清洗建议, normal=洞察生成)
     */
    async enqueue<T>(execute: () => Promise<T>, priority: 'high' | 'normal' = 'normal'): Promise<T> {
        const id = `req_${++this.requestId}`;

        return new Promise<T>((resolve, reject) => {
            const request = { id, execute, resolve, reject, priority };

            // 高优先级插队：插入到第一个普通优先级之前
            if (priority === 'high') {
                const firstNormalIndex = this.queue.findIndex(req => req.priority === 'normal');
                if (firstNormalIndex !== -1) {
                    this.queue.splice(firstNormalIndex, 0, request);
                    logger.log('本地模型', `⚡ 高优先级请求插队 ${id} (位置: ${firstNormalIndex}, 队列长度: ${this.queue.length})`);
                } else {
                    this.queue.push(request);
                    logger.log('本地模型', `⚡ 高优先级请求入队 ${id} (队列长度: ${this.queue.length})`);
                }
            } else {
                this.queue.push(request);
                logger.log('本地模型', `请求入队 ${id} (队列长度: ${this.queue.length})`);
            }

            // 如果当前没有在处理，立即开始
            if (!this.isProcessing) {
                this.processNext();
            }
        });
    }

    /**
     * 处理队列中的下一个请求
     */
    private async processNext(): Promise<void> {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            logger.log('本地模型', '队列处理完成');
            return;
        }

        this.isProcessing = true;
        const request = this.queue.shift()!;

        logger.log('本地模型', `开始处理 ${request.id} (剩余: ${this.queue.length})`);

        try {
            const result = await request.execute();
            request.resolve(result);
        } catch (error) {
            logger.error('本地模型', `请求失败 ${request.id}`, error);
            request.reject(error as Error);
        } finally {
            // 继续处理下一个
            setTimeout(() => this.processNext(), 100); // 100ms间隔，避免GPU压力过大
        }
    }

    /**
     * 清空队列
     */
    clear(): void {
        const count = this.queue.length;
        this.queue.forEach(req => {
            req.reject(new Error('队列已清空'));
        });
        this.queue = [];
        this.isProcessing = false;
        logger.log('本地模型', `队列已清空 (取消: ${count}个)`);
    }

    /**
     * 获取队列状态
     */
    getStatus(): { queueLength: number; isProcessing: boolean } {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing
        };
    }
}

// 全局单例
export const localModelQueue = new LocalModelQueue();
