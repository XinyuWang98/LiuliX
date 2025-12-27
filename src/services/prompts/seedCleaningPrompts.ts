/**
 * 清洗Prompt种子数据
 * 定义核心数据清洗模板（L2层）
 */

import { UserPrompt } from '@/types/prompt';

/**
 * 清洗Prompt种子库
 * 
 * 设计原则：
 * 1. 每个模板对应一个明确的清洗场景
 * 2. SQL模板使用 __TABLE_NAME__ 占位符（运行时替换）
 * 3. inputVariables 定义需要AI填充的参数
 * 4. dimensions 用于分类和过滤
 */
export const SEED_CLEANING_PROMPTS: UserPrompt[] = [
    // ==================== P0: 核心模板 ====================

    {
        id: 'cleaner-remove-duplicates-v1',
        name: 'cleaner_remove_duplicates',
        title: '删除重复行',
        description: '删除表中的完全重复记录，保留唯一值',
        layer: 'L2_EXECUTION',
        template: '', // 清洗模板不需要Prompt（由Router调用）
        sqlTemplate: 'CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT DISTINCT * FROM __TABLE_NAME__',
        inputVariables: [], // 无需参数
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'dedup', label: '去重' },
            { category: 'method', value: 'sql', label: 'SQL' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    {
        id: 'cleaner-fill-null-median-v1',
        name: 'cleaner_fill_null_median',
        title: '缺失值填充（中位数）',
        description: '使用中位数填充数值列的缺失值',
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = {median_value} WHERE "{column_name}" IS NULL',
        inputVariables: ['column_name', 'median_value'], // AI需填充这些参数
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'fill_missing', label: '填充缺失值' },
            { category: 'method', value: 'median', label: '中位数' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    {
        id: 'cleaner-fill-null-unknown-v1',
        name: 'cleaner_fill_null_unknown',
        title: '缺失值填充（Unknown）',
        description: '使用"Unknown"标记文本列的缺失值',
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = \'Unknown\' WHERE "{column_name}" IS NULL',
        inputVariables: ['column_name'],
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'fill_missing', label: '填充缺失值' },
            { category: 'output', value: 'text', label: '文本' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    // ==================== P1: 常用模板 ====================

    {
        id: 'cleaner-standardize-date-v1',
        name: 'cleaner_standardize_date',
        title: '日期格式标准化',
        description: '将日期列统一为 YYYY-MM-DD 格式',
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = strptime("{column_name}", \'%Y-%m-%d\') WHERE regexp_matches("{column_name}", \'^\\\\d{4}-\\\\d{2}-\\\\d{2}$\')',
        inputVariables: ['column_name'],
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'standardize', label: '格式标准化' },
            { category: 'output', value: 'date', label: '日期' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    {
        id: 'cleaner-standardize-email-v1',
        name: 'cleaner_standardize_email',
        title: '邮箱格式标准化',
        description: '将邮箱转为小写并去除前后空格',
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = lower(trim("{column_name}"))',
        inputVariables: ['column_name'],
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'standardize', label: '格式标准化' },
            { category: 'output', value: 'text', label: '文本' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    }
];

/**
 * 注册清洗Prompt到全局注册表
 * 
 * 在应用启动时调用此函数
 */
export function registerCleaningPrompts(registry: any): void {
    registry.registerBatch(SEED_CLEANING_PROMPTS);
}
