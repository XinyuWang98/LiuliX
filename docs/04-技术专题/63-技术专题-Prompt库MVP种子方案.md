# 63-技术专题-Prompt库MVP种子方案 (v1.0)

> **目标**: 用最小的成本验证 "L1 决策 -> L2 执行" 的双层架构。
> **策略**: 不求全，只求通。聚焦于最通用的 **EDA (探索性数据分析)** 场景。

## 1. 种子切片：通用 EDA (General EDA)

我们暂时忽略具体的行业（电商/金融），只做一套**“通用基础款”**。这是所有数据分析的起点，也是目前代码中 `insightGenerator` 试图解决的核心问题。

### 1.1 为什么选这三个？(基于分析频率的筛选)

您提到要从 **"常用分析方法 + 频率"** 入手，这完全正确。我们对常见 EDA 方法进行了频率与适用性评估，最终筛选出 **Top 2** 作为 MVP 种子：

| 分析方法 | 使用频率 | 必须要 AI 吗？ | 是否入选 MVP | 决策理由 |
| :--- | :--- | :--- | :--- | :--- |
| **单变量：分布分析 (Distribution)** | ⭐⭐⭐⭐⭐ | ✅ 是 (画图麻烦) | ✅ **入选** | **最基础的起手式**。了解数据长什么样是第一步。 |
| **双变量：相关性分析 (Correlation)** | ⭐⭐⭐⭐⭐ | ✅ 是 (代码复杂) | ✅ **入选** | **探索的核心**。发现 X 与 Y 的关系是洞察的关键。 |
| **数据概览 (Head/Describe)** | ⭐⭐⭐⭐⭐ | ❌ 否 (表格直出) | ❌ 不入选 | 现有 DataViewer 已经做得很好，无需 AI。 |
| **缺失值/异常值分析** | ⭐⭐⭐⭐ | ✅ 是 | ❌ 暂缓 | **清洗模块** 已部分覆盖（规则+AI），暂不重复建设。 |
| **时序/趋势分析** | ⭐⭐⭐⭐ | ✅ 是 | ❌ 暂缓 | 强依赖时间列，非通用场景 (Cross-sectional 数据较多)。 |
| **回归/聚类 (高级建模)** | ⭐⭐⭐ | ✅ 是 | ❌ 暂缓 | 属于 L3 深度分析，MVP 阶段先跑通基础链路。 |

基于此，我们确立 **L1 全局探索 + L2 分布 + L2 相关** 为最小闭环。

### 1.2 架构答疑：如何区分“清洗”与“分析”？

您在语音中提到的核心问题：**“都在一个 Prompt 库里，系统怎么知道这是在做清洗还是做分析？”**

这正是 **四维矩阵 (Matrix)** 发挥作用的地方。我们通过 `intent` (意图) 和 `output` (输出类型) 两个维度来严格区分：

| 维度 | 分析类 Prompt (Analysis) | 清洗类 Prompt (Cleaning) |
| :--- | :--- | :--- |
| **Intent 标签** | `intent: 'exploration'` / `intent: 'causal'` | `intent: 'cleaning'` |
| **Output 标签** | `output: 'chart'` / `output: 'report'` | `output: 'sql'` / `output: 'python_mutation'` |
| **L1 推荐逻辑** | 侦探发现**数据特征** (如偏态分布) -> 推荐画图 | 侦探发现**质量问题** (如 ID 重复) -> 推荐去重 |
| **执行后行为** | **追加 (Append)**: 在洞察流中增加一张卡片 | **刷新 (Refresh)**: 执行 SQL 更新表格，刷新数据视图 |

**本次 MVP 仅包含“分析类”，但架构上已经为“清洗类”预留了位置。**

### 1.3 核心答疑：AI 如何一次性返回多种建议？(Dispatching Strategy)

您提到了一个非常好的执行层问题：**"我们是一次性把所有 Prompt 发给 AI 选，还是怎么做？AI 怎么返回多个建议？"**

我们的策略是 **"Prompt 元数据注入 (Metadata Injection)"**：

1.  **输入给 L1 的上下文**:
    *   `Data Summary`: (表头 + 统计信息)
    *   `Available Prompts`: 我们会将 `PromptRegistry` 中的 L2 Prompt 列表（仅 ID、标题、描述、Intent标签）作为 JSON 喂给 L1。
2.  **L1 的任务**:
    *   "请根据数据特征，从 `Available Prompts` 列表中挑选最合适的 3 个。"
3.  **L1 的输出**:
    *   返回一个 **JSON 数组**，包含推荐的 `prompt_id` 和 `reason`。
