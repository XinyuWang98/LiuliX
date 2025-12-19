import { createContext, useContext, useState, ReactNode } from 'react';
import { EvidenceRecord, EvidenceStore, EvidenceType } from '@/types/evidence';

// 创建证据池上下文
const EvidenceContext = createContext<EvidenceStore | null>(null);

// 证据池 Provider 组件
export function EvidenceProvider({ children }: { children: ReactNode }) {
    // 初始化 mock 数据（用于演示和测试）
    const initialMockRecords: EvidenceRecord[] = [
        {
            id: 'mock-001',
            timestamp: Date.now() - 1000 * 60 * 5, // 5分钟前
            type: 'cleaning',
            title: '删除重复行',
            description: '检测到并删除了完全重复的数据记录，保证数据唯一性',
            sql: 'CREATE OR REPLACE TABLE sales_data AS SELECT DISTINCT * FROM sales_data',
            beforeCount: 1250,
            afterCount: 1050,
            affectedRows: 200,
            isPinned: true, // 置顶显示
            tags: ['数据质量', '去重'],
        },
        {
            id: 'mock-002',
            timestamp: Date.now() - 1000 * 60 * 15, // 15分钟前
            type: 'cleaning',
            title: '填充缺失值',
            description: '使用中位数填充数值列的缺失值，使用"Unknown"填充文本列',
            sql: 'UPDATE sales_data SET amount = 1500.00 WHERE amount IS NULL',
            beforeCount: 1050,
            afterCount: 1050,
            affectedRows: 85,
            isPinned: false,
            tags: ['缺失值处理'],
        },
        {
            id: 'mock-003',
            timestamp: Date.now() - 1000 * 60 * 30, // 30分钟前
            type: 'analysis',
            title: '异常值检测',
            description: '基于 IQR 方法检测到 12 个异常值，建议进一步审查或处理',
            sql: 'SELECT * FROM sales_data WHERE amount > (Q3 + 1.5 * IQR) OR amount < (Q1 - 1.5 * IQR)',
            affectedRows: 12,
            isPinned: false,
            tags: ['统计分析', '异常检测'],
            metadata: { method: 'IQR', threshold: 1.5 },
        },
        {
            id: 'mock-004',
            timestamp: Date.now() - 1000 * 60 * 45, // 45分钟前
            type: 'insight',
            title: '关键发现：销售额季节性波动',
            description: '数据显示明显的季节性模式，Q4 销售额平均比其他季度高 35%',
            isPinned: false,
            tags: ['业务洞察', '趋势分析'],
            metadata: {
                seasonality: 'quarterly',
                peak_quarter: 'Q4',
                increase_percentage: 35,
            },
        },
        {
            id: 'mock-005',
            timestamp: Date.now() - 1000 * 60 * 60, // 1小时前
            type: 'visualization',
            title: '建议生成销售趋势图',
            description: '数据适合使用时间序列折线图展示，可清晰看到增长趋势和季节性',
            isPinned: false,
            tags: ['可视化建议'],
            metadata: {
                chartType: 'line',
                xAxis: 'date',
                yAxis: 'amount',
            },
        },
    ];

    const [records, setRecords] = useState<EvidenceRecord[]>(initialMockRecords);

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
