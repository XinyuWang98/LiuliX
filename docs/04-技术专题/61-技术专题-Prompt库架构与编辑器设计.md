# 技术专题：基于四维矩阵的 Prompt 库架构与编辑器设计 (v2.0)

> [!IMPORTANT]
> **版本更新 (v2.0)**：基于“业务专家”与“数据分析师”的双用户画像，我们将 Prompt 库升级为 **"行业/业务 × 分析目的 × 分析方法 × 结论输出"** 的四维矩阵架构。
> 从单纯的“代码生成模板”进化为 **"业务思维 (Decision) + 专家执行 (Execution)"** 的双层智能系统。

## 1. 核心设计理念：双层矩阵架构

我们不再将 Prompt 视为平铺的列表，而是构建一个立体的 **“分析能力矩阵”**。

### 1.1 双层 Prompt 体系 (Layered Architecture)

为了同时满足小白（业务专家）和专家（分析师）的需求，我们将 Prompt 划分为两个职能层级：

| 层级 | 类型 | 目标用户 | 核心职责 | 输入 vs 输出 |
| :--- | :--- | :--- | :--- | :--- |
| **L1 决策层** | **Router / Explorer** | **业务专家** | **“我知道业务问题，不知用什么方法”**<br>负责将模糊的业务意图（如“销量为何下滑”）翻译为具体的数学方法（如“RDD断点回归”）。 | **Input**: 业务问题 + 数据特征<br>**Output**: 推荐的方法 (Method ID) |
| **L2 执行层** | **Worker / Solver** | **数据分析师** | **“我知道用什么方法，帮我写代码”**<br>负责将具体的数学方法（如“执行双重差分”）转化为高质量的 Python/SQL 代码。 | **Input**: 明确方法 + 参数约束<br>**Output**: Python/SQL 代码 |

### 1.2 四维分类矩阵 (The 4D Matrix)

每个 Prompt（尤其是 L1 决策层）都由四个维度定义，用户可以通过这四个维度快速定位所需能力：

1.  **行业/业务 (Context)**: 
    *   *Domain*: 电商、金融、医疗、通用...
    *   *Scenario*: 或者是具体的业务场景（用户流失、活动评估）。
2.  **分析目的 (Intent)**: 
    *   *Goal*: 因果归因、趋势预测、异常检测、现状描述...
3.  **分析方法 (Method)**: 
    *   *Technique*: RDD、DID、DoWhy、聚类、时序分解...
    *   *注*: 业务专家可能不选此项（选“自动推荐”），分析师则直接选此项。
4.  **结论输出 (Format)**: 
    *   *Output*: 关键指标卡片、多维图表、文字报告、甚至是一段 SQL 清洗脚本。

---

## 2. 数据结构定义 (Schema)

我们将 `UserPrompt` 结构升级以支持矩阵分类和分层引用。

```typescript
// src/types/prompt.ts

export type PromptLayer = 'L1_DECISION' | 'L2_EXECUTION';
// 行业/业务, 分析目的, 分析方法, 结论输出
export type DimensionKey = 'industry' | 'intent' | 'method' | 'output';

export interface PromptTag {
  category: DimensionKey;
  value: string; // e.g., "ecommerce", "causal_inference", "rdd", "chart_report"
  label: string; // e.g., "电商", "因果归因", "断点回归", "图表报告"
}

export interface UserPrompt {
  id: string;        // e.g., "decision-sales-drop-v1"
  title: string;     // e.g., "销量下滑原因排查 (电商版)"
  description: string;
  
  // v2.0 核心架构字段
  layer: PromptLayer;
  dimensions: PromptTag[]; // 四维标签集合
  
  // 关联逻辑 (用于 L1 找 L2)
  // 如果是 L1 Prompt，它可能会推荐以下 L2 Prompts
  relatedWorkerIds?: string[]; 

  // 核心内容
  template: string;  // System Prompt 模板
  
  // 元数据
  author: string;
  version: number;
  isBuiltIn: boolean;
  updatedAt: number;
}
```

---

## 3. 用户旅程 (User Journey)

### 3.1 场景 A：业务专家 (The Explorer)
*“我知道最近双十一活动后销量反而跌了，我想知道是不是活动策略有问题，但我不知道该用 DID 还是 RDD。”*

1.  **交互**：用户在“分析目的”选“因果归因”，在“行业”选“电商”。
2.  **系统推荐**：匹配到 L1 Prompt **"营销活动效果评估专家"**。
3.  **Prompt 运行 (L1)**：
    *   AI (Router) 分析数据，发现有“活动开始时间”和“未参与活动的用户组”。
    *   AI 决策：推荐使用 **DID (双重差分法)**。
4.  **系统流转**：
    *   系统自动调用 L2 Prompt **"DID 分析执行器"**。
    *   L2 Prompt 生成 Python 代码。
5.  **结果**：用户直接看到结论：“活动策略导致销量下降了 5%，且统计显著。”

### 3.2 场景 B：数据分析师 (The Pro)
*“我明确知道这个数据适合做 RDD，别废话，帮我写 RDD 代码。”*

1.  **交互**：用户直接在“分析方法”选 **"RDD (断点回归)"**。
2.  **系统过滤**：直接展示 L2 Prompt **"RDD 标准执行器"**。
3.  **Prompt 运行 (L2)**：
    *   用户输入：`sys_run_python` 的 RDD 模板被加载。
    *   AI 直接生成代码。
4.  **结果**：用户得到可执行的 Python 代码和图表，并可以基于此修改代码进行微调。

---

### 3.5 入口与意图匹配 (The Librarian)

**Q：系统怎么知道该加载哪个 Prompt？**
用户最反感的是“查户口式”的表单填写（尤其是在上传文件这种高频操作时）。
因此，**"Librarian" 必须是隐形的**。它不应该阻断流程，而应该提供“上下文建议”。

#### 3.5.1 交互原则：零阻力接入 (Zero Friction)

我们坚决**反对**在上传文件时弹窗询问“你的分析目的是什么？”这会导致用户流失。

**推荐的交互流程**：
1.  **Passive (静默)**：文件上传成功后，Librarian 在后台利用数据元数据（列名、类型）快速匹配最可能的 Top-3 L1 Prompt。
2.  **Suggestion (建议)**：在数据预览页顶端，展示 3 个彩色 Chip 按钮。
    *   例如：检测到 `date` 和 `sales` -> 推荐 `[📈 销量趋势分析]` `[🔍 异常交易检测]`
3.  **Reactive (响应)**：用户也可以直接在对话框输入“帮我看下销量”，此时触发 **语义/关键词路由**。

| 匹配模式 | 机制 | 场景 | 体验评分 |
| :--- | :--- | :--- | :--- |
| **A. 智能推荐 (Chips)** | 后台元数据匹配 -> 前端展示 Chip | 用户甚至不知道该问什么，系统给灵感 | ⭐⭐⭐⭐⭐ |
| **B. 对话触发 (Chat)** | 用户输入 Query -> 语义/关键词路由 | 用户有明确问题 | ⭐⭐⭐⭐⭐ |
| **C. 侧边栏选择 (Menu)** | 用户手动浏览 Prompt 列表 | 专家用户明确要找特定工具 | ⭐⭐⭐⭐ |
| **D. 上传时询问 (Form)** | 上传 -> 弹窗填单 -> 分析 | **(已废弃)** 阻断感太强，用户体验差 | ⭐ |

**MVP 策略**：优先实现 **A (基于规则的 Chip 推荐)** + **C (侧边栏列表)**。
*   规则示例：`if (hasDate && hasNumber) return ["趋势分析", "时序异常检测"]`。

---

## 4. UI/UX 设计升级

编辑器界面需要体现“矩阵”和“分层”的概念。

### 4.1 筛选区 (The Matrix Filter)
在 Prompt 库首页顶部，提供 4 个下拉级联筛选器：
*   🏢 **行业场景**: [全部/电商/金融...]
*   🎯 **分析目的**: [全部/归因/预测/清洗...]
*   🔧 **分析方法**: [全部/RDD/DID/聚类...] (业务专家通常留空)
*   📄 **输出形式**: [全部/图表/报告/SQL]

### 4.2 列表展示 (Grouped List)
*   **L1 决策类 (蓝色 Badge)**: 标有 "Router" 或 "专家向导"。点击后通常会引导至某个具体的 L2。
*   **L2 执行类 (绿色 Badge)**: 标有 "Worker" 或 "工具模版"。点击后直接生成代码。

### 4.3 详情/编辑页
*   增加 **"Dimensions 配置区"**：允许用户为自定义 Prompt 打上四维标签。
*   增加 **"Chain 预览"** (仅 L1)：如果这是一个决策 Prompt，允许预览它可能调用的 L2 Prompt 列表。

---

## 5. 内置 Prompt 规划 (Matrix Initial Set)

我们需要预置一套覆盖核心场景的矩阵。

| ID | Layer | 行业 | 目的 | 方法 | 输出 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `router-causal-general` | **L1** | 通用 | 因果归因 | (自动决策) | 诊断报告 | **[专家]** 自动判断 RDD/DID/DoWhy |
| `router-sales-drop` | **L1** | 电商 | 异动分析 | (自动决策) | 归因报告 | **[专家]** 针对销量下跌的专用诊断逻辑 |
| `worker-rdd` | **L2** | 通用 | (N/A) | RDD | 图表+P值 | **[工具]** 标准断点回归代码执行器 |
| `worker-did` | **L2** | 通用 | (N/A) | DID | 趋势图+ATT | **[工具]** 标准双重差分代码执行器 |
| `worker-dowhy` | **L2** | 通用 | (N/A) | DoWhy | 因果图+验证 | **[工具]** 标准 DoWhy 流程执行器 |
| `worker-cleaning-dedup` | **L2** | 通用 | 清洗 | 去重 | SQL脚本 | **[工具]** SQL 智能去重 |

---

## 6. 集成架构调整

`AIService` 的调用流程需要支持递归/链式调用：

```typescript
// 伪代码：支持 Router -> Worker 的跳转
async function handleUserQuery(query, promptId) {
    const prompt = getPrompt(promptId);
    
    // 如果是 L1 决策层
    if (prompt.layer === 'L1_DECISION') {
        // 1. 运行决策 Prompt
        const decision = await llm.chat(prompt.template, query); 
        // 假设返回 { recommendedMethod: 'worker-rdd', reason: '...' }
        
        // 2. 加载对应的 L2 Prompt
        const workerPrompt = getPrompt(decision.recommendedMethod);
        
        // 3. 注入决策上下文，运行 L2
        return await llm.chat(workerPrompt.template, query, {
            systemInject: `决策背景: ${decision.reason}`
        });
    } 
    
    // 如果是 L2 执行层 (或普通 Prompt)
    else {
        return await llm.chat(prompt.template, query);
    }
}
```

## 7. 总结

这一“四维矩阵 + 双层架构”设计：
1.  **满足了业务专家**：他们只需关注“行业”和“目的”，系统帮他们选“方法”。
2.  **满足了分析师**：他们可以直接搜索“方法”，通过 L2 Prompt 快速拿代码。
3.  **结构化治理**：四维标签让 Prompt 库在膨胀到 100+ 个时依然井井有条，易于检索。
