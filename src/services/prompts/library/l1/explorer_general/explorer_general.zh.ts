import { UserPrompt } from '@/types/prompt';

/**
 * L1 Prompt: 全局探索者 (Router)
 * 作用：分析数据集特征，推荐适合的 L2 Prompt 进行下钻
 * 支持历史链输入，实现上下文感知推荐
 */
export const explorerGeneralPrompt: UserPrompt = {
  id: 'explorer-general-v1',
  name: 'explorer_general',
  title: '全局数据探索专家',
  description: '分析数据集概况，推荐最值得关注的分析方向，并预测用户可能的下钻路径',

  // 能力包配置 (v2.1)
  slug: 'explorer-general-v1',
  packageId: 'basic',  // L1也需要基础包
  requiredPackages: ['pandas'],  // L1主要做推荐，依赖较少
  outputCharts: ['report'],  // L1输出推荐报告

  layer: 'L1_DECISION',

  // 四维矩阵标签
  dimensions: [
    { category: 'industry', value: 'general', label: '通用' },
    { category: 'intent', value: 'exploration', label: '全局探索' },
    { category: 'method', value: 'auto', label: '自动推荐' },
    { category: 'output', value: 'report', label: '推荐列表' }
  ],

  // L1 特有的关联：它知道有哪些 L2 可以调用
  relatedWorkerIds: ['worker-distribution-v1', 'worker-correlation-v1'],

  template: `
你是一个经验丰富的数据科学家助手。
你的任务是根据数据集的摘要和历史分析记录，推荐 3 个"最值得进行"的后续分析动作。

# 可用的分析工具 (Prompts)
| promptId | 名称 | 适用场景 | 必需参数 |
|----------|------|----------|----------|
| worker-distribution-v1 | 单变量分布 | 数值分布形态、偏态、分类占比 | column_name |
| worker-correlation-v1 | 双变量关系 | 线性/非线性关系、组间差异 | col_x, col_y |

# 数据集摘要
{{df_summary}}

# 历史分析记录 (如果有)
{{history}}

# 思考步骤
1. 如果有历史记录，分析用户之前做了什么，推荐"延续性"的下钻。
2. 找出方差较大、或具有明显业务含义的关键列（推荐 Distribution）。
3. 找出可能存在因果或相关性的两列组合（推荐 Correlation）。
4. 对于每个推荐，预测用户可能的下一步下钻动作 (drillHint)。

# 输出要求
请返回一个 JSON 对象，包含 recommendations 数组。
每个推荐项必须包含：
- promptId: 对应的 L2 Prompt ID (从上表选择)
- params: 参数对象 (如 {"column_name": "xxx"} 或 {"col_x": "xxx", "col_y": "xxx"})
- reason: 推荐理由 (一句话，用中文)
- drillHint: 预测的下钻建议 (可选，如果能预测的话)
  - promptId: 下钻的 Prompt ID
  - params: 下钻参数
  - label: 下钻按钮文案

# 输出格式 (JSON Only)
{
  "recommendations": [
    {
      "promptId": "worker-distribution-v1",
      "params": { "column_name": "Price" },
      "reason": "Price 列方差较大，建议查看其分布形态以识别价格区间。",
      "drillHint": {
        "promptId": "worker-correlation-v1",
        "params": { "col_x": "Price", "col_y": "Area" },
        "label": "分析价格与面积的关系"
      }
    }
  ]
}
`,

  inputVariables: ['df_summary', 'history'],
  author: 'System',
  version: '2.0.0',
  isBuiltIn: true,
  updatedAt: Date.now()
};

