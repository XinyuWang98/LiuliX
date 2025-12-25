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

### 10.7 可见性范围设计

用户创建的 Prompt 可以选择三种可见性范围：

```
┌─────────────────────────────────────────────────────────┐
│                     🌍 公开社区 (public)                 │
│              所有用户可见、可使用、可 Fork               │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  👥 团队共享 (team)              │   │
│  │           团队成员可见、可使用、可编辑           │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │              🔒 私有本地 (private)       │   │   │
│  │  │         仅创建者可见、可编辑             │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### 数据结构

```typescript
interface PromptVisibility {
  scope: 'private' | 'team' | 'public';
  teamId?: string;           // scope='team' 时必填
  sharedWith?: string[];     // 额外分享给特定用户 (email/userId)
}

interface UserPromptWithVisibility extends UserPrompt {
  visibility: PromptVisibility;
  ownerId: string;           // 创建者
  teamId?: string;           // 所属团队
}
```

#### 可见性权限矩阵

| 可见性 | 创建者 | 团队成员 | 其他用户 | 审核要求 |
|--------|--------|---------|---------|---------|
| **private** | 查看/编辑/删除 | ❌ | ❌ | 无 |
| **team** | 查看/编辑/删除 | 查看/使用/Fork | ❌ | 无 |
| **public** | 查看/编辑/删除 | 查看/使用/Fork | 查看/使用/Fork | ✅ 需审核 |

#### 操作权限

```typescript
function canAccess(user: User, prompt: PromptWithVisibility): boolean {
  // 1. 创建者始终有权限
  if (prompt.ownerId === user.id) return true;
  
  // 2. 管理员始终有权限
  if (user.role === 'admin') return true;
  
  // 3. 根据可见性判断
  switch (prompt.visibility.scope) {
    case 'private':
      return false;
    case 'team':
      return user.teamId === prompt.teamId;
    case 'public':
      return prompt.status === 'published'; // 仅已发布的公开 Prompt
  }
}

function canEdit(user: User, prompt: PromptWithVisibility): boolean {
  // 仅创建者和管理员可编辑
  return prompt.ownerId === user.id || user.role === 'admin';
}

function canFork(user: User, prompt: PromptWithVisibility): boolean {
  // 可访问的 Prompt 都可以 Fork
  return canAccess(user, prompt) && prompt.visibility.scope !== 'private';
}
```

#### 可见性切换规则

| 从 | 到 | 是否允许 | 条件 |
|----|-----|---------|------|
| private | team | ✅ | 用户属于某个团队 |
| private | public | ✅ | 需通过审核 |
| team | private | ✅ | 无条件 |
| team | public | ✅ | 需通过审核 |
| public | team | ⚠️ | 已有使用记录时需确认 |
| public | private | ⚠️ | 已有使用记录时需确认 |

#### UI 交互概念

```
┌─────────────────────────────────────────────────────────┐
│ 📝 我的自定义分析 Prompt                                 │
├─────────────────────────────────────────────────────────┤
│ 可见性: [🔒 仅自己] [👥 团队] [🌍 社区] ← 单选切换       │
│                                                         │
│ 当前: 🔒 仅自己可见                                      │
│                                                         │
│ [切换到团队共享]  ← 确认后立即生效                       │
│ [申请发布到社区]  ← 需要审核                             │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│ 💡 提示: 发布到社区后，其他用户可以使用和 Fork 此 Prompt │
└─────────────────────────────────────────────────────────┘
```

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

## 12. 创作者激励与分成机制

> **核心理念**: 维护专家用户（资深分析师）比拓展新用户更重要。通过激励机制鼓励他们贡献优质内容。

### 12.1 用户分层策略

| 用户类型 | 特征 | 核心诉求 | 策略 |
|---------|------|---------|------|
| **专家创作者** | 资深分析师，有行业经验 | 影响力、收入、认可 | **重点维护** |
| **活跃使用者** | 经常使用，偶尔贡献 | 效率、学习 | 付费转化 |
| **新手用户** | 刚入门，需要引导 | 快速上手 | 基础免费 |
| **付费订阅者** | 愿意为效率付费 | 高质量内容 | 高级功能 |

### 12.2 Prompt 定价模型

| Prompt 类型 | 定价 | 说明 |
|-------------|------|------|
| 官方内置 | 🆓 免费 | 基础分析方法 |
| 社区 - 通用 | 🆓 免费 | 贡献者选择免费分享 |
| 社区 - 高级 | 💰 订阅解锁 | 需订阅 Pro 会员使用 |
| 社区 - 独家 | 💰💰 单独购买 | 稀缺行业模板 |

### 12.3 创作者分成机制

```typescript
// 分成计算公式
function calculateWeeklyRevenue(prompt: PromptStats, weeklyPool: number): number {
  const platformFee = 0.30;  // 平台抽成 30%
  const creatorPool = weeklyPool * (1 - platformFee);  // 创作者池 70%
  
  // 按周使用量占比分配
  return creatorPool * prompt.weeklyUsagePercentage;
}
```

**收入分配**:
```
订阅收入 100%
├── 平台运营 30% (服务器、AI、研发)
└── 创作者分成池 70%
    └── 按周使用量分配给各 Prompt 作者
