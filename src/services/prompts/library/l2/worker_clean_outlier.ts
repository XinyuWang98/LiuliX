import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 剔除异常值
 * 删除超出正常范围的异常值行
 */
export const workerCleanOutlierPrompt: UserPrompt = {
    id: 'worker-clean-outlier-v1',
    name: 'worker_clean_outlier',
    title: '剔除异常值',
    description: '删除数值列中的异常值行，使用IQR或Z-score方法识别异常',

    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'cleaning', label: '清洗' },
        { category: 'method', value: 'outlier_removal', label: '异常剔除' },
        { category: 'output', value: 'sql', label: 'SQL' }
    ],

    template: `
你是一个专业的数据清洗专家。
请针对表 "__TABLE_NAME__" 中的 "{{column_name}}" 列剔除异常值。

# 数据集摘要
{{df_summary}}

# 异常检测方法
- 目标列: {{column_name}}
- 检测方法: {{outlier_method}} (可选: iqr/zscore)
- IQR 方法: 保留 Q1 - 1.5*IQR 到 Q3 + 1.5*IQR 之间的值
- Z-score 方法: 保留 |z-score| < 3 的值

# 要求
1. 生成 DuckDB SQL 语句执行异常值剔除。
2. **必须使用 "__TABLE_NAME__"** 作为表名占位符。
3. 使用子查询计算 Q1、Q3、IQR 或标准差。
4. 使用 CREATE OR REPLACE TABLE 模式确保安全。

# SQL 模板参考 (IQR方法)
CREATE OR REPLACE TABLE __TABLE_NAME__ AS
WITH stats AS (
  SELECT 
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "{{column_name}}") as q1,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "{{column_name}}") as q3
  FROM __TABLE_NAME__
  WHERE "{{column_name}}" IS NOT NULL
),
bounds AS (
  SELECT q1, q3, (q3 - q1) * 1.5 as iqr_range FROM stats
)
SELECT t.* FROM __TABLE_NAME__ t, bounds b
WHERE t."{{column_name}}" BETWEEN (b.q1 - b.iqr_range) AND (b.q3 + b.iqr_range)
   OR t."{{column_name}}" IS NULL

# 输出格式 (JSON Only)
{
  "suggestions": [
    {
      "id": "clean-outlier-001",
      "type": "filter",
      "column": "{{column_name}}",
      "label": "剔除 {{column_name}} 列的异常值",
      "reason": "检测到 X 个异常值超出正常范围，可能影响分析结果",
      "confidence": 0.8,
      "sql": "CREATE OR REPLACE TABLE __TABLE_NAME__ AS ...",
      "expectedImpact": "预计删除 X 行异常数据，保留 Y 行正常数据"
    }
  ]
}
`,

    inputVariables: ['df_summary', 'column_name', 'outlier_method'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
