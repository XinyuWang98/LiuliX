import { logger } from '@/utils/logger';
import { DuckDBEngine } from '@/db/duckdbEngine';
import { calculateMaxRowsForPyodide } from '@/utils/memoryAssessment';

/**
 * 预加载的数据结构
 */
export interface PreloadedData {
    tableName: string;
    data: any[];
    totalRows: number;
    isLimited: boolean;
    columnCount: number;
    timestamp: number;
}

/**
 * 数据预加载服务
 * 
 * 核心功能：
 * 1. 在 Worker 初始化期间并行加载数据
 * 2. 实现 Pending Promise 管理，避免重复查询
 * 3. 实现 LRU 缓存，防止内存泄漏
 */
class DataPreloader {
    /** 数据缓存 (LRU) */
    private cache = new Map<string, PreloadedData>();

    /** Pending Promise 管理（防止重复加载） */
    private pending = new Map<string, Promise<PreloadedData>>();

    /** LRU 访问顺序队列 */
    private accessOrder: string[] = [];

    /** 最大缓存大小（防止内存泄漏） */
    private readonly MAX_CACHE_SIZE = 3;

    /**
     * 预加载数据
     * 
     * @param tableName 表名
     * @returns 预加载的数据
     */
    async preload(tableName: string): Promise<PreloadedData> {
        // ========== 步骤1：检查缓存 ==========
        if (this.cache.has(tableName)) {
            logger.log('Skills', '数据预加载: 命中缓存', {
                data: { tableName }
            });

            // 更新访问顺序
            this._updateAccessOrder(tableName);

            return this.cache.get(tableName)!;
        }

        // ========== 步骤2：检查是否正在加载（防止重复查询） ==========
        if (this.pending.has(tableName)) {
            logger.log('Skills', '数据预加载: 正在加载中，等待完成', {
                data: { tableName }
            });
            return this.pending.get(tableName)!;
        }

        // ========== 步骤3：创建加载 Promise ==========
        const loadPromise = this._doLoad(tableName)
            .finally(() => {
                // 加载完成后清理 pending
                this.pending.delete(tableName);
            });

        this.pending.set(tableName, loadPromise);
        return loadPromise;
    }

    /**
     * 实际加载数据的内部方法
     */
    private async _doLoad(tableName: string): Promise<PreloadedData> {
        const startTime = performance.now();

        const db = DuckDBEngine.getInstance();
        await db.init();

        // 获取表结构
        const { getTableSchema } = await import('@/services/schemaService');
        const schema = await getTableSchema(tableName);
        const columnCount = schema.length;
        const maxRows = calculateMaxRowsForPyodide(columnCount);

        // 查询总行数
        const countResult = await db.runQuery(
            `SELECT COUNT(*) as total FROM ${tableName}`
        );
        const totalRows = Number(countResult[0]?.total || 0);

        // 构建查询
        let query = `SELECT * FROM ${tableName}`;
        let isLimited = false;

        if (totalRows > maxRows) {
            isLimited = true;
            query = `SELECT * FROM ${tableName} LIMIT ${maxRows}`;
        }

        // 执行查询
        const data = await db.runQuery(query);
        const duration = performance.now() - startTime;

        logger.log('Skills', '数据预加载: ✅ 完成', {
            data: {
                tableName,
                原始总行数: totalRows,
                实际加载行数: data.length,
                是否限制: isLimited,
                耗时: `${duration.toFixed(0)}ms`
            }
        });

        const result: PreloadedData = {
            tableName,
            data,
            totalRows,
            isLimited,
            columnCount,
            timestamp: Date.now()
        };

        // 保存到缓存（含 LRU 淘汰）
        this._updateCache(tableName, result);

        return result;
    }

    /**
     * 更新缓存（实现 LRU 淘汰）
     */
    private _updateCache(tableName: string, data: PreloadedData) {
        // 添加到缓存
        this.cache.set(tableName, data);

        // 更新访问顺序
        this._updateAccessOrder(tableName);

        // LRU 淘汰：超过最大缓存大小时，删除最久未使用的
        while (this.cache.size > this.MAX_CACHE_SIZE) {
            const oldest = this.accessOrder.shift()!;
            this.cache.delete(oldest);

            logger.log('Skills', '缓存淘汰（LRU）', {
                data: {
                    evicted: oldest,
                    cacheSize: this.cache.size,
                    remaining: Array.from(this.cache.keys())
                }
            });
        }
    }

    /**
     * 更新访问顺序（LRU 辅助方法）
     */
    private _updateAccessOrder(tableName: string) {
        // 移除旧位置
        this.accessOrder = this.accessOrder.filter(t => t !== tableName);
        // 添加到末尾（最近访问）
        this.accessOrder.push(tableName);
    }

    /**
     * 清理缓存
     * 
     * @param tableName 可选，指定表名则只清理该表，否则清理全部
     */
    clear(tableName?: string) {
        if (tableName) {
            this.cache.delete(tableName);
            this.pending.delete(tableName);
            this.accessOrder = this.accessOrder.filter(t => t !== tableName);

            logger.log('Skills', '清理缓存', {
                data: { tableName }
            });
        } else {
            this.cache.clear();
            this.pending.clear();
            this.accessOrder = [];

            logger.log('Skills', '清理全部缓存');
        }
    }

    /**
     * 获取缓存统计信息（用于调试）
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            pendingSize: this.pending.size,
            accessOrder: [...this.accessOrder],
            cachedTables: Array.from(this.cache.keys())
        };
    }
}

/**
 * 单例导出
 */
export const dataPreloader = new DataPreloader();