```

### 12.4 创作者等级体系

| 等级 | 条件 | 分成比例 | 特权 |
|------|------|---------|------|
| 🌱 新手创作者 | 首次发布 | 70% | 基础功能 |
| ⭐ 活跃创作者 | 累计 100 次使用 | 70% | 优先曝光 |
| 🌟 优质创作者 | 1000+ 使用 + 4.5+ 评分 | 75% | 徽章 |
| 💎 金牌创作者 | 10000+ 使用 + 持续活跃 | 80% | 首页推荐 |
| 🏆 认证专家 | 平台认证 + 行业背书 | 85% | 专属标识 |

### 12.5 非货币激励

| 激励类型 | 机制 | 价值 |
|---------|------|------|
| 社区影响力 | 排行榜、粉丝数、引用次数 | 职业声誉 |
| 徽章系统 | 首发徽章、热门徽章、专家徽章 | 成就感 |
| 平台曝光 | 首页推荐、周刊精选 | 流量加持 |
| 线下活动 | 专家沙龙、行业分享会邀请 | 社交价值 |

### 12.6 订阅计划

| 计划 | 价格 | 权益 |
|------|------|------|
| 🆓 免费版 | ¥0/月 | 官方 Prompt + 基础功能 |
| ⭐ Pro 版 | ¥29/月 | + 社区高级 Prompt + 无限使用 |
| 💼 团队版 | ¥99/团队/月 | + 团队共享 + 协作功能 |
| 🏢 企业版 | 定制 | + 私有部署 + 专属支持 |

### 12.7 知识产权与授权协议

> ⚠️ **重要**: 必须在用户协议中明确 Prompt 的版权归属和平台使用权。

#### 核心原则

| 权利类型 | 归属 | 说明 |
|----------|------|------|
| **著作权** | 创作者保留 | Prompt 的知识产权归创作者所有 |
| **使用权** | 平台获得授权 | 用户发布即授权平台分发 |
| **商业使用权** | 按可见性区分 | 见下文详细说明 |

#### 按可见性的授权范围

| 可见性 | 平台权利 | To-B 复用 | 说明 |
|--------|---------|----------|------|
| **Private** | ❌ 无权使用 | ❌ 不可 | 仅用户自己可见，平台无权 |
| **Team** | ⚠️ 团队内使用 | ❌ 不可 | 仅限该团队，不可外传 |
| **Public (免费)** | ✅ 社区展示 | ⚠️ 需明确授权 | 可被其他用户使用，To-B 需额外授权 |
| **Public (付费)** | ✅ 商业分发 | ✅ 可 (含分成) | 用户已同意商业使用条款 |

#### 用户协议关键条款（草案）

```
1. 著作权保留
   用户创作并上传的 Prompt 模板，其知识产权归用户所有。

