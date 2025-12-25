import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 文本标准化
 * 统一文本格式：去空格、统一大小写等
 */
export const workerCleanNormalizePrompt: UserPrompt = {
    id: 'worker-clean-normalize-v1',
    name: 'worker_clean_normalize',
    title: '文本标准化',
    description: '标准化文本列格式，包括去除首尾空格、统一大小写、替换特殊字符',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'cleaning', label: '清洗' },
        { category: 'method', value: 'normalization', label: '标准化' },
        { category: 'output', value: 'sql', label: 'SQL' }
    ],

    template: `
你是一个专业的数据清洗专家。
请针对表 "__TABLE_NAME__" 中的 "{{column_name}}" 列进行文本标准化。

# 数据集摘要
{{df_summary}}

# 标准化选项
- 目标列: {{column_name}}
- 操作: {{normalize_options}} (可多选，逗号分隔)
  - trim: 去除首尾空格
  - lower: 转为小写
  - upper: 转为大写
  - replace_newline: 替换换行符为空格
  - remove_special: 移除特殊字符

# 要求
1. 生成 DuckDB SQL 语句执行标准化。
2. **必须使用 "__TABLE_NAME__"** 作为表名占位符。
3. 使用 TRIM, LOWER, UPPER, REPLACE 等函数。
4. 可以嵌套多个函数实现组合操作。

# SQL 模板参考
- 去空格+转小写: UPDATE __TABLE_NAME__ SET "{{column_name}}" = LOWER(TRIM("{{column_name}}"))
- 替换换行符: UPDATE __TABLE_NAME__ SET "{{column_name}}" = REPLACE("{{column_name}}", CHR(10), ' ')

# 输出格式 (JSON Only)
{
  "suggestions": [
    {
      "id": "clean-normalize-001",
      "type": "normalize",
      "column": "{{column_name}}",
      "label": "标准化 {{column_name}} 列文本格式",
      "reason": "发现文本格式不一致（如大小写混用、多余空格），需要统一",
      "confidence": 0.9,
      "sql": "UPDATE __TABLE_NAME__ SET \"{{column_name}}\" = LOWER(TRIM(\"{{column_name}}\"))",
      "expectedImpact": "统一 X 行文本格式，提升数据一致性"
    }
  ]
}
`,

    inputVariables: ['df_summary', 'column_name', 'normalize_options'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
