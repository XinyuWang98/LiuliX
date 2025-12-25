import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 类型转换
 * 将列从一种数据类型转换为另一种类型
 */
export const workerCleanTypecastPrompt: UserPrompt = {
    id: 'worker-clean-typecast-v1',
    name: 'worker_clean_typecast',
    title: '类型转换',
    description: '转换列的数据类型，如字符串转日期、字符串转数值、日期格式化',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'cleaning', label: '清洗' },
        { category: 'method', value: 'type_conversion', label: '类型转换' },
        { category: 'output', value: 'sql', label: 'SQL' }
    ],

    template: `
你是一个专业的数据清洗专家。
请针对表 "__TABLE_NAME__" 中的 "{{column_name}}" 列进行类型转换。

# 数据集摘要
{{df_summary}}

# 转换配置
- 目标列: {{column_name}}
- 当前类型: {{source_type}}
- 目标类型: {{target_type}} (可选: integer/double/date/timestamp/varchar)
- 日期格式: {{date_format}} (仅当涉及日期转换时使用，如: %Y-%m-%d)

# 要求
1. 生成 DuckDB SQL 语句执行类型转换。
2. **必须使用 "__TABLE_NAME__"** 作为表名占位符。
3. 使用 CAST 或 TRY_CAST 进行安全转换。
4. 对于日期转换，使用 STRPTIME 函数。
5. 处理转换失败的情况（设为 NULL 或保留原值）。

# SQL 模板参考
- 字符串转整数: 
  CREATE OR REPLACE TABLE __TABLE_NAME__ AS 
  SELECT *, TRY_CAST("{{column_name}}" AS INTEGER) as "{{column_name}}_new" 
  FROM __TABLE_NAME__

- 字符串转日期: 
  CREATE OR REPLACE TABLE __TABLE_NAME__ AS 
  SELECT *, STRPTIME("{{column_name}}", '{{date_format}}') as "{{column_name}}_date" 
  FROM __TABLE_NAME__

- 数值转字符串:
  UPDATE __TABLE_NAME__ SET "{{column_name}}" = CAST("{{column_name}}" AS VARCHAR)

# 输出格式 (JSON Only)
{
  "suggestions": [
    {
      "id": "clean-typecast-001",
      "type": "convert",
      "column": "{{column_name}}",
      "label": "将 {{column_name}} 转换为 {{target_type}}",
      "reason": "该列当前为 {{source_type}}，需转换为 {{target_type}} 以支持后续分析",
      "confidence": 0.85,
      "sql": "CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT *, TRY_CAST(\"{{column_name}}\" AS {{target_type}}) as \"{{column_name}}_converted\" FROM __TABLE_NAME__",
      "expectedImpact": "转换 X 行数据类型，可能有 Y 行转换失败设为 NULL"
    }
  ]
}
`,

    inputVariables: ['df_summary', 'column_name', 'source_type', 'target_type', 'date_format'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