2. 平台使用授权
   当用户选择"公开发布"时，即视为授予平台以下权利：
   a) 展示权：在平台内向其他用户展示该 Prompt
   b) 分发权：允许其他用户使用该 Prompt
   c) 衍生权：允许其他用户 Fork 并修改该 Prompt

3. 商业使用授权
   当用户选择"付费 Prompt"时，即视为额外授予平台：
   a) 商业分发权：平台可将该 Prompt 纳入付费产品
   b) 企业许可权：平台可将该 Prompt 提供给企业版客户
   c) 用户享有按约定比例的收益分成

4. 撤回权
   a) 私有 Prompt：用户可随时删除
   b) 公开免费 Prompt：可撤回公开状态，但已 Fork 的版本不受影响
   c) 公开付费 Prompt：需提前 30 天通知平台

5. 原创声明
   用户保证上传的 Prompt 为原创或已获得必要授权。
   如因侵权产生纠纷，由用户承担相关责任。
```

#### To-B 复用策略

| 内容来源 | To-B 可用性 | 条件 |
|----------|------------|------|
| 官方内置 Prompt | ✅ 直接使用 | 平台自有 |
| 社区付费 Prompt | ✅ 可使用 | 用户已授权商业使用 |
| 社区免费 Prompt | ⚠️ 需单独授权 | 联系创作者获取商业授权 |
| 私有/团队 Prompt | ❌ 不可使用 | 用户未授权 |

#### 风险提示

> [!CAUTION]
> 1. **必须在产品上线前完成用户协议法务审核**
> 2. **免费公开 Prompt 默认不含商业授权**，To-B 使用需谨慎
> 3. **建议设立"创作者商业授权确认"流程**，在用户发布时明确询问

---

## 13. 分析案例社区

> **核心价值**: 除了 Prompt 模板（怎么分析），还需要完整的分析案例（别人怎么分析的），形成"工具+案例"双轨社区生态。

### 13.1 双轨社区生态

```
┌──────────────────────────┬───────────────────────────────┐
│   🧠 Prompt 模板库       │     📊 分析案例库              │
│   (工具层)               │     (应用层)                   │
├──────────────────────────┼───────────────────────────────┤
│ 可复用的分析方法         │ 完整的分析过程                 │
│ 抽象的模板               │ 具体的案例                     │
│ 输出: 代码/SQL           │ 输出: 洞察报告                 │
│ 价值: "怎么分析"         │ 价值: "别人怎么分析的"         │
└──────────────────────────┴───────────────────────────────┘
```

### 13.2 分析案例结构

```typescript
interface AnalysisCase {
  id: string;
  title: string;                    // "电商用户流失分析实战"
  author: Author;
  
  // 1. 数据描述
  dataset: {
    name: string;                   // "某电商平台用户行为数据"
    description: string;            // 数据背景和业务场景
    schema: ColumnInfo[];           // 列定义 (脱敏)
    source: 'uploaded' | 'demo' | 'kaggle' | 'synthetic';
  };
  
  // 2. 分析过程
  analysisFlow: AnalysisStep[];     // 分析步骤链
  
  // 3. 结论洞察
  insights: {
    summary: string;                // 核心发现 (一句话)
    keyFindings: string[];          // 关键洞察列表
    recommendations: string[];      // 业务建议
  };
  
  // 4. 复用信息
  promptsUsed: string[];            // 使用的 Prompt ID 列表
  tags: string[];                   // 行业/场景标签
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // 5. 社区互动
  stats: { views: number; likes: number; forks: number; };
  visibility: 'private' | 'team' | 'public';
}

