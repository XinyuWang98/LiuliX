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

        // 能力包配置 (v2.1)
        slug: 'cleaner-remove-duplicates-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],

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

        // 能力包配置 (v2.1)
        slug: 'cleaner-fill-null-median-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
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

        // 能力包配置 (v2.1)
        slug: 'cleaner-fill-null-unknown-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
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

        // 能力包配置 (v2.1)
        slug: 'cleaner-standardize-date-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
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

        // 能力包配置 (v2.1)
        slug: 'cleaner-standardize-email-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
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
    },

    // ==================== P2: 新增10个核心模板 ====================

    {
        id: 'cleaner-filter-outliers-iqr-v1',
        name: 'cleaner_filter_outliers_iqr',
        title: '异常值过滤（IQR规则）',
        description: '使用四分位距(IQR)规则过滤数值列的异常值，删除超出Q1-1.5*IQR和Q3+1.5*IQR范围的记录',

        // 能力包配置 (v2.1)
        slug: 'cleaner-filter-outliers-iqr-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE "{column_name}" >= {q1_minus_iqr} AND "{column_name}" <= {q3_plus_iqr}',
        inputVariables: ['column_name', 'q1_minus_iqr', 'q3_plus_iqr'],
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'filter', label: '过滤' },
            { category: 'method', value: 'iqr', label: 'IQR规则' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    {
        id: 'cleaner-format-money-v1',
        name: 'cleaner_format_money',
        title: '金额格式化（2位小数）',
        description: '将金额/价格列统一保留2位小数',

        // 能力包配置 (v2.1)
        slug: 'cleaner-format-money-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = ROUND(CAST("{column_name}" AS DOUBLE), 2)',
        inputVariables: ['column_name'],
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'standardize', label: '格式标准化' },
            { category: 'output', value: 'numeric', label: '数值' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    {
        id: 'cleaner-drop-null-column-v1',
        name: 'cleaner_drop_null_column',
        title: '删除全空列',
        description: '删除数据全部为NULL的无效列',

        // 能力包配置 (v2.1)
        slug: 'cleaner-drop-null-column-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'ALTER TABLE __TABLE_NAME__ DROP COLUMN "{column_name}"',
        inputVariables: ['column_name'],
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'filter', label: '过滤' },
            { category: 'method', value: 'drop', label: '删除' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    {
        id: 'cleaner-cast-to-numeric-v1',
        name: 'cleaner_cast_to_numeric',
        title: '类型转换（转数值）',
        description: '将文本列转换为数值类型，无效值转为NULL',

        // 能力包配置 (v2.1)
        slug: 'cleaner-cast-to-numeric-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = TRY_CAST("{column_name}" AS DOUBLE)',
        inputVariables: ['column_name'],
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'convert', label: '类型转换' },
            { category: 'output', value: 'numeric', label: '数值' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    {
        id: 'cleaner-fill-null-mean-v1',
        name: 'cleaner_fill_null_mean',
        title: '缺失值填充（均值）',
        description: '使用平均值填充数值列的缺失值',

        // 能力包配置 (v2.1)
        slug: 'cleaner-fill-null-mean-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = {mean_value} WHERE "{column_name}" IS NULL',
        inputVariables: ['column_name', 'mean_value'],
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'fill_missing', label: '填充缺失值' },
            { category: 'method', value: 'mean', label: '均值' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    {
        id: 'cleaner-fill-null-mode-v1',
        name: 'cleaner_fill_null_mode',
        title: '缺失值填充（众数）',
        description: '使用最常见值（众数）填充分类列的缺失值',

        // 能力包配置 (v2.1)
        slug: 'cleaner-fill-null-mode-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = \'{mode_value}\' WHERE "{column_name}" IS NULL',
        inputVariables: ['column_name', 'mode_value'],
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'fill_missing', label: '填充缺失值' },
            { category: 'method', value: 'mode', label: '众数' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    {
        id: 'cleaner-standardize-phone-v1',
        name: 'cleaner_standardize_phone',
        title: '电话号码标准化',
        description: '去除电话号码中的非数字字符（空格、横线、括号等）',

        // 能力包配置 (v2.1)
        slug: 'cleaner-standardize-phone-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = regexp_replace("{column_name}", \'[^0-9]\', \'\', \'g\')',
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
    },

    {
        id: 'cleaner-trim-whitespace-v1',
        name: 'cleaner_trim_whitespace',
        title: '文本清洗（去除空白）',
        description: '去除文本列的前后空白字符和多余空格',

        // 能力包配置 (v2.1)
        slug: 'cleaner-trim-whitespace-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = regexp_replace(trim("{column_name}"), \'\\s+\', \' \', \'g\')',
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
    },

    {
        id: 'cleaner-delete-null-rows-v1',
        name: 'cleaner_delete_null_rows',
        title: '删除空白行',
        description: '删除指定列为NULL的记录',

        // 能力包配置 (v2.1)
        slug: 'cleaner-delete-null-rows-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE "{column_name}" IS NOT NULL',
        inputVariables: ['column_name'],
        executionMode: 'TEMPLATE_FILL',
        dimensions: [
            { category: 'intent', value: 'filter', label: '过滤' },
            { category: 'method', value: 'delete', label: '删除' }
        ],
        author: 'system',
        version: 'v1',
        isBuiltIn: true,
        updatedAt: Date.now()
    },

    {
        id: 'cleaner-standardize-case-v1',
        name: 'cleaner_standardize_case',
        title: '大小写标准化',
        description: '将文本列统一转为小写（或大写）',

        // 能力包配置 (v2.1)
        slug: 'cleaner-standardize-case-v1',
        packageId: 'basic',
        requiredPackages: [],
        outputCharts: [],
        layer: 'L2_EXECUTION',
        template: '',
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = {case_function}("{column_name}")',
        inputVariables: ['column_name', 'case_function'], // case_function: lower 或 upper
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
