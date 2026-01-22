import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 删除空值行
 * 删除包含空值的行
 */
export const workerCleanDropnaPrompt: UserPrompt = {
  id: 'worker-clean-dropna-v1',
  name: 'worker_clean_dropna',
  title: '删除空值行',
  description: '删除数据集中包含空值的行，可指定列或全表扫描',



  // 能力包配置 (v2.1)
  slug: 'worker-clean-dropna-v1',
  packageId: 'basic',
  requiredPackages: [],
  outputCharts: ['chart'],
  layer: 'L2_EXECUTION',

  // ⚠️ 已废弃 (v2.3)
  deprecated: true,
  deprecatedReason: 'Use cleaner-delete-null-rows-v1 instead (SQL-based, faster and more reliable)',

  dimensions: [
    { category: 'industry', value: 'general', label: '通用' },
    { category: 'intent', value: 'cleaning', label: '清洗' },
    { category: 'method', value: 'filtering', label: '过滤' },
    { category: 'output', value: 'sql', label: 'SQL' }
  ],

  template: `
你是一个专业的数据清洗专家。
请针对表 "__TABLE_NAME__" 删除包含空值的行。

# 数据集摘要
{{df_summary}}

# 删除策略
- 目标列: {{column_name}} (如果为空，则检查所有列)
- 模式: {{drop_mode}} (可选: any/all)
  - any: 任意指定列为空则删除
  - all: 所有指定列都为空才删除

# 要求
1. 生成 DuckDB SQL 语句执行删除。
2. **必须使用 "__TABLE_NAME__"** 作为表名占位符。
3. 使用 WHERE ... IS NOT NULL 过滤空值行。
4. 使用 CREATE OR REPLACE TABLE 模式确保安全。

# SQL 模板参考
- 删除单列空值行: CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE "{{column_name}}" IS NOT NULL
- 删除多列任意空值行: CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE "col1" IS NOT NULL AND "col2" IS NOT NULL

# 输出格式 (JSON Only)
{
  "suggestions": [
    {
      "id": "clean-dropna-001",
      "type": "filter",
      "column": "{{column_name}}",
      "label": "删除 {{column_name}} 列的空值行",
      "reason": "该列有 X 行空值，影响数据分析质量",
      "confidence": 0.85,
      "sql": "CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM __TABLE_NAME__ WHERE \"{{column_name}}\" IS NOT NULL",
      "expectedImpact": "预计删除 X 行空值数据"
    }
  ]
}
`,

  inputVariables: ['df_summary', 'column_name', 'drop_mode'],
  author: 'System',
  version: '1.0.0',
  isBuiltIn: true,
  updatedAt: Date.now()
};