interface AnalysisStep {
  stepNumber: number;
  title: string;                    // "Step 1: 数据概览"
  promptId?: string;                // 关联的 Prompt
  output?: { type: 'chart' | 'table' | 'text'; content: any; };
  interpretation: string;           // 作者解读
}
```

### 13.3 与 Prompt 库的联动

| 场景 | 联动方式 |
|------|---------|
| 案例 → Prompt | 案例中使用的 Prompt 可一键跳转查看/复用 |
| Prompt → 案例 | Prompt 详情页展示"使用此 Prompt 的案例" |
| Fork 案例 | 自动导入数据结构 + 关联 Prompt |
| 创作激励 | 案例使用量计入 Prompt 作者分成 |

### 13.4 案例的商业价值

| 价值点 | 说明 |
|--------|------|
| 学习资源 | 新手可以"照着做"学习分析方法 |
| 行业模板 | 电商/金融/制造的行业最佳实践 |
| Prompt 推广 | 案例是 Prompt 的"活广告" |
| 付费内容 | 高级案例可作为订阅专属内容 |
| 培训素材 | 企业培训可使用案例库 |

---

## 14. 商业愿景与 To-B 复用

> **核心洞察**: LiuliX 不仅是数据分析工具，更是 **数据分析学习社区** + **企业协作平台**。

### 14.1 产品定位演进

```
当前 (MVP)               中期 (V2-V3)              远期 (V4+)
┌─────────────┐         ┌───────────────┐        ┌──────────────────┐
│ 数据分析工具 │   →    │  分析学习社区  │   →   │ 企业数据协作平台  │
│ (to-C 个人)  │         │ (to-C + 社区) │        │ (to-B 企业级)    │
└─────────────┘         └───────────────┘        └──────────────────┘
```

### 14.2 产品矩阵

| 产品形态 | 定位 | 类比 | 目标用户 |
|----------|------|------|----------|
| **LiuliX 工具** | 数据分析瑞士军刀 | Excel + Python | 个人分析师 |
| **LiuliX 社区** | 数据分析学习平台 | Kaggle + Medium | 学习者/创作者 |
| **LiuliX 文档** | 交互式分析报告 | 飞书文档 + Colab | 团队协作 |
| **LiuliX 企业版** | 企业数据中台前端 | Dataiku + Tableau | 企业客户 |

### 14.3 To-B 复用路径

| C 端积累 | B 端价值 |
|----------|---------|
| Prompt 模板库 (500+) | 企业分析方法论库 |
| 社区案例库 (10000+) | 行业最佳实践库 |
| 活跃创作者 (100+) | 企业培训讲师资源 |
| 用户分析历史 | 企业知识库 & 经验沉淀 |
| 社区评分/排行 | 质量筛选机制 |

### 14.4 企业版核心功能

| 功能 | 说明 |
|------|------|
| **私有 Prompt 库** | 企业内部分析方法沉淀 |
| **团队协作文档** | 类似飞书文档的分析报告协作 |
| **权限管理** | 部门/项目级别的数据隔离 |
| **审计日志** | 谁看了什么数据、做了什么分析 |
| **SSO/LDAP 集成** | 企业账号体系对接 |
| **私有部署** | 数据不出企业内网 |

### 14.5 商业模式总览

```
┌─────────────────────────────────────────────────────────────┐
│                     LiuliX 商业生态                          │
├────────────────┬────────────────┬───────────────────────────┤
│   C 端工具     │   社区生态      │       B 端企业版          │
├────────────────┼────────────────┼───────────────────────────┤
│ • 免费基础版   │ • Prompt 交易   │ • 私有部署                │
│ • Pro 订阅     │ • 案例付费      │ • 按seats收费             │
│               │ • 创作者分成    │ • 培训服务                │
├────────────────┴────────────────┴───────────────────────────┤
│              核心资产: Prompt + 案例 + 用户数据              │
└─────────────────────────────────────────────────────────────┘
```

### 14.6 实施路线

| 阶段 | 产品重心 | 商业模式 |
|------|---------|---------|
| V1 (MVP) | 个人工具 | 免费 |
| V2 | + 社区分享 | 订阅制 |
| V2.5 | + 创作者经济 | 分成机制 |
| V3 | + 案例库 | 付费内容 |
| V4 | + 企业版 | To-B 销售 |
| V5+ | 完整生态 | 多元变现 |

---

*本文档是技术设计的最终版本（v1.3），后续实施时请严格遵循此方案，避免重复讨论已定事项。*

