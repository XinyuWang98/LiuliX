# 70-技术专题-L2Prompt批量生成器

> **用途**: 本文档包含一个 Meta-Prompt（元提示词），用于让 AI 批量生成符合规范的 L2 层级分析 Prompt。
> **使用方式**: 将 §2 的完整内容复制后发送给 Claude/GPT-4，获取生成的 TypeScript 代码。
> **创建日期**: 2025-12-25

---

## 1. 背景

LiuliX 的 Prompt Library 采用双层架构：
- **L1 (Router)**: 决策层，负责推荐分析方法
- **L2 (Worker)**: 执行层，负责生成可执行代码

MVP 阶段需要快速扩充 L2 Prompt 库（目标 ≥10 个），以启用"选择题式"L1 推荐策略。

本文档提供一个标准化的 Meta-Prompt，用于批量生成高质量的 L2 Prompt。

---

## 2. Meta-Prompt（完整版，可直接复制使用）

```markdown
# 任务
你是一个 Prompt 工程师。请根据以下【模板规范】和【已有示例】，批量生成 7 个 L2 层级的数据分析 Prompt。

---

## 【模板规范】

每个 Prompt 必须输出为 TypeScript 代码，遵循以下结构：

```typescript
import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: [中文标题]
 * [一句话功能描述]
 */
export const worker[Name]Prompt: UserPrompt = {
  id: 'worker-[name]-v1',           // 格式: worker-{功能}-v1
  name: 'worker_[name]',            // 格式: worker_{功能}
  title: '[中文标题]',               // 2-6字
  description: '[分析目标] + [适用数据类型] + [输出结果]',  // 一句话，包含 L1 匹配关键词

  layer: 'L2_EXECUTION',            // 固定

  dimensions: [
    { category: 'industry', value: 'general', label: '通用' },  // 固定
    { category: 'intent', value: '[exploration/causal/cleaning]', label: '[中文]' },
    { category: 'method', value: '[方法标签]', label: '[中文]' },
    { category: 'output', value: 'chart', label: '图表' }  // 大多数是图表
  ],

  template: `[System Prompt 内容，参考示例]`,

  inputVariables: ['df_summary', ...],  // 必含 df_summary，加上分析所需参数

  author: 'System',
  version: '1.0.0',
  isBuiltIn: true,
  updatedAt: Date.now()
};
```

### 字段规范

| 字段 | 规范 |
|------|------|
| `id` | 格式 `worker-{功能名}-v1`，全小写，用连字符 |
| `name` | 格式 `worker_{功能名}`，全小写，用下划线 |
| `title` | 2-6个中文字，简洁明了 |
| `description` | 一句话，必须包含 L1 可识别的关键词（如：分布、相关、异常、趋势、分组） |
| `dimensions.intent` | 三选一：`exploration`(探索) / `causal`(归因) / `cleaning`(清洗) |
| `dimensions.method` | 根据功能选择：`statistics`, `timeseries`, `outlier`, `aggregation` 等 |
| `inputVariables` | 必须包含 `df_summary`，加上分析所需的列名参数 |
| `template` | 详细的 System Prompt，参考示例风格，必须包含输出 JSON 格式要求 |

---

## 【已有示例】

### 示例 1: 单变量分布分析 (worker_distribution.ts)

```typescript
import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 单变量分布分析
 * 用于绘制数值列直方图或分类列柱状图
 */
