/**
 * 证据池类型定义
 * 用于记录数据清洗、分析操作的历史记录，支持报告生成时的证据引用
 */

// 证据类型枚举
export type EvidenceType = 'cleaning' | 'analysis' | 'insight' | 'visualization' | 'insightChain';

// 证据记录接口
export interface EvidenceRecord {
    id: string; // 唯一标识符
    timestamp: number; // 操作时间戳
    type: EvidenceType; // 证据类型
    title: string; // 证据标题（i18n key 或直接文本）
    description: string; // 详细描述
    sql?: string; // 对应的 DuckDB SQL 语句（如果有）
    affectedRows?: number; // 影响的行数（清洗操作）
    beforeCount?: number; // 操作前行数
    afterCount?: number; // 操作后行数
    metadata?: Record<string, any>; // 额外的元数据（如图表配置、参数等）
    chartBase64?: string; // 图表的Base64快照（用于报告生成）
    isPinned: boolean; // 是否置顶
    tags?: string[]; // 标签（用于分类和筛选）
    reportSection?: 'cleaning' | 'insight' | 'summary'; // 报告分组（后续升级为交互 HTML 报告时使用）
}

// 证据池存储接口
export interface EvidenceStore {
    records: EvidenceRecord[];
    addRecord: (record: Omit<EvidenceRecord, 'id' | 'timestamp' | 'isPinned'>) => void;
    removeRecord: (id: string) => void;
    togglePin: (id: string) => void;
    clearAll: () => void;
    getRecordsByType: (type: EvidenceType) => EvidenceRecord[];
}
