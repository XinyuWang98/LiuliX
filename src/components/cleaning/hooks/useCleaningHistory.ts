// 历史记录管理Hook
import { useState } from 'react';
import { logger } from '@/utils/logger';
import { HistoryItem } from '../types/cleaning.types';
/**
 * 管理清洗操作历史记录
 * @returns 历史记录和操作方法
 */
export const useCleaningHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
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
    };
    return {
        history,
        addHistoryItem,
        clearHistory
    };
};