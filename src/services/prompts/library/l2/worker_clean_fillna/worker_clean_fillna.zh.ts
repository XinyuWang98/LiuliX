import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 缺失值填充
 * 用均值、众数或指定值填充缺失值
 */
export const workerCleanFillnaPrompt: UserPrompt = {
    id: 'worker-clean-fillna-v1',
    name: 'worker_clean_fillna',
    title: '缺失值填充',
    description: '填充数据集中的缺失值，支持均值、众数、中位数或指定值填充',

    

    // 能力包配置 (v2.1)
    slug: 'worker-clean-fillna-v1',
    packageId: 'basic',
    requiredPackages: [],
    outputCharts: ['chart'],
layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'cleaning', label: '清洗' },
        { category: 'method', value: 'imputation', label: '填充' },
        { category: 'output', value: 'sql', label: 'SQL' }
    ],

    template: `
你是一个专业的数据清洗专家。
请针对表 "__TABLE_NAME__" 中的 "{{column_name}}" 列进行缺失值填充。

# 数据集摘要
{{df_summary}}

# 填充策略
- 目标列: {{column_name}}
- 填充方式: {{fill_strategy}} (可选: mean/median/mode/value)
- 指定值: {{fill_value}} (仅当 fill_strategy 为 value 时使用)

# 要求
1. 生成 DuckDB SQL 语句执行填充。
2. **必须使用 "__TABLE_NAME__"** 作为表名占位符。
3. 根据列类型选择合适的填充策略：
   - 数值列: 均值(mean) 或 中位数(median)
   - 分类列: 众数(mode) 或 指定值
4. 使用 COALESCE 或 CASE WHEN 实现填充。

# SQL 模板参考
- 均值填充: UPDATE __TABLE_NAME__ SET "{{column_name}}" = (SELECT AVG("{{column_name}}") FROM __TABLE_NAME__) WHERE "{{column_name}}" IS NULL
- 指定值填充: UPDATE __TABLE_NAME__ SET "{{column_name}}" = '填充值' WHERE "{{column_name}}" IS NULL

# 输出格式 (JSON Only)
{
  "suggestions": [
    {
      "id": "clean-fillna-001",
      "type": "fill",
      "column": "{{column_name}}",
      "label": "填充 {{column_name}} 列缺失值",
      "reason": "该列有 X% 的缺失值，使用 {{fill_strategy}} 策略填充",
      "confidence": 0.85,
      "sql": "UPDATE __TABLE_NAME__ SET ...",
      "expectedImpact": "预计填充 X 个缺失值"
    }
  ]
}
`,

    inputVariables: ['df_summary', 'column_name', 'fill_strategy', 'fill_value'],
    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
