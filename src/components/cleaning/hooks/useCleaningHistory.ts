// 历史记录管理Hook
import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { HistoryItem } from '../types/cleaning.types';

// P2：localStorage存储键名
const HISTORY_STORAGE_KEY = 'liulix_cleaning_history_v1';

/**
 * 管理清洗操作历史记录
 * P2 修复：添加localStorage持久化，刷新页面后保留记录
 * @returns 历史记录和操作方法
 */
export const useCleaningHistory = () => {
    // P2：从 localStorage 初始化历史记录
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                logger.log('数据清洗', `从本地存储恢复 ${parsed.length} 条历史记录`);
                return parsed;
            }
        } catch (err) {
            logger.warn('数据清洗', '历史记录加载失败', { error: err });
        }
        return [];
    });

    // P2：自动持久化到 localStorage
    useEffect(() => {
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
            logger.log('数据清洗', `历史记录已保存 (${history.length} 条)`);
        } catch (err) {
            logger.error('数据清洗', '历史记录保存失败', { error: err });
        }
    }, [history]);

    /**
     * 添加历史记录项
     */
    const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
        const newItem: HistoryItem = {
            id: `hist_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            ...item
        };
        setHistory(prev => [...prev, newItem]);
        logger.log('数据清洗', '历史记录已添加', { data: newItem.action });
    };

    /**
     * 清空历史记录
     */
    const clearHistory = () => {
        setHistory([]);
        logger.log('数据清洗', '历史记录已清空');
    };

    return {
        history,
        addHistoryItem,
        clearHistory
    };
};