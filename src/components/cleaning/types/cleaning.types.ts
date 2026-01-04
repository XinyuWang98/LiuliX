// 数据清洗模块的类型定义和常量配置

import { Project, ProjectFile } from '../../../utils/projectUtils';
import { CleaningSuggestion } from '../../../services/aiService';

// 重新导出类型，方便其他模块引用
export type { Project, ProjectFile, CleaningSuggestion };

// ==================== 接口定义 ====================

/**
 * DataCleaner组件的Props接口
 */
export interface DataCleanerProps {
    project: Project;
    cleaningTrigger?: number;
    onProjectUpdate?: (project: Project) => void;
    aiSuggestions?: any[]; // 新增这一行
}
/**
 * 历史记录项接口
 */
export interface HistoryItem {
    id: string;
    timestamp: number;
    action: string;
    rowCountBefore: number;
    rowCountAfter: number;
    // P2: 前端展示增强字段
    actionType?: string; // 用于匹配图标
    source?: 'ai' | 'rule'; // 用于显示来源标签
}

/**
 * 建议类型枚举
 */
export type SuggestionCategory =
    | 'deduplication'        // 重复值检测
    | 'drop_empty_column'   // 空列删除
    | 'fill_missing'        // 缺失值填充
    | 'type_conversion'     // 类型转换
    | 'normalize'           // 数据标准化（AI常用）
    | 'fill'                // 填充操作（AI常用）
    | 'experimental';       // 实验性建议

/**
 * AI建议接口
 */
export interface SimpleSuggestion {
    id: string;
    label: string;
    reason: string;
    confidence: number;
    isPromptLib?: boolean;
    column?: string;
    action: string;
    category: SuggestionCategory; // 建议类型分类
    expectedImpact?: string;
    dryRunStatus?: 'pending' | 'success' | 'failed';
    sql?: string; // AI生成的SQL语句
    source?: 'router' | 'ai'; // ✅ 新增：来源标识（router=Prompt模板, ai=AI生成）
}

/**
 * 类型元数据接口
 */
export interface CategoryMetadata {
    icon: string;
    color: string;
    nameKey: string;
}

// ==================== 常量定义 ====================

/**
 * 图标尺寸常量
 */
export const ICON_SIZE_MEDIUM = 14; // 中等图标尺寸
export const ICON_SIZE_LARGE = 16; // 大图标尺寸

/**
 * 每行最佳显示的建议卡片数量
 */
export const CARDS_PER_ROW = 5;

/**
 * 建议类型元数据配置
 * 包含图标、颜色、国际化key
 */
export const CATEGORY_META: Record<SuggestionCategory, CategoryMetadata> = {
    deduplication: {
        icon: '⊘',
        color: '#3b82f6',
        nameKey: 'cleaning.catDeduplication'
    },
    drop_empty_column: {
        icon: '×',
        color: '#ef4444',
        nameKey: 'cleaning.catDropEmpty'
    },
    fill_missing: {
        icon: '+',
        color: '#f59e0b',
        nameKey: 'cleaning.catFillMissing'
    },
    type_conversion: {
        icon: '⇄',
        color: '#8b5cf6',
        nameKey: 'cleaning.catTypeConversion'
    },
    normalize: {
        icon: '≡',
        color: '#10b981',
        nameKey: 'cleaning.catNormalize'
    },
    fill: {
        icon: '+',
        color: '#f59e0b',
        nameKey: 'cleaning.catFill'
    },
    experimental: {
        icon: '?',
        color: '#6b7280',
        nameKey: 'cleaning.catExperimental'
    }
};
