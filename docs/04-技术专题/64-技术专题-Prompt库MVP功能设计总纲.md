# 64-技术专题-Prompt库MVP功能设计总纲 (v1.3)

> **文档性质**: 本文档是对话记录的提炼版，仅保留核心功能设计决策，删除所有过程性讨论。
> **生成时间**: 2025-12-25
> **适用范围**: Phase 1 (基础架构) + Phase 2 (交互设计) 的完整技术方案
> **v1.3 更新**: 输出格式升级为 v2.0，使用 `promptId` + `drillHint`
> **v1.2 更新**: 新增 §10 用户编辑权限与质量把控、§11 版本管理设计
> **v1.1 更新**: 新增 §8 L1质量保障策略、§9 增长飞轮与扩展策略

---

## 1. 核心架构设计

### 1.1 双层 Prompt 体系

| 层级 | 角色 | 输入 | 输出 | 典型用例 |
|:---|:---|:---|:---|:---|
| **L1 决策层** (Router) | 分析数据特征，推荐分析方法 | 数据摘要 + 可用 L2 列表 | JSON 数组（推荐的 L2 ID + 参数） | `explorer_general` |
| **L2 执行层** (Worker) | 生成可执行代码 | 具体方法 + 参数 | Python/SQL 代码 + 执行结果 | `worker_distribution`, `worker_correlation` |

**核心价值**: 
- L1 帮业务专家"选方法、选列"，L2 帮分析师"写代码"。
- 两层解耦，L2 可被 L1 动态组合调用。

### 1.2 四维矩阵分类

每个 Prompt 通过 4 个维度标签进行分类和检索：
1. **Industry** (行业): `general`, `ecommerce`, `finance`...
2. **Intent** (意图): `exploration`, `cleaning`, `causal`...
3. **Method** (方法): `statistics`, `rdd`, `did`...
4. **Output** (输出): `chart`, `sql`, `report`...

**应用场景**:
- UI 筛选器：用户可按 Intent 筛选"只看清洗类"或"只看分析类"。
- L1 路由：根据数据问题（如"ID 重复"）自动推荐带 `intent: cleaning` 标签的 Prompt。

---

## 2. MVP 种子 Prompt 清单

基于**"使用频率 + AI 必要性"**原则，MVP 阶段选定以下 3 个种子：

| ID | 层级 | 功能 | 输入参数 | 选择理由 |
|:---|:---|:---|:---|:---|
| `explorer-general-v1` | L1 | 全局探索路由 | `df_summary` | ⭐⭐⭐⭐⭐ 高频起手式，负责推荐后续分析动作 |
| `worker-distribution-v1` | L2 | 单变量分布分析 | `column_name`, `df_summary` | ⭐⭐⭐⭐⭐ 绝对高频（直方图/柱状图） |
| `worker-correlation-v1` | L2 | 双变量关系分析 | `col_x`, `col_y`, `df_summary` | ⭐⭐⭐⭐⭐ 探索核心（散点图/箱线图） |

**暂缓的备选**:
- 缺失值/异常值分析：已被清洗模块覆盖。
- 时序/回归/聚类：依赖特定数据条件，作为 Phase 3 扩展。

---

## 3. 交互设计：森林式下钻 (Forest Drill-down)

> **适用范围**: 本节仅描述 **洞察分析模块 (Insight Analysis)** 的 Prompt 交互逻辑。
> **核心隐喻**: **"森林结构"** = 顶层是并排的树根（瀑布流），每棵树内部无限分叉（思维导图）。

### 3.1 结构定义

```text
[ 顶层容器: InsightChainFlow (瀑布流) ]
     │
     ├─ [ Card A: Price 分布 ] (根节点 1)
     │      │
     │      ├─ [ Child A1: 异常值详情 ] (点击"分析异常"生成)
     │      │      └─ [ GrandChild A1_1: 离群点标记 ]
     │      │
     │      └─ [ Child A2: 统计摘要 ] (点击"查看统计"生成) ——> 与 A1 并行存在！
     │
     └─ [ Card B: Price vs Area ] (根节点 2)
            └─ ...
```

### 3.2 关键特性：扩散效应 (Diffusion Effect)

