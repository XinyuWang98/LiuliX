/**
 * DataFrame持久化服务
 * 
 * 使用IndexedDB持久化父节点的DataFrame,支持子节点复用
 * 解决EDA闭环中"状态幻觉"问题
 * 
 * @author AntiGravity
 * @date 2026-01-09
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { logger } from '@/utils/logger';

/**
 * IndexedDB Schema定义
 */
interface DataFrameDB extends DBSchema {
    dataframes: {
        key: string;  // nodeId
        value: {
            nodeId: string;
            jsonData: string;  // DataFrame序列化为JSON
            timestamp: number;  // 创建时间
            expiresAt: number;  // 过期时间
        };
        indexes: {
            expiresAt: number;  // 按过期时间索引
        };
    };
}

/**
 * DataFrame持久化服务
 * 
 * 策略:
 * - 使用IndexedDB存储(支持大数据,约50MB)
 * - 30分钟TTL自动过期
 * - 按nodeId索引
 */
export class DataFramePersistence {
    private static readonly DB_NAME = 'liulix_dataframes';
    private static readonly STORE_NAME = 'dataframes' as const;
    private static DB_VERSION = 1;
    private static MAX_AGE_MS = 30 * 60 * 1000;  // 30分钟

    private static dbInstance: IDBPDatabase<DataFrameDB> | null = null;

    /**
     * 初始化数据库连接
     */
    private static async getDB(): Promise<IDBPDatabase<DataFrameDB>> {
        if (this.dbInstance) {
            return this.dbInstance;
        }

        this.dbInstance = await openDB<DataFrameDB>(
            this.DB_NAME,
            this.DB_VERSION,
            {
                upgrade(db: IDBPDatabase<DataFrameDB>) {
                    // 创建object store
                    if (!db.objectStoreNames.contains(DataFramePersistence.STORE_NAME)) {
                        const store = db.createObjectStore(
                            DataFramePersistence.STORE_NAME,
                            { keyPath: 'nodeId' }
                        );
                        // 创建索引(按过期时间查询)
                        store.createIndex('expiresAt', 'expiresAt');
                    }
                }
            }
        );

        logger.log('数据持久化', 'IndexedDB已初始化', {
            data: { dbName: this.DB_NAME, version: this.DB_VERSION }
        });

        return this.dbInstance;
    }

    /**
     * 保存DataFrame
     * 
     * @param nodeId 节点ID
     * @param dfJson DataFrame的JSON序列化字符串
     */
    static async saveDataFrame(nodeId: string, dfJson: string): Promise<void> {
        try {
            const db = await this.getDB();
            const now = Date.now();

            await db.put(this.STORE_NAME, {
                nodeId,
                jsonData: dfJson,
                timestamp: now,
                expiresAt: now + this.MAX_AGE_MS
            });

            logger.log('数据持久化', 'DataFrame已保存', {
                data: {
                    nodeId,
                    size: `${(dfJson.length / 1024).toFixed(2)}KB`,
                    ttl: `${this.MAX_AGE_MS / 1000 / 60}分钟`
                }
            });
        } catch (error: any) {
            logger.error('数据持久化', 'DataFrame保存失败', {
                data: { nodeId, error: error.message }
            });
            throw error;
        }
    }

    /**
     * 加载DataFrame
     * 
     * @param nodeId 节点ID
     * @returns DataFrame JSON字符串,如果不存在或已过期则返回null
     */
    static async loadDataFrame(nodeId: string): Promise<string | null> {
        try {
            const db = await this.getDB();
            const record = await db.get(this.STORE_NAME, nodeId);

            if (!record) {
                logger.log('数据持久化', 'DataFrame不存在', {
                    data: { nodeId }
                });
                return null;
            }

            // 检查是否过期
            if (Date.now() > record.expiresAt) {
                logger.warn('数据持久化', 'DataFrame已过期,自动删除', {
                    data: { nodeId, age: `${(Date.now() - record.timestamp) / 1000 / 60}分钟` }
                });
                await db.delete(this.STORE_NAME, nodeId);
                return null;
            }

            logger.log('数据持久化', 'DataFrame已加载', {
                data: {
                    nodeId,
                    size: `${(record.jsonData.length / 1024).toFixed(2)}KB`,
                    age: `${(Date.now() - record.timestamp) / 1000}秒`
                }
            });

            return record.jsonData;
        } catch (error: any) {
            logger.error('数据持久化', 'DataFrame加载失败', {
                data: { nodeId, error: error.message }
            });
            return null;  // 降级处理:失败时返回null
        }
    }

    /**
     * 清理过期数据
     * 
     * 应定期调用(如每10分钟)
     */
    static async cleanupExpired(): Promise<number> {
        try {
            const db = await this.getDB();
            const now = Date.now();

            // 通过索引查找过期记录
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            const index = tx.store.index('expiresAt');
            const expiredKeys: string[] = [];

            // 遍历所有记录
            for await (const cursor of index.iterate()) {
                if (cursor.value.expiresAt < now) {
                    expiredKeys.push(cursor.value.nodeId);
                }
            }

            // 批量删除
            for (const key of expiredKeys) {
                await db.delete(this.STORE_NAME, key);
            }

            await tx.done;

            if (expiredKeys.length > 0) {
                logger.log('数据持久化', '过期数据已清理', {
                    data: { count: expiredKeys.length }
                });
            }

            return expiredKeys.length;
        } catch (error: any) {
            logger.error('数据持久化', '清理失败', error);
            return 0;
        }
    }

    /**
     * 删除指定DataFrame
     * 
     * @param nodeId 节点ID
     */
    static async deleteDataFrame(nodeId: string): Promise<void> {
        try {
            const db = await this.getDB();
            await db.delete(this.STORE_NAME, nodeId);

            logger.log('数据持久化', 'DataFrame已删除', { data: { nodeId } });
        } catch (error: any) {
            logger.error('数据持久化', 'DataFrame删除失败', {
                data: { nodeId, error: error.message }
            });
        }
    }

    /**
     * 获取存储统计
     */
    static async getStats(): Promise<{
        count: number;
        totalSize: number;
    }> {
        try {
            const db = await this.getDB();
            const all = await db.getAll(this.STORE_NAME);

            const totalSize = all.reduce((sum: number, record) => sum + record.jsonData.length, 0);

            return {
                count: all.length,
                totalSize
            };
        } catch (error: any) {
            logger.error('数据持久化', '统计失败', error);
            return { count: 0, totalSize: 0 };
        }
    }
}

// 启动定期清理任务(每10分钟)
if (typeof window !== 'undefined') {
    setInterval(() => {
        DataFramePersistence.cleanupExpired();
    }, 10 * 60 * 1000);
}
