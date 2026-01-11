/**
 * 浏览器平台适配器
 */

import type { PlatformAdapter, ExecutionContext } from '../types';
import type { InsightNode } from '@/types/insightTree';
import { browserWorkerPool } from './workerPool';
import { getBrowserMemory } from '@/utils/resourceLimits';

/**
 * 浏览器平台适配器实现
 */
export class BrowserAdapter implements PlatformAdapter {
    /**
     * 执行Python代码
     */
    async executeCode(code: string, context: ExecutionContext): Promise<any> {
        return browserWorkerPool.execute(code, context);
    }

    /**
     * 获取最优并发数
     */
    getOptimalConcurrency(nodes: InsightNode[]): number {
        const memory = this.getAvailableMemory();

        // 动态决策并发数
        if (memory >= 16000) {
            return 5;  // 16GB+ 高性能设备
        } else if (memory >= 8000) {
            return 3;  // 8GB 标准设备
        } else {
            return 1;  // < 8GB 低端设备
        }
    }

    /**
     * 获取可用内存（MB）
     */
    getAvailableMemory(): number {
        return getBrowserMemory();
    }

    /**
     * 实际测量数据内存占用（可选实现）
     */
    async measureActualMemory(tableName: string): Promise<number> {
        const code = `
import sys
df_sample = ${tableName}.head(1000)
memory_bytes = df_sample.memory_usage(deep=True).sum()
print(memory_bytes)
`;

        try {
            const sampleMemory = await browserWorkerPool.execute(code, { tableName });
            // TODO: 获取实际行数，计算总内存
            return sampleMemory;
        } catch (error) {
            console.error('[BrowserAdapter] 内存测量失败:', error);
            // 降级为估算
            return 0;
        }
    }
}
