# 11-专题-洞察分析Prompt现状盘点

> **文档性质**: 技术资产盘点
> **生成时间**: 2025-12-26
> **关联代码**: `src/services/prompts/index.ts`, `src/services/prompts/library/**`

---

## 1. 资产总览

截至目前，Prompt 库共收录 **16 个** 标准化 Prompt，形成了 "1个大脑 + 15个手脚" 的完整协作体系。

| 层级 | 数量 | 角色 | 职责 |
| :--- | :--- | :--- | :--- |
| **L1 Decision** | **1** | **Router (大脑)** | 分析数据摘要，生成下一步分析建议 (Action Plan) |
| **L2 Execution** | **15** | **Worker (手脚)** | 接收具体指令，生成可执行代码 (Python/SQL) |
| **总计** | **16** | | 覆盖 EDA 探索、统计分析、数据清洗三大领域 |

---

## 2. 详细清单

### 2.1 L1 决策层
| ID | 核心功能 | 输入参数 | 典型场景 |
| :--- | :--- | :--- | :--- |
| `explorer-general-v1` | 全局探索路由 | `df_summary` | 用户刚上传文件，不知从何下手时 |

### 2.2 L2 分析类 (Analysis Workers)
核心 EDA 能力，采用 **Python (Pandas/Matplotlib)** 实现。

| ID | 功能 | 核心算法/图表 | 输入变量 |
| :--- | :--- | :--- | :--- |
| `worker-distribution` | **单变量分布** | Histogram, KDE, Bar Chart | `column_name` |
| `worker-correlation` | **双变量关系** | Scatter, Boxplot, Heatmap | `col_x`, `col_y` |
| `worker-stats` | **基础统计** | Mean, Median, Std, Skew | `column_name` |
| `worker-topn` | **Top N 榜单** | `value_counts().head(n)` | `column_name`, `n` |
| `worker-missing` | **缺失模式** | Nullity Matrix, Heatmap | - |
| `worker-outlier` | **异常检测** | IQR, Z-Score | `column_name` |
| `worker-crosstab` | **交叉表** | Pivot Table, Stacked Bar | `col_row`, `col_col` |
| `worker-groupby` | **分组聚合** | GroupBy + Agg (Sum/Mean) | `col_group`, `col_val` |
| `worker-trend` | **趋势分析** | Line Chart, Rolling Mean | `col_date`, `col_val` |

### 2.3 L2 清洗类 (Cleaning Workers)
数据治理能力，目标是生成 **SQL** 指令 (未来架构)。

| ID | 功能 | 作用 |
| :--- | :--- | :--- |
| `worker-clean-dedup` | **去重** | 删除完全重复行或特定列重复 |
| `worker-clean-fillna` | **缺失填补** | 填充 0, 均值, 中位数, 固定值 |
| `worker-clean-dropna` | **缺失删除** | 删除含空值的行/列 |
| `worker-clean-outlier` | **异常处理** | 盖帽法 (Capping) 或 删除 |
| `worker-clean-normalize` | **标准化** | 文本转小写, 去空格, 格式统一 |
| `worker-clean-typecast` | **类型转换** | String -> Number/Date |

---

## 3. 技术实现模式：Hybrid Mode (双模引擎)

通过审计 `worker_distribution.ts` 和 `worker_correlation.ts`，我们发现了 DataPrism 独特的 **"Prompt + Code Template"** 双模设计：

### 3.1 模式定义
每个 L2 Prompt 不仅仅是一段文本 Prompt，它同时包含一段 **经过验证的 Python 代码模板**。

```typescript
// src/services/prompts/library/l2/worker_distribution.ts
export const workerDistributionPrompt = {
    executionMode: 'TEMPLATE_FILL', // 优先使用模板
    
    // 1. 确定性代码模板 (高性能、零幻觉)
    codeTemplate: `import matplotlib... df['{{column_name}}'].hist()...`,
    
    // 2. 生成式 Prompt (高灵活性、兜底)
    template: `请分析 {{column_name}} 的分布...`
};
```

### 3.2 运行机制
1.  **优先 (Fast Path)**: 系统首先尝试填充 `codeTemplate`。如果参数满足（如只传了 `column_name`），直接替换字符串得到 Python 代码。**耗时 < 1ms**。
2.  **降级 (Slow Path)**: 如果用户提出了模板无法覆盖的复杂要求（如 "画分布图但排除掉前 5% 的数据"），系统回退到调用 LLM 生成代码。**耗时 ~3s**。

这种设计完美平衡了 **性能** 与 **智能**。

---

## 4. 差距与规划 (Gap Analysis)

### 4.1 覆盖度评估
*   **广度 (Breadth): 🟢 优秀**。涵盖了 EDA 的 80% 常用场景。
*   **深度 (Depth): 🟡 一般**。目前仅限于描述性统计 (Descriptive)，缺乏：
    *   **诊断性分析**: "为什么销量下降？" (Root Cause Analysis)
    *   **预测性分析**: "下个月销量多少？" (Forecasting)
    *   **规范性分析**: "如何提升销量？" (Optimization)

### 4.2 下一步重点
1.  **清洗类落地**: 虽然有了 6 个清洗 Prompt 定义，但目前尚未在业务代码 (`aiCleaningService`) 中真正调用它们。需按 `10-专题-数据清洗Prompt战略与MVP验证.md` 推进落地。
2.  **高级分析扩展**: 引入 `worker-causal-inference` (因果推断) 和 `worker-forecast` (时序预测) 等高级 L2。