4.  **UI 渲染**:
    *   前端收到 JSON 数组 -> 遍历 ID -> 从注册表取回完整 Prompt 对象 -> 渲染成一张张卡片。
    *   **清洗卡片** 和 **分析卡片** 可以在同一个列表里混排，因为它们本质上都是 `Card` 组件，只是点击后的 `onExecute` 回调不同。

这意味着：**我们不需要分别请求“清洗建议”和“分析建议”，L1 这个“前台接待”会一次性把活派好。**

### 1.4 交互修正：上下文下钻 (Contextual Drill-down)

根据您的最新指示，我们将交互模式调整为 **"基于卡片的下钻引导"**（而非独立的推荐列表）。

**场景描述**:
1.  **初始状态**: 界面展示一张 AI 生成的基础洞察卡片 (例如: "Price 列存在异常值")。
2.  **下钻入口**: 在这张卡片的底部（或操作区），展示相关的 L2 Prompt 按钮。
    *   例如: `[🔍 深入分析异常点]` `[📉 查看分布趋势]`
3.  **用户点击**: 用户点击 `[🔍 深入分析异常点]`。
4.  **上下文继承**: 系统自动将 **"当前卡片的上下文"** (如: `column='Price'`, `issue='outlier'`) + **Prompt 模版** 结合。
5.  **结果追加**: 在当前卡片下方，追加一张新的 "异常值分析详情" 卡片。

**核心优势**:
*   **模拟对话**: 用户感觉像是在跟这张卡片“对话”（追问），但使用的是标准化的追问按钮。
*   **上下文精准**: 追问是基于当前具体卡片的，AI 不会“跑题”。

---

## 2. 种子 Prompt 清单 (The Seed Set)

我们将实现以下 **3 个核心 Prompt**：

### 2.1 [L1] 全局探索者 (`explorer-general-v1`)
*   **角色**: 经验丰富的数据侦探。
*   **输入**: 数据集概览 (ShowHead + ColumnStats)。
*   **任务**: "找出这个数据集中最值得一看的 3 个特征或关系。"
*   **输出**: 推荐列表（Recommend List），每一项指向一个 L2 Prompt。
    *   *Example*: "推荐看 `Price` 的分布 (调用 `worker-dist`)"，"推荐看 `Price` 和 `Area` 的关系 (调用 `worker-corr`)"。

### 2.2 [L2] 分布绘制者 (`worker-distribution-v1`)
*   **角色**: 严谨的绘图工。
*   **输入**: 单列名称 (`column_name`) + 数据类型。
*   **任务**: "为这个列画一个直方图 (数值) 或 柱状图 (分类)，并计算偏度/峰度。"
*   **技能**: Python (Matplotlib/Seaborn) 或 SQL。

### 2.3 [L2] 关系洞察者 (`worker-correlation-v1`)
*   **角色**: 关系分析师。
*   **输入**: 两列名称 (`col_x`, `col_y`)。
*   **任务**: "画出散点图，并计算皮尔逊/斯皮尔曼相关系数。"
*   **技能**: Python (Pandas/Scipy)。

---

## 3. 落地步骤 (Implementation Steps)

1.  **Schema 定义 (`src/types/prompt.ts`)**:
    *   定义 `UserPrompt` 接口，包含 `layer` (L1/L2) 和 `dimensions` 字段。
2.  **文件结构**:
    *   `src/services/prompts/library/l1/explorer_general.ts`
    *   `src/services/prompts/library/l2/worker_distribution.ts`
    *   `src/services/prompts/library/l2/worker_correlation.ts`
    *   *注: 使用 TypeScript 文件存储 Prompt，方便类型检查和后续的热更架构升级。*
3.  **注册中心 (`src/services/PromptRegistry.ts`)**:
    *   实现一个简单的单例模式，启动时加载所有 Prompt，提供 `getPrompt(id)` 和 `listPrompts(tags)` 方法。

---

## 4. 预期效果

完成这个 MVP 后，原来的“盲盒洞察”流程将变为：
1.  用户打开 Insight 页面。
2.  系统后台调用 `explorer-general`。
3.  界面上不再是直接出图，而是弹出一排 **"推荐卡片"**：
    *   [ 📊 看看价格分布 (Click to Run) ]
    *   [ 📈 看看价格与面积的关系 (Click to Run) ]
4.  用户点击卡片 -> 系统调用对应的 L2 Prompt -> 实时出图。

**这就完美实现了 B+ 方案 (Click-to-Run)。**
