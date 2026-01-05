const fs = require('fs');
const path = require('path');

// 1. Definition of the 15 Cleaning Prompts (Source: seedCleaningPrompts.ts)
const cleaningPrompts = [
    {
        id: 'cleaner-remove-duplicates-v1',
        name: 'cleaner_remove_duplicates',
        title: '删除重复行',
        description: '删除表中的完全重复记录，保留唯一值',
        enTitle: 'Remove Duplicates',
        enDescription: 'Remove duplicate rows, keeping unique values',
        outputCharts: [],
        sqlTemplate: 'CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT DISTINCT * FROM __TABLE_NAME__',
        inputVariables: [],
        dimensions: [
            { category: 'intent', value: 'dedup', label: '去重', enLabel: 'Deduplication' },
            { category: 'method', value: 'sql', label: 'SQL', enLabel: 'SQL' }
        ]
    },
    {
        id: 'cleaner-fill-null-median-v1',
        name: 'cleaner_fill_null_median',
        title: '缺失值填充（中位数）',
        description: '使用中位数填充数值列的缺失值',
        enTitle: 'Fill Missing (Median)',
        enDescription: 'Fill missing values in numeric columns with median',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = {median_value} WHERE "{column_name}" IS NULL',
        inputVariables: ['column_name', 'median_value'],
        dimensions: [
            { category: 'intent', value: 'fill_missing', label: '填充缺失值', enLabel: 'Fill Missing' },
            { category: 'method', value: 'median', label: '中位数', enLabel: 'Median' }
        ]
    },
    {
        id: 'cleaner-fill-null-unknown-v1',
        name: 'cleaner_fill_null_unknown',
        title: '缺失值填充（Unknown）',
        description: '使用"Unknown"标记文本列的缺失值',
        enTitle: 'Fill Missing (Unknown)',
        enDescription: 'Fill missing values in text columns with "Unknown"',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = \'Unknown\' WHERE "{column_name}" IS NULL',
        inputVariables: ['column_name'],
        dimensions: [
            { category: 'intent', value: 'fill_missing', label: '填充缺失值', enLabel: 'Fill Missing' },
            { category: 'output', value: 'text', label: '文本', enLabel: 'Text' }
        ]
    },
    {
        id: 'cleaner-standardize-date-v1',
        name: 'cleaner_standardize_date',
        title: '日期格式标准化',
        description: '将日期列统一为 YYYY-MM-DD 格式',
        enTitle: 'Standardize Date',
        enDescription: 'Standardize date columns to YYYY-MM-DD format',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = strptime("{column_name}", \'%Y-%m-%d\') WHERE regexp_matches("{column_name}", \'^\\\\d{4}-\\\\d{2}-\\\\d{2}$\')',
        inputVariables: ['column_name'],
        dimensions: [
            { category: 'intent', value: 'standardize', label: '格式标准化', enLabel: 'Standardize' },
            { category: 'output', value: 'date', label: '日期', enLabel: 'Date' }
        ]
    },
    {
        id: 'cleaner-standardize-email-v1',
        name: 'cleaner_standardize_email',
        title: '邮箱格式标准化',
        description: '将邮箱转为小写并去除前后空格',
        enTitle: 'Standardize Email',
        enDescription: 'Convert emails to lowercase and trim whitespace',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = lower(trim("{column_name}"))',
        inputVariables: ['column_name'],
        dimensions: [
            { category: 'intent', value: 'standardize', label: '格式标准化', enLabel: 'Standardize' },
            { category: 'output', value: 'text', label: '文本', enLabel: 'Text' }
        ]
    },
    {
        id: 'cleaner-filter-outliers-iqr-v1',
        name: 'cleaner_filter_outliers_iqr',
        title: '异常值过滤（IQR规则）',
        description: '使用四分位距(IQR)规则过滤数值列的异常值，删除超出Q1-1.5*IQR和Q3+1.5*IQR范围的记录',
        enTitle: 'Filter Outliers (IQR)',
        enDescription: 'Filter outliers using IQR rule (remove records outside Q1-1.5*IQR and Q3+1.5*IQR)',
        outputCharts: [],
        sqlTemplate: 'CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE "{column_name}" >= {q1_minus_iqr} AND "{column_name}" <= {q3_plus_iqr}',
        inputVariables: ['column_name', 'q1_minus_iqr', 'q3_plus_iqr'],
        dimensions: [
            { category: 'intent', value: 'filter', label: '过滤', enLabel: 'Filter' },
            { category: 'method', value: 'iqr', label: 'IQR规则', enLabel: 'IQR Rule' }
        ]
    },
    {
        id: 'cleaner-format-money-v1',
        name: 'cleaner_format_money',
        title: '金额格式化（2位小数）',
        description: '将金额/价格列统一保留2位小数',
        enTitle: 'Format Currency (2 decimals)',
        enDescription: 'Format currency/price columns to 2 decimal places',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = ROUND(CAST("{column_name}" AS DOUBLE), 2)',
        inputVariables: ['column_name'],
        dimensions: [
            { category: 'intent', value: 'standardize', label: '格式标准化', enLabel: 'Standardize' },
            { category: 'output', value: 'numeric', label: '数值', enLabel: 'Numeric' }
        ]
    },
    {
        id: 'cleaner-drop-null-column-v1',
        name: 'cleaner_drop_null_column',
        title: '删除全空列',
        description: '删除数据全部为NULL的无效列',
        enTitle: 'Drop Empty Columns',
        enDescription: 'Drop columns that are completely NULL',
        outputCharts: [],
        sqlTemplate: 'ALTER TABLE __TABLE_NAME__ DROP COLUMN "{column_name}"',
        inputVariables: ['column_name'],
        dimensions: [
            { category: 'intent', value: 'filter', label: '过滤', enLabel: 'Filter' },
            { category: 'method', value: 'drop', label: '删除', enLabel: 'Drop' }
        ]
    },
    {
        id: 'cleaner-cast-to-numeric-v1',
        name: 'cleaner_cast_to_numeric',
        title: '类型转换（转数值）',
        description: '将文本列转换为数值类型，无效值转为NULL',
        enTitle: 'Cast to Numeric',
        enDescription: 'Convert text columns to numeric, invalid values become NULL',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = TRY_CAST("{column_name}" AS DOUBLE)',
        inputVariables: ['column_name'],
        dimensions: [
            { category: 'intent', value: 'convert', label: '类型转换', enLabel: 'Convert' },
            { category: 'output', value: 'numeric', label: '数值', enLabel: 'Numeric' }
        ]
    },
    {
        id: 'cleaner-fill-null-mean-v1',
        name: 'cleaner_fill_null_mean',
        title: '缺失值填充（均值）',
        description: '使用平均值填充数值列的缺失值',
        enTitle: 'Fill Missing (Mean)',
        enDescription: 'Fill missing values in numeric columns with mean',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = {mean_value} WHERE "{column_name}" IS NULL',
        inputVariables: ['column_name', 'mean_value'],
        dimensions: [
            { category: 'intent', value: 'fill_missing', label: '填充缺失值', enLabel: 'Fill Missing' },
            { category: 'method', value: 'mean', label: '均值', enLabel: 'Mean' }
        ]
    },
    {
        id: 'cleaner-fill-null-mode-v1',
        name: 'cleaner_fill_null_mode',
        title: '缺失值填充（众数）',
        description: '使用最常见值（众数）填充分类列的缺失值',
        enTitle: 'Fill Missing (Mode)',
        enDescription: 'Fill missing values in categorical columns with mode',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = \'{mode_value}\' WHERE "{column_name}" IS NULL',
        inputVariables: ['column_name', 'mode_value'],
        dimensions: [
            { category: 'intent', value: 'fill_missing', label: '填充缺失值', enLabel: 'Fill Missing' },
            { category: 'method', value: 'mode', label: '众数', enLabel: 'Mode' }
        ]
    },
    {
        id: 'cleaner-standardize-phone-v1',
        name: 'cleaner_standardize_phone',
        title: '电话号码标准化',
        description: '去除电话号码中的非数字字符（空格、横线、括号等）',
        enTitle: 'Standardize Phone',
        enDescription: 'Remove non-numeric characters from phone numbers',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = regexp_replace("{column_name}", \'[^0-9]\', \'\', \'g\')',
        inputVariables: ['column_name'],
        dimensions: [
            { category: 'intent', value: 'standardize', label: '格式标准化', enLabel: 'Standardize' },
            { category: 'output', value: 'text', label: '文本', enLabel: 'Text' }
        ]
    },
    {
        id: 'cleaner-trim-whitespace-v1',
        name: 'cleaner_trim_whitespace',
        title: '文本清洗（去除空白）',
        description: '去除文本列的前后空白字符和多余空格',
        enTitle: 'Clean Text (Trim)',
        enDescription: 'Trim leading and trailing whitespace from text columns',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = regexp_replace(trim("{column_name}"), \'\\s+\', \' \', \'g\')',
        inputVariables: ['column_name'],
        dimensions: [
            { category: 'intent', value: 'standardize', label: '格式标准化', enLabel: 'Standardize' },
            { category: 'output', value: 'text', label: '文本', enLabel: 'Text' }
        ]
    },
    {
        id: 'cleaner-delete-null-rows-v1',
        name: 'cleaner_delete_null_rows',
        title: '删除空白行',
        description: '删除指定列为NULL的记录',
        enTitle: 'Delete Blank Rows',
        enDescription: 'Delete rows where specified column is NULL',
        outputCharts: [],
        sqlTemplate: 'CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE "{column_name}" IS NOT NULL',
        inputVariables: ['column_name'],
        dimensions: [
            { category: 'intent', value: 'filter', label: '过滤', enLabel: 'Filter' },
            { category: 'method', value: 'delete', label: '删除', enLabel: 'Delete' }
        ]
    },
    {
        id: 'cleaner-standardize-case-v1',
        name: 'cleaner_standardize_case',
        title: '大小写标准化',
        description: '将文本列统一转为小写（或大写）',
        enTitle: 'Standardize Case',
        enDescription: 'Convert text columns to lowercase (or uppercase)',
        outputCharts: [],
        sqlTemplate: 'UPDATE __TABLE_NAME__ SET "{column_name}" = {case_function}("{column_name}")',
        inputVariables: ['column_name', 'case_function'],
        dimensions: [
            { category: 'intent', value: 'standardize', label: '格式标准化', enLabel: 'Standardize' },
            { category: 'output', value: 'text', label: '文本', enLabel: 'Text' }
        ]
    }
];

// Helper to convert PascalCase to camelCase
const toCamelCase = (str) => {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Helper to convert snake_case to PascalCase
const toPascalCase = (str) => {
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

const BASE_DIR = path.resolve(__dirname, '../src/services/prompts/library/l2');

// Ensure base dir exists
if (!fs.existsSync(BASE_DIR)) {
    console.error('Base directory does not exist:', BASE_DIR);
    process.exit(1);
}

// Function to generate content for a single prompt
const generatePromptFiles = (prompt) => {
    const dirName = prompt.name;
    const dirPath = path.join(BASE_DIR, dirName);

    // Create directory
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const variableName = toCamelCase(prompt.name) + 'Prompt'; // e.g., cleanerRemoveDuplicatesPrompt
    const pascalName = toPascalCase(prompt.name) + 'Prompt'; // used for file import if needed, but variable name is safer

    // 1. Generate English Version (.en.ts)
    const enContent = `
import { UserPrompt } from '@/types/prompt';

export const ${variableName}: UserPrompt = {
    id: '${prompt.id}',
    name: '${prompt.name}',
    title: '${prompt.enTitle}',
    description: '${prompt.enDescription}',
    
    slug: '${prompt.id}', // Using ID as slug for now
    packageId: 'basic',
    requiredPackages: [], // Cleaners generally don't need python packages? Wait, they are SQL based.
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '', // No agent template for cleaners
    sqlTemplate: \`${prompt.sqlTemplate}\`,

    inputVariables: [${prompt.inputVariables.map(v => `'${v}'`).join(', ')}],
    
    dimensions: [
        ${prompt.dimensions.map(d => `{ category: '${d.category}', value: '${d.value}', label: '${d.enLabel}' }`).join(',\n        ')}
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};
`;

    fs.writeFileSync(path.join(dirPath, `${dirName}.en.ts`), enContent.trim());

    // 2. Generate Chinese Version (.zh.ts)
    const zhContent = `
import { UserPrompt } from '@/types/prompt';

export const ${variableName}: UserPrompt = {
    id: '${prompt.id}',
    name: '${prompt.name}',
    title: '${prompt.title}',
    description: '${prompt.description}',
    
    slug: '${prompt.id}',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: [],
    
    layer: 'L2_EXECUTION',
    executionMode: 'TEMPLATE_FILL',
    template: '',
    sqlTemplate: \`${prompt.sqlTemplate}\`,

    inputVariables: [${prompt.inputVariables.map(v => `'${v}'`).join(', ')}],
    
    dimensions: [
        ${prompt.dimensions.map(d => `{ category: '${d.category}', value: '${d.value}', label: '${d.label}' }`).join(',\n        ')}
    ],
    
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};
`;

    fs.writeFileSync(path.join(dirPath, `${dirName}.zh.ts`), zhContent.trim());

    // 3. Generate Index (Loader)
    const indexContent = `
import { UserPrompt } from '@/types/prompt';
import { getCurrentLanguage } from '@/i18n/I18nContext';
import { ${variableName} as enPrompt } from './${dirName}.en';
import { ${variableName} as zhPrompt } from './${dirName}.zh';

// 动态通过 Proxy 获取当前语言的 Prompt
export const ${variableName}: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const lang = getCurrentLanguage();
        // 默认使用中文，如果是 en-US 则使用英文
        // (策略可调整，这里为了兼容现有逻辑)
        const target = lang === 'en-US' ? enPrompt : zhPrompt;
        return target[prop as keyof UserPrompt];
    }
});
`;
    fs.writeFileSync(path.join(dirPath, 'index.ts'), indexContent.trim());

    console.log(`Generated: ${dirName}`);
};

// Run generation
cleaningPrompts.forEach(generatePromptFiles);

console.log('Done generating cleaning prompts files.');