1.  **多路并行 (Parallel Actions)**:
    *   一个父卡片底部可以有多个 Action Chips（如 `[🔍 分析异常]` `[📉 查看分布]` `[📜 统计摘要]`）。
    *   用户可以**同时点击**多个胶囊。
    *   结果会像思维导图的分支一样，**平铺展开**在父节点下方，互不覆盖。

2.  **层级嵌套 (Recursive Nesting with Depth Limit)**:
    *   生成的子卡片（Child Node）本身也是一个完整的 Insight 节点。
    *   子卡片底部会根据其内容，自动生成**新的一轮 Action Chips**。
    *   **MVP 限制**: 最大嵌套深度为 **3 层** (`MAX_DRILL_DEPTH = 3`)，避免页面加载失控。
    *   到达第 3 层后，不再显示下钻按钮，仅展示当前结果。

3.  **上下文继承 (Context Inheritance)**:
    *   **父传子**: 点击父卡片的胶囊时，父卡片的 `columnsUsed` (如 `['Price']`) 和 `context` (如 "发现左偏分布") 会自动传给 AI。
    *   **自动绑定**: AI 生成的子 Prompt 自动锁定在父卡片的列上，无需用户再次选列。

### 3.3 UI 表现

```text
┌───────────────────────────────────────────────┐
│ 📊 [根] Price 数据分布                         │
│ (直方图展示...)                               │
│ 行动: [🔍 分析异常] [📜 查看统计] [❌ 关闭]    │
├──────────────────────┬────────────────────────┤
│ 1. 异常值详情 (Child) │ 2. 统计摘要 (Child)    │
│ (箱线图...)          │ (表格...)              │
│ 行动: [👀 剔除]      │ 行动: [📋 复制]        │
└──────────────────────┴────────────────────────┘
```
*注：子节点视觉上稍作缩进或使用连线标识层级关系。*

---

## 4. 技术实现方案

### 4.1 数据结构 (`src/types/prompt.ts`)

```typescript
export interface UserPrompt {
    id: string;               // e.g., "worker-distribution-v1"
    name: string;            // e.g., "worker_distribution"
    title: string;           // e.g., "单变量分布分析"
    description: string;     // 用于 L1 语义匹配
    layer: 'L1_DECISION' | 'L2_EXECUTION';
    dimensions: PromptTag[]; // 四维标签
    template: string;        // System Prompt 模板 (支持 {{variable}})
    inputVariables: string[]; // 参数列表
    relatedWorkerIds?: string[]; // L1 可调用的 L2 列表
    // ... 元数据
}
```

### 4.2 注册中心 (`src/services/promptRegistry.ts`)

- **单例模式**：全局唯一的 Prompt 仓库。
- **职责**：
  - `getPrompt(id)`: 按 ID 获取 Prompt。
  - `listPrompts(filter)`: 按 Layer/Tags 筛选。
  - `register(prompt)`: 注册单个 Prompt。

### 4.3 依赖注入方案

**拒绝硬编码**: `PromptRegistry` 不在构造函数里直接 import Prompt 文件。

**采用清单注入**:
1. 创建 `src/services/prompts/index.ts` (Manifest):
   ```typescript
   export const seedPrompts = [
       explorerGeneralPrompt,
       workerDistributionPrompt,
       workerCorrelationPrompt
   ];
   ```
2. 在 `main.tsx` 启动时调用:
   ```typescript
   import { promptRegistry } from './services/promptRegistry';
   import { seedPrompts } from './services/prompts';
   promptRegistry.registerBatch(seedPrompts);
   ```

### 4.4 森林式下钻数据结构

```typescript
// 常量定义
const MAX_DRILL_DEPTH = 3; // 最大嵌套层数

// 顶层容器
interface InsightChain {
  rootCards: InsightNode[];  // 瀑布流中的根节点（L1 推荐的初始卡片）
}

// 单个洞察节点（递归结构）
interface InsightNode {
  id: string;
  depth: number;             // 当前层级 (0=根, 1=子, 2=孙, 3=曾孙=终点)
  title: string;
  columnsUsed: string[];     // 继承自父节点或由 AI 生成
  parentContext?: string;    // 父节点的结论摘要（用于上下文注入）
  
  // 执行结果
  result?: {
    image?: string;          // Base64 图表
    summary: string;         // AI 结论
    code: string;            // 生成的代码
  };
  
  // 下钻入口
  drillDownActions: Array<{
    label: string;           // 按钮文案
    promptId: string;        // 对应的 L2 Prompt ID
    params: Record<string, any>; // 继承的参数（如 column_name）
  }>;
  
  // 子节点（树状结构）
  children: InsightNode[];   // 并行展开的子节点
  isExpanded: boolean;       // 是否展开
}
```