export const workerDistributionPrompt: UserPrompt = {
  id: 'worker-distribution-v1',
  name: 'worker_distribution',
  title: '单变量分布分析',
  description: '查看单一变量的数据分布情况（偏态、峰度、异常值）',
  layer: 'L2_EXECUTION',
  dimensions: [
    { category: 'industry', value: 'general', label: '通用' },
    { category: 'intent', value: 'exploration', label: '探索' },
    { category: 'method', value: 'statistics', label: '统计分布' },
    { category: 'output', value: 'chart', label: '图表' }
  ],
  template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 中的列 \`{{column_name}}\` 进行分布分析。

# 数据集摘要
{{df_summary}}

# 要求
1. 检查列的数据类型。
2. 如果是数值型 (Numeric)：
   - 绘制直方图 (Histogram) + 核密度估计 (KDE)。
   - 计算偏度 (Skewness) 和峰度 (Kurtosis)。
   - 标题: "{{column_name}} 分布分析"。
3. 如果是分类型 (Categorical/String)：
   - 绘制柱状图 (Bar Chart)，显示 Top 10 类别。
   - 标题: "{{column_name}} 类别分布 (Top 10)"。
4. 使用 matplotlib/seaborn 绘图。
5. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
6. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "对该列分布的分析结论（一句话）",
  "columnsUsed": ["{{column_name}}"]
}
`,
  inputVariables: ['df_summary', 'column_name'],
  author: 'System',
  version: '1.0.0',
  isBuiltIn: true,
  updatedAt: Date.now()
};
```

### 示例 2: 双变量相关性分析 (worker_correlation.ts)

```typescript
import { UserPrompt } from '../../../../types/prompt';

/**
 * L2 Prompt: 双变量相关性分析
 * 用于绘制散点图 (数值 vs 数值) 或 箱线图 (分类 vs 数值)
 */
export const workerCorrelationPrompt: UserPrompt = {
  id: 'worker-correlation-v1',
  name: 'worker_correlation',
  title: '双变量相关性分析',
  description: '分析两个变量之间的关系（线性相关、聚类模式、分布差异）',
  layer: 'L2_EXECUTION',
  dimensions: [
    { category: 'industry', value: 'general', label: '通用' },
    { category: 'intent', value: 'causal', label: '归因/关系' },
    { category: 'method', value: 'statistics', label: '相关性' },
    { category: 'output', value: 'chart', label: '图表' }
  ],
  template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\` 中的列 \`{{col_x}}\` 和 \`{{col_y}}\` 进行关系分析。

# 数据集摘要
{{df_summary}}

# 要求
1. 检查两列的数据类型。
2. 场景 A: 数值 vs 数值 (Numeric vs Numeric):
   - 绘制散点图 (Scatter Plot)，带回归线 (Regression Line)。
   - 计算 Pearson 和 Spearman 相关系数。
   - 标题: "{{col_x}} vs {{col_y}} 相关性分析"。
3. 场景 B: 分类 vs 数值 (Categorical vs Numeric):
   - 绘制箱线图 (Box Plot) 或 小提琴图 (Violin Plot)。
   - 标题: "不同 {{col_x}} 下的 {{col_y}} 分布"。
4. 场景 C: 分类 vs 分类 (Categorical vs Categorical):
   - 绘制热力图 (Heatmap) 展示交叉表 (Crosstab)。
   - 标题: "{{col_x}} 与 {{col_y}} 的共现分布"。
5. 使用 matplotlib/seaborn 绘图。
6. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
7. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "对两列关系的分析结论（一句话）",
  "columnsUsed": ["{{col_x}}", "{{col_y}}"]
}
`,
  inputVariables: ['df_summary', 'col_x', 'col_y'],
  author: 'System',
  version: '1.0.0',
  isBuiltIn: true,
  updatedAt: Date.now()
};
```

---

## 【待生成清单】

请生成以下 7 个 L2 Prompt，每个输出完整的 TypeScript 代码文件内容：

| 序号 | id | title | 功能描述 | inputVariables |
|------|-----|-------|----------|----------------|
| 1 | worker-outlier-v1 | 异常值检测 | 检测数值列的异常值/离群点（IQR 或 Z-score 方法），绘制箱线图标注异常点 | df_summary, column_name |
| 2 | worker-groupby-v1 | 分组聚合分析 | 按分类列分组，对数值列进行聚合（求和/均值/计数），绘制分组柱状图比较组间差异 | df_summary, group_col, value_col, agg_func |
| 3 | worker-trend-v1 | 时序趋势分析 | 分析数值随时间的变化趋势，绘制折线图，识别周期性和突变点 | df_summary, date_col, value_col |
| 4 | worker-topn-v1 | Top N 排名 | 找出某列数值最大或最小的前 N 条记录，绘制水平柱状图 | df_summary, column_name, n, ascending |
| 5 | worker-missing-v1 | 缺失值分析 | 扫描全表，统计各列缺失数量和比例，绘制缺失值热力图/柱状图 | df_summary |
| 6 | worker-stats-v1 | 描述性统计 | 计算数值列的均值、中位数、标准差、最大最小值、四分位数，输出统计表格 | df_summary, column_name |
| 7 | worker-crosstab-v1 | 交叉表分析 | 两个分类列的共现频次分析，绘制热力图展示交叉表 | df_summary, row_col, col_col |

---

## 【输出要求】

1. 每个 Prompt 输出为独立的 TypeScript 代码块，包含完整的 import 语句和 export。
2. 每个文件开头要有 JSDoc 注释说明功能。
3. template 内容要详细、可执行，参考示例的风格和结构。
4. description 必须包含能被 L1 识别的关键词（如：异常、分组、趋势、排名、缺失、统计、交叉）。
5. dimensions 中 intent 和 method 根据功能合理选择。
6. 建议的文件命名：`worker_[name].ts`（如 `worker_outlier.ts`）。
7. 代码风格与示例保持一致（缩进、注释、换行）。
```

