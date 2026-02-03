
import { logger } from '@/utils/logger';

// Worker Wrapper
class LocalRouterService {
    private worker: Worker | null = null;
    private pendingRequests: Map<string, { resolve: Function, reject: Function }> = new Map();
    private modelStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
    private onProgressCallback: ((progress: number) => void) | null = null;

    constructor() {
        this.initWorker();
    }

    private initWorker() {
        if (typeof window === 'undefined') return;

        // Initialize Worker
        this.worker = new Worker(new URL('./LocalRouterWorker.ts', import.meta.url), {
            type: 'module'
        });

        this.worker.onmessage = (event) => {
            const { type, id, data } = event.data;

            if (type === 'result' && id) {
                const request = this.pendingRequests.get(id);
                if (request) {
                    request.resolve(data);
                    this.pendingRequests.delete(id);
                }
            } else if (type === 'error') {
                if (id) {
                    const request = this.pendingRequests.get(id);
                    if (request) {
                        request.reject(new Error(data));
                        this.pendingRequests.delete(id);
                    }
                } else {
                    logger.error('LocalRouter', 'Worker Error', data);
                    this.modelStatus = 'error';
                }
            } else if (type === 'status') {
                this.modelStatus = data;
                logger.log('LocalRouter', `Model Status: ${data}`);
            } else if (type === 'progress') {
                // Handle progress (e.g., download percentage)
                // data: { model: 'classifier', status: 'progress', loaded: 123, total: 456 }
                if (data.status === 'progress' && data.total && this.onProgressCallback) {
                    const progress = Math.round((data.loaded / data.total) * 100);
                    this.onProgressCallback(progress);
                }
            }
        };
    }

    /**
     * Load models (idempotent)
     */
    public async loadModels(onProgress?: (p: number) => void): Promise<void> {
        if (this.modelStatus === 'ready') return;

        this.onProgressCallback = onProgress || null;
        return this.sendMessage('load', {});
    }

    /**
     * Classify Intent
     */
    public async classifyIntent(text: string, labels: string[]): Promise<{ labels: string[], scores: number[] }> {
        return this.sendMessage('classify', { text, labels });
    }

    /**
     * Extract Parameters
     */
    public async extractParameters(context: string, question: string): Promise<{ answer: string, score: number }> {
        return this.sendMessage('extract', { context, question });
    }

    /**
     * Terminate Worker (Free up memory)
     */
    public terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.modelStatus = 'idle';
        }
    }

    // Helper to send message with Promise wrapper
    private sendMessage(type: string, data: any): Promise<any> {
        if (!this.worker) this.initWorker();

        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(7);
            this.pendingRequests.set(id, { resolve, reject });
            this.worker?.postMessage({ type, data, id });

            // Timeout safety (30s)
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('LocalRouter Request Timeout'));
                }
            }, 30000);
        });
    }

    public getStatus() {
        return this.modelStatus;
    }
}

// Singleton Instance
export const localRouterService = new LocalRouterService();