### 4.5 上下文继承机制

```typescript
function handleDrillDown(parent: InsightNode, action: DrillDownAction) {
  // 1. 检查深度限制
  if (parent.depth >= MAX_DRILL_DEPTH) {
    showToast('已达到最大下钻深度');
    return;
  }
  
  // 2. 自动继承父节点的列信息
  const inheritedParams = {
    ...action.params,
    column_name: action.params.column_name || parent.columnsUsed[0],
    parent_context: parent.result?.summary || parent.title
  };
  
  // 3. 获取并填充 Prompt 模板
  const prompt = promptRegistry.getPrompt(action.promptId);
  const filledTemplate = fillTemplate(prompt.template, inheritedParams);
  
  // 4. 执行 AI 调用
  const result = await executeAI(filledTemplate);
  
  // 5. 创建子节点
  const childNode: InsightNode = {
    id: generateId(),
    depth: parent.depth + 1,  // 层级 +1
    title: result.summary,
    columnsUsed: parent.columnsUsed,  // 继承
    parentContext: parent.result?.summary,
    result: result,
    drillDownActions: parent.depth + 1 < MAX_DRILL_DEPTH 
      ? generateNextActions(result)  // 未到底，生成新的下钻选项
      : [],                           // 到底了，不再生成下钻选项
    children: [],
    isExpanded: true
  };
  
  // 6. 挂载到父节点的 children 数组（与现有子节点并行）
  parent.children.push(childNode);
  parent.isExpanded = true;
  
  // 7. 触发 UI 重新渲染
  rerenderTree();
}
```

---

## 5. L1 与 UI 的参数绑定逻辑

### 5.1 L1 输出格式 (v2.0)

L1 Prompt (`explorer-general`) 分析数据后，返回一个 JSON 对象：
```json
{
  "recommendations": [
    {
      "promptId": "worker-distribution-v1",
      "params": { "column_name": "Price" },
      "reason": "Price 列方差较大，建议查看分布",
      "drillHint": {
        "promptId": "worker-correlation-v1",
        "params": { "col_x": "Price", "col_y": "Area" },
        "label": "分析价格与面积的关系"
      }
    },
    {
      "promptId": "worker-correlation-v1",
      "params": { "col_x": "Price", "col_y": "Area" },
      "reason": "房价与面积可能存在正相关"
    }
  ]
}
```

**v2.0 变更说明**:
- 使用 `promptId` 替代原来的 `type`，直接对应注册表中的 Prompt ID
- 新增 `drillHint` 预测字段，用于预填下钻按钮
- 外层包装为 `{ recommendations: [...] }` 对象格式

### 5.2 UI 渲染逻辑

前端收到 JSON 后：
1. **解析推荐**：遍历 `recommendations` 数组，提取 `promptId` 和 `params`。
2. **渲染按钮**：
   - 文案：根据 `reason` 生成按钮文字（如"查看 Price 分布"）。
   - 绑定参数：将 `params` 对象存到 React State。
3. **点击触发**：
   - 从 `PromptRegistry` 获取对应模板。
   - 用 `params` 填充模板的 `{{variable}}`。
   - 调用 AI/Skill 执行。
4. **渲染下钻**：
   - 如果存在 `drillHint`，渲染为推荐的下钻按钮。
   - 用户点击后直接执行（参数已预填）。

**关键**：**列名是由 L1 AI 分析决定的**，不需要前端猜测或硬编码。

---

## 6. 清洗 vs 分析的区分机制

| 维度 | 分析类 Prompt | 清洗类 Prompt |
|:---|:---|:---|
| **Intent 标签** | `exploration`, `causal` | `cleaning` |
| **Output 标签** | `chart`, `report` | `sql`, `python_mutation` |
| **执行后行为** | **追加 (Append)**：在瀑布流中增加新卡片 | **刷新 (Refresh)**：执行 SQL 更新表，刷新 DataViewer |
| **L1 推荐逻辑** | 发现数据特征 (如"偏态分布") -> 推荐画图 | 发现质量问题 (如"ID 重复") -> 推荐去重 |

