import { createContext, useContext, useState, ReactNode } from 'react';
import { EvidenceRecord, EvidenceStore, EvidenceType } from '@/types/evidence';

// 创建证据池上下文
const EvidenceContext = createContext<EvidenceStore | null>(null);

// 证据池 Provider 组件
export function EvidenceProvider({ children }: { children: ReactNode }) {
    const [records, setRecords] = useState<EvidenceRecord[]>([]);

    // 添加证据记录
    const addRecord = (record: Omit<EvidenceRecord, 'id' | 'timestamp' | 'isPinned'>) => {
        const newRecord: EvidenceRecord = {
            ...record,
            id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            isPinned: false,
        };
        setRecords(prev => [newRecord, ...prev]); // 新记录放在最前面（时间降序）
    };

    // 删除证据记录
    const removeRecord = (id: string) => {
        setRecords(prev => prev.filter(record => record.id !== id));
    };

    // 切换置顶状态
    const togglePin = (id: string) => {
        setRecords(prev =>
            prev.map(record =>
                record.id === id ? { ...record, isPinned: !record.isPinned } : record
            ).sort((a, b) => {
                // 置顶的记录排在前面
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                // 相同置顶状态按时间降序
                return b.timestamp - a.timestamp;
            })
        );
    };

    // 清空所有证据
    const clearAll = () => {
        setRecords([]);
    };

    // 按类型获取证据记录
    const getRecordsByType = (type: EvidenceType) => {
        return records.filter(record => record.type === type);
    };

    const store: EvidenceStore = {
        records,
        addRecord,
        removeRecord,
        togglePin,
        clearAll,
        getRecordsByType,
    };

    return (
        <EvidenceContext.Provider value={store}>
            {children}
        </EvidenceContext.Provider>
    );
}

// 使用证据池的 Hook
export function useEvidence() {
    const context = useContext(EvidenceContext);
    if (!context) {
        throw new Error('useEvidence 必须在 EvidenceProvider 内部使用');
    }
    return context;
}
