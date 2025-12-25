import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 去除重复行
 * 按指定列或全行去重，删除重复记录
 */
export const workerCleanDedupPrompt: UserPrompt = {
    id: 'worker-clean-dedup-v1',
    name: 'worker_clean_dedup',
    title: '去除重复行',
    description: '删除数据集中的重复行，可按指定列或全行去重',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'cleaning', label: '清洗' },
        { category: 'method', value: 'deduplication', label: '去重' },
        { category: 'output', value: 'sql', label: 'SQL' }
    ],

    template: `
你是一个专业的数据清洗专家。
请针对表 "__TABLE_NAME__" 进行去重操作。

# 数据集摘要
{{df_summary}}

# 去重依据
- 去重列: {{dedup_columns}} (如果为空，则按全行去重)

# 要求
1. 生成 DuckDB SQL 语句执行去重。
2. **必须使用 "__TABLE_NAME__"** 作为表名占位符。
3. 使用 ROW_NUMBER() 窗口函数或 DISTINCT 实现去重。
4. 保留首次出现的记录（按原始顺序）。

# SQL 模板参考
- 全行去重: CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT DISTINCT * FROM __TABLE_NAME__
- 按列去重: CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY col1, col2 ORDER BY rowid) as rn FROM __TABLE_NAME__) WHERE rn = 1

# 输出格式 (JSON Only)
{
  "suggestions": [
    {
      "id": "clean-dedup-001",
      "type": "dedup",
      "column": "{{dedup_columns}}",
      "label": "去除重复行",
      "reason": "数据集中存在 X 条重复记录，需要清理",
      "confidence": 0.9,
      "sql": "CREATE OR REPLACE TABLE __TABLE_NAME__ AS SELECT DISTINCT * FROM __TABLE_NAME__",
      "expectedImpact": "预计删除 X 行重复数据，保留 Y 行"
    }
  ]
}
`,

    inputVariables: ['df_summary', 'dedup_columns'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