**本次 MVP 仅实现"分析类"，但架构已预留清洗类的位置。**

---

## 7. Phase 2 执行计划 (待实施)

1. **注入 Prompt**：在 `main.tsx` 中调用 `registerBatch(seedPrompts)`。
2. **改造 InsightChainFlow**：
   - 初始加载时调用 L1 Prompt (`explorer-general`)。
   - 渲染 L1 返回的推荐列表为 Action Chips。
3. **新增 ActionChip 组件**：
   - 接收 `{ type, params, reason }` Props。
   - 点击时触发 L2 执行。
4. **追加结果卡片**：
   - L2 执行完成后，在当前卡片下方插入新的 Result Card。
   - 新卡片底部再次调用 L1 进行下一轮推荐（实现"无限下钻"）。

---

---

## 8. L1 质量保障策略

> **核心思路**: 规则优先，AI 兜底。让 AI 做"选择题"而非"开放题"，消除幻觉风险。

### 8.1 三层架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  确定性规则层    │ ──▶ │  AI 增强层      │ ──▶ │  兜底保障层     │
│  (100% 可控)    │     │  (锦上添花)     │     │  (永不为空)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

| 层级 | 可靠性 | 智能度 | 延迟 | 失败影响 |
|------|--------|--------|------|----------|
| 规则层 | ⭐⭐⭐⭐⭐ | ⭐⭐ | 0ms | 无 |
| AI层 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 1-3s | 降级到规则层 |
| 兜底层 | ⭐⭐⭐⭐⭐ | ⭐ | 0ms | 无 |

### 8.2 确定性规则层

根据数据特征直接生成必推荐项（不依赖 AI）：

| 数据特征检测 | 必推荐的分析 | 理由 |
|-------------|-------------|------|
| 存在日期/时间列 | 📈 时序趋势分析 | 有时间就看趋势 |
| 存在数值列 | 📊 分布分析 | 数值必看分布 |
| 存在2个数值列 | 🔗 相关性分析 | 两个数值看关系 |
| 数值列有离群值 | ⚠️ 异常值分析 | 客观事实检测 |
| 分类列 + 数值列 | 📦 分组对比分析 | 维度+指标经典组合 |

### 8.3 AI 增强层

AI 职责：**在规则之上做增强**，而非从零推荐。

- **排序优先级**: "Price 列方差最大，应优先分析"
- **发现隐藏关系**: "Price 和 Area 相关系数 0.85"
- **生成 reason 文案**: "房价分布呈现明显右偏"
- **补充非显性推荐**: "发现季度周期性，建议按季度分组"

### 8.4 选择题式 Prompt 设计

> ⚠️ **启用条件**: 当 L2 Prompt 模板数量 **≥ 10 个**时启用此策略。
> MVP 阶段（3个L2）暂使用开放式 + 规则兜底。

**核心思想**: 在 L1 Prompt 中注入【可用分析清单】，限制 AI 只能从清单中选择。

```markdown
# L1 System Prompt 模板

你只能从【可用分析清单】中选择推荐，禁止编造。

## 可用分析清单
{{AVAILABLE_PROMPTS}}  // 动态注入

## 输出格式（严格JSON）
[{ "promptId": "worker-xxx-v1", "params": {...}, "reason": "..." }]
```

**动态注入逻辑**:
```typescript
function buildL1Prompt(dfSummary: DataSummary): string {
  const availableL2 = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' });
  const promptList = availableL2.map(p => 
    `- ${p.id}: ${p.title} (参数: ${p.inputVariables.join(', ')})`
  ).join('\n');
  
  return L1_TEMPLATE.replace('{{AVAILABLE_PROMPTS}}', promptList);
}
```

### 8.5 返回值校验

```typescript
function validateL1Response(response: any[]): Recommendation[] {
  return response.filter(item => {
    // 1. promptId 必须存在于注册表
    if (!promptRegistry.hasPrompt(item.promptId)) {
      console.warn(`[L1] 无效的 promptId: ${item.promptId}`);
      return false;
    }
    // 2. params 必须包含必需参数
    const prompt = promptRegistry.getPrompt(item.promptId);
    const missing = prompt.inputVariables.filter(v => !(v in item.params));
    if (missing.length > 0) {
      console.warn(`[L1] 缺少参数: ${missing.join(', ')}`);
      return false;
    }
    return true;
  });
}
```

---

## 9. 增长飞轮与扩展策略

### 9.1 增长飞轮

```
新增 Prompt 模板 → AI 可选项变多 → 匹配精度提升 → 
用户满意度↑ → 收集反馈 → 催生新 Prompt 需求 → (循环)
```

**核心洞察**:
- 每个 Prompt 是一块"凝固的专家经验"
- AI 只是"图书管理员"，专家知识质量由人类保证
- 知识沉淀的边际成本为零

### 9.2 覆盖度演进

| 阶段 | Prompt 数量 | 场景覆盖 |
|------|-------------|----------|
| MVP | 3个 | 分布、相关性、基础统计 |
| V1.1 | 10个 | +时序、异常值、分组对比 |
| V2 | 30个 | +回归、聚类、因果推断 |
| V3+ | 100+ | 行业模板（电商、金融、制造） |

### 9.3 扩展策略

| Prompt 数量 | AI 选择难度 | 应对策略 |
|-------------|------------|----------|
| < 10 | 🟢 简单 | 全量 + 规则兜底 |
| 10-50 | 🟡 中等 | 选择题式 + 按标签预筛 |
| 50-100 | 🟠 困难 | 两级路由 (L0 → L1) |
| 100+ | 🔴 复杂 | 向量检索 + 语义匹配 |

**预筛选示例**:
```typescript
function preselectPrompts(dfSummary: DataSummary): UserPrompt[] {
  let filter: PromptFilter = { layer: 'L2' };
  
  if (dfSummary.columns.some(c => c.dtype === 'datetime')) {
    filter.methods = [...filter.methods, 'timeseries'];
  }
  
  return promptRegistry.listPrompts(filter);
}
```

---

## 10. 用户编辑权限与质量把控

> **适用场景**: 后续开放 Prompt 用户侧编辑功能时的治理机制。

### 10.1 四层质量把控体系

```
┌─────────────────────────────────────────────────────────┐
│  第4层: 社区筛选 (Community Curation)                    │
│  投票/收藏/使用量 → 优质内容浮现                          │
├─────────────────────────────────────────────────────────┤
│  第3层: 人工审核 (Human Review)                          │
│  公开发布前需审核 / 举报机制                              │
├─────────────────────────────────────────────────────────┤
│  第2层: AI 质量评估 (AI Quality Check)                   │
│  结构完整性 / 安全检查 / 效果预估                         │
├─────────────────────────────────────────────────────────┤
│  第1层: 规则校验 (Schema Validation)                     │
│  必填字段 / 格式校验 / SQL 安全白名单                    │
└─────────────────────────────────────────────────────────┘
```

### 10.2 第1层：规则校验

**零成本、实时拦截**，在用户保存时立即执行：

```typescript
function validatePrompt(prompt: UserPrompt): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. 必填字段检查
  if (!prompt.id || !prompt.title || !prompt.template) {
    errors.push('缺少必填字段');
  }
  
  // 2. ID 格式校验
  if (!/^[a-z0-9-]+$/.test(prompt.id)) {
    errors.push('ID 只能包含小写字母、数字和连字符');
  }
  
  // 3. Template 变量匹配
  const usedVars = prompt.template.match(/\{\{(\w+)\}\}/g) || [];
  const declaredVars = prompt.inputVariables;
  const missingVars = usedVars.filter(v => 
    !declaredVars.includes(v.replace(/\{\{|\}\}/g, ''))
  );
  if (missingVars.length > 0) {
    errors.push(`Template 中使用了未声明的变量: ${missingVars.join(', ')}`);
  }
  
  // 4. SQL 安全白名单（清洗类）
  if (prompt.dimensions.some(d => d.value === 'cleaning')) {
    const dangerousPatterns = [/DROP\s+TABLE/i, /TRUNCATE\s+TABLE/i];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(prompt.template)) {
        errors.push('检测到危险 SQL 操作，禁止使用');
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

### 10.3 第2层：AI 质量评估

用 LLM 对 Prompt 进行质量打分：

| 评估维度 | 权重 | 说明 |
|---------|------|------|
| 清晰度 | 20% | 指令是否明确无歧义 |
| 完整性 | 20% | 是否包含足够上下文和约束 |
| 安全性 | 20% | 是否可能产生有害输出 |
| 可执行性 | 20% | 生成的代码是否能正常运行 |
| 一致性 | 20% | 输出格式要求是否清晰 |

**应用规则**：
- 评分 < 60：禁止发布
- 评分 60-80：标记为"待审核"
- 评分 > 80：可公开发布

### 10.4 第3层：人工审核

**审核流程**：
```
用户提交 → AI 预审 → [通过] → 自动发布
                    ↓
                 [待审核] → 人工队列 → 审核员决定
                    ↓
                  [拒绝] → 返回修改建议