---

## 3. 使用说明

### 3.1 生成步骤

1. 复制 §2 中的完整 Meta-Prompt
2. 发送给 Claude/GPT-4（推荐使用 Claude 3.5 Sonnet 或 GPT-4）
3. AI 将输出 7 个完整的 TypeScript 文件内容
4. 将代码保存到对应文件：
   ```
   src/services/prompts/library/l2/
   ├── worker_outlier.ts
   ├── worker_groupby.ts
   ├── worker_trend.ts
   ├── worker_topn.ts
   ├── worker_missing.ts
   ├── worker_stats.ts
   └── worker_crosstab.ts
   ```

### 3.2 注册步骤

1. 在 `src/services/prompts/library/l2/index.ts` 中导出所有新 Prompt：
   ```typescript
   export { workerOutlierPrompt } from './worker_outlier';
   export { workerGroupbyPrompt } from './worker_groupby';
   // ... 其他
   ```

2. 在 `src/services/prompts/index.ts` 的 `seedPrompts` 数组中添加新 Prompt：
   ```typescript
   import { workerOutlierPrompt, workerGroupbyPrompt, ... } from './library/l2';
   
   export const seedPrompts = [
     explorerGeneralPrompt,
     workerDistributionPrompt,
     workerCorrelationPrompt,
     workerOutlierPrompt,      // 新增
     workerGroupbyPrompt,      // 新增
     // ...
   ];
   ```

3. 启动应用后，新 Prompt 将自动注入到 PromptRegistry。

### 3.3 更新 L1 Router

当 L2 Prompt 数量达到 10 个后，需要更新 `explorer_general.ts` 中的：
- `relatedWorkerIds` 数组：添加新的 L2 Prompt ID
- `template` 中的可用工具表格：添加新 Prompt 的描述

---

## 4. 扩展指南

### 4.1 新增行业专属 Prompt

如需添加特定行业的分析 Prompt（如电商 RFM 分析），修改 Meta-Prompt 中的：
- `dimensions.industry` 改为对应行业标签（如 `ecommerce`）
- `description` 中加入行业关键词

### 4.2 自定义待生成清单

修改 【待生成清单】 表格，添加你需要的分析方法。

---

*本文档用于标准化 L2 Prompt 的批量生成流程，确保输出质量一致。*
