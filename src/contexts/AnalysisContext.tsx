/**
 * AnalysisContext - EDA 闭环全局状态管理
 * 
 * 职责：
 * 1. 存储用户采纳的洞察 (adoptedInsights)
 * 2. 提供容量限制 (最多 5 条)
 * 3. 提供乐观锁版本控制
 * 4. 支持取消采纳
 */

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

// ========== 类型定义 ==========

/** 采纳的洞察条目 */
export interface AdoptedInsight {
    id: string;
    depth: number;                    // 层级 (0=L0, 1=L1, ...)
    parentId?: string;                // 父卡片 ID (depth > 0 时有值)
    type: 'data_quality' | 'distribution' | 'correlation' | 'trend' | 'outlier' | 'other';
    description: string;              // 用户可读描述
    structuredData?: {
        column?: string;              // 涉及的列名
        issues?: string[];            // 问题类型
        values?: Record<string, unknown>;  // 具体数值 (隐私模式下为空)
    };
    timestamp: number;
}

interface AnalysisContextValue {
    /** 已采纳的洞察列表 */
    adoptedInsights: AdoptedInsight[];
    /** Context 版本号 (用于乐观锁) */
    contextVersion: number;

    /** 添加采纳的洞察 */
    addAdoptedInsight: (insight: AdoptedInsight) => void;
    /** 移除采纳的洞察 (取消采纳) */
    removeAdoptedInsight: (id: string) => void;
    /** 获取所有采纳的洞察 */
    getAdoptedInsights: () => AdoptedInsight[];
    /** 清空所有洞察 */
    clearAll: () => void;
}

// ========== Context 创建 ==========

const AnalysisContext = createContext<AnalysisContextValue | undefined>(undefined);

// ========== 常量 ==========

/** P0 防护：最多保留 5 条洞察 */
const MAX_ADOPTED_INSIGHTS = 5;

// ========== Provider ==========

export function AnalysisContextProvider({ children }: { children: React.ReactNode }) {
    const [adoptedInsights, setAdoptedInsights] = useState<AdoptedInsight[]>([]);
    const [contextVersion, setContextVersion] = useState(0);

    /**
     * 添加采纳的洞察
     * P0 防护：容量限制，超出时移除最早的
     */
    const addAdoptedInsight = useCallback((insight: AdoptedInsight) => {
        setAdoptedInsights(prev => {
            const updated = [...prev, insight];

            // 容量限制
            if (updated.length > MAX_ADOPTED_INSIGHTS) {
                const removed = updated[0];
                logger.log('数据分析', `[AnalysisContext] 容量限制，移除最早洞察`, {
                    data: { removedId: removed.id, description: removed.description }
                });
                return updated.slice(-MAX_ADOPTED_INSIGHTS);
            }

            return updated;
        });

        // 更新版本号
        setContextVersion(v => v + 1);

        logger.log('数据分析', `[AnalysisContext] 添加洞察`, {
            data: {
                id: insight.id,
                depth: insight.depth,
                type: insight.type,
                description: insight.description,
                totalCount: adoptedInsights.length + 1
            }
        });
    }, [adoptedInsights.length]);

    /**
     * 移除采纳的洞察 (取消采纳)
     */
    const removeAdoptedInsight = useCallback((id: string) => {
        setAdoptedInsights(prev => {
            const filtered = prev.filter(i => i.id !== id);

            if (filtered.length === prev.length) {
                logger.warn('数据分析', `[AnalysisContext] 未找到洞察`, { data: { id } });
                return prev;
            }

            logger.log('数据分析', `[AnalysisContext] 移除洞察`, {
                data: { id, remainingCount: filtered.length }
            });

            return filtered;
        });

        setContextVersion(v => v + 1);
    }, []);

    /**
     * 获取所有采纳的洞察
     */
    const getAdoptedInsights = useCallback(() => {
        return adoptedInsights;
    }, [adoptedInsights]);

    /**
     * 清空所有洞察
     */
    const clearAll = useCallback(() => {
        setAdoptedInsights([]);
        setContextVersion(0);
        logger.log('数据分析', '[AnalysisContext] 清空所有洞察');
    }, []);

    const value: AnalysisContextValue = {
        adoptedInsights,
        contextVersion,
        addAdoptedInsight,
        removeAdoptedInsight,
        getAdoptedInsights,
        clearAll
    };

    return (
        <AnalysisContext.Provider value={value}>
            {children}
        </AnalysisContext.Provider>
    );
}

// ========== Hook ==========

export function useAnalysisContext(): AnalysisContextValue {
    const context = useContext(AnalysisContext);

    if (!context) {
        throw new Error('useAnalysisContext 必须在 AnalysisContextProvider 内使用');
    }

    return context;
}