```

### 10.5 第4层：社区筛选

| 机制 | 数据字段 | 用途 |
|------|---------|------|
| 使用量 | `usageCount` | 被调用次数 |
| 成功率 | `successRate` | 执行成功比例 |
| 评分 | `rating` | 用户五星评价 |
| 收藏 | `favorites` | 加入收藏数 |
| 举报 | `reports` | 超阈值自动下架 |

### 10.6 分级权限设计

| 用户等级 | 权限 | 约束 |
|---------|------|------|
| 游客 | 只读官方 Prompt | - |
| 普通用户 | 创建私有 Prompt | 仅自己可见 |
| 认证用户 | 申请公开发布 | 需审核 |
| 贡献者 | 自动公开发布 | AI 评分 > 70 自动通过 |
| 管理员 | 审核权限 | 可下架/删除 |

---

## 11. 版本管理设计

### 11.1 为什么需要版本管理

| 场景 | 痛点 |
|------|------|
| 修改后效果变差 | 用户改坏了，需要回滚 |
| 多人协作 | 谁改了什么？冲突处理 |
| 审核追溯 | 审核通过的是哪个版本 |
| A/B 测试 | 不同版本效果对比 |
| 官方模板更新 | 用户自定义版本如何同步 |

### 11.2 版本数据结构

```typescript
interface PromptVersion {
  id: string;                    // "worker-distribution-v1.2.3"
  promptId: string;              // "worker-distribution"
  version: string;               // "1.2.3"
  
  content: {
    title: string;
    description: string;
    template: string;
    inputVariables: string[];
    dimensions: PromptTag[];
  };
  
  changelog: string;             // 变更说明
  diffFromPrevious?: string;     // 与上一版本的 diff
  
  author: string;
  createdAt: number;
  status: 'draft' | 'published' | 'deprecated' | 'archived';
  
  reviewedBy?: string;
  reviewedAt?: number;
  
  stats?: {
    usageCount: number;
    successRate: number;
  };
}
```

### 11.3 版本号规范（语义化版本）

```
MAJOR.MINOR.PATCH
  │      │     └─ 修复：小的文案/格式调整
  │      └─────── 功能：新增参数、新增分支逻辑
  └────────────── 重大：输出格式变化、破坏性修改
```

### 11.4 版本状态流转

```
[draft] ──编辑完成──→ [pending_review] ──审核通过──→ [published]
   ↑                       │                           │
   │                       ↓ 审核拒绝                   ↓ 有新版本发布
   └───────────────── [rejected]                  [deprecated]
                                                       │
                                                       ↓ 彻底废弃
                                                  [archived]
```

### 11.5 核心操作

**版本创建**：
```typescript
async function createNewVersion(promptId: string, changes: Partial<Content>, changelog: string) {
  const current = await getPrompt(promptId);
  const newVersion = bumpVersion(current.version, detectChangeType(changes));
  // 保存新版本快照...
}
```

**版本回滚**：
```typescript
async function rollbackToVersion(promptId: string, targetVersion: string) {
  const targetData = await getVersion(promptId, targetVersion);
  await createNewVersion(promptId, targetData.content, `回滚到 v${targetVersion}`);
}
```

### 11.6 实施路线

| 阶段 | 版本管理功能 |
|------|-------------|
| V1 (MVP) | 仅保留 `version` 字段，不做完整历史 |
| V1.1 | 增加版本快照存储 + 回滚能力 |
| V2 | 增加 Diff 对比 + 版本统计分开 |
| V3+ | 多人协作 + 分支合并 |

---

*本文档是技术设计的最终版本（v1.2），后续实施时请严格遵循此方案，避免重复讨论已定事项。*
