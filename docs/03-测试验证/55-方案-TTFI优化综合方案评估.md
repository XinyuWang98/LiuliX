# TTFI 优化方案综合评估

> **提出时间**: 2026-01-15 03:01-03:03  
> **目标**: 将 Mega 数据集 TTFI 从 47.4s 降至 20-25s  
> **优化思路**: Prompt 精简 + 分批加载 + 智能推荐策略

---

## 🎯 方案一：使用自增 ID 精简 Prompt

### 当前状态

**Prompt ID 示例**：
```
- worker-distribution-v1: 数据分布分析 (参数: column_name)
- worker-correlation-v1: 双变量相关性 (参数: col_x, col_y)
- worker-regression-v1: 线性回归 (参数: target_col, feature_cols)
```

**字符占用**：
```
21 个模板 × 约 50 字符/行 = ~1050 字符
```

### 优化方案

**使用数字 ID**：
```
- 1: 数据分布分析 (参数: column_name)
- 2: 双变量相关性 (参数: col_x, col_y)
- 3: 线性回归 (参数: target_col, feature_cols)
```

**字符节省**：
```
每行从 ~50 字符 → ~35 字符
21 个模板：节省 ~315 字符（-30%）
总 Prompt：2236 → 1920 字符（-14%）
```

**AI 响应格式**：
```json
{
  "recommendations": [
    {
      "promptId": 1,  // 数字 ID
      "params": {"column_name": "age"},
      "reason": "查看年龄分布"
    }
  ]
}
```

---

### 工程量评估

#### 核心改动文件

| 文件                    | 改动内容                       | 工作量 |
| :---------------------- | :----------------------------- | :----: |
| **promptRegistry.ts**   | 维护 ID 映射表（数字 ↔ 原 ID） |   2h   |
| **routerPrompt.zh.ts**  | 使用数字 ID 构建 Prompt        |   1h   |
| **parseRouterResponse** | 解析时转换数字 → 原 ID         |   1h   |
| **inflater.ts**         | 兼容数字 ID 查询               |  0.5h  |
| **测试脚本**            | 更新验证逻辑                   |   1h   |

**总工作量**: **5.5 小时**

---

#### 实现方案

**Step 1: 创建 ID 映射表**

```typescript
// src/services/promptRegistry.ts

export const PROMPT_ID_MAP = {
  // 基础分析 (1-9)
  1: 'worker-distribution-v1',
  2: 'worker-correlation-v1',
  3: 'worker-groupby-v1',
  4: 'worker-trend-v1',
  5: 'worker-stats-v1',
  6: 'worker-topn-v1',
  7: 'worker-missing-v1',
  8: 'worker-outlier-v1',
  9: 'worker-crosstab-v1',
  
  // 高级分析 (10-21)
  10: 'worker-cluster-v1',
  11: 'worker-dbscan-v1',
  12: 'worker-decision-tree-v1',
  13: 'worker-regression-v1',
  14: 'worker-granger-v1',
  15: 'worker-time-decomposition-v1',
  // ...
} as const;

// 反向映射
export const PROMPT_NAME_TO_ID = Object.fromEntries(
  Object.entries(PROMPT_ID_MAP).map(([id, name]) => [name, parseInt(id)])
);

// 工具函数
export function getPromptById(id: number): Prompt | undefined {
  const name = PROMPT_ID_MAP[id];
  return promptRegistry.getPrompt(name);
}
```

**Step 2: 修改 Router Prompt 构建**

```typescript
// routerPrompt.zh.ts

const promptList = l2Prompts.map((p, idx) => {
  const numId = PROMPT_NAME_TO_ID[p.id] || idx + 1;
  const params = p.inputVariables.join(', ');
  return `- ${numId}: ${p.title} (参数: ${params})`;
}).join('\n');
```

**Step 3: 修改响应解析**

```typescript
// parseRouterResponse

const parsed = JSON.parse(jsonStr);
const recommendations = (parsed.recommendations || parsed).map(rec => ({
  ...rec,
  promptId: typeof rec.promptId === 'number' 
    ? PROMPT_ID_MAP[rec.promptId]  // 数字 → 原 ID
    : rec.promptId  // 兼容旧格式
}));
```

---

### 收益与风险

**收益**：
- ✅ Prompt 减少 315 字符（-14%）
- ✅ AI 响应时间预计减少 **2-3 秒**
- ✅ AI 输出 JSON 更简洁（promptId 从 20+ 字符 → 1-2 字符）

**风险**：
- ⚠️ 需要维护映射表（未来新增模板需同步更新）
- ⚠️ 调试时数字 ID 可读性差（可通过日志映射解决）
- 🟢 向后兼容性好（解析时可兼容两种格式）

**建议**: ✅ **MVP 上线前可实施**（工作量 5.5h，收益明显）

---

## 🎯 方案二：分批加载洞察建议

### 核心思路

**第一批（常用分析）**：
- 立即加载，快速展示
- 包含：distribution, stats, correlation, groupby, trend
- 预计耗时：**8-10 秒**

**第二批（高级分析）**：
- 后台异步加载，渐进增强
- 包含：cluster, regression, decision-tree, dbscan
- 预计耗时：**6-8 秒**（并发执行）

---

### 架构设计

#### 1. Router Prompt 分批策略

```typescript
// 方案 2A: 两次独立 AI 调用（推荐）
async function loadInsights() {
  // 第一批：基础分析
  const basicPrompt = buildRouterPrompt(columns, sampleData, {
    promptFilter: 'basic'  // 只包含 1-9 号模板
  });
  
  const basicRecommendations = await invokeAI(basicPrompt);
  const basicNodes = await inflateRecommendations(basicRecommendations);
  
  // 立即展示给用户 ← TTFI 大幅缩短！
  setInsightNodes(basicNodes);
  
  // 第二批：高级分析（后台异步）
  setTimeout(async () => {
    const advancedPrompt = buildRouterPrompt(columns, sampleData, {
      promptFilter: 'advanced'  // 只包含 10-21 号模板
    });
    
    const advancedRecommendations = await invokeAI(advancedPrompt);
    const advancedNodes = await inflateRecommendations(advancedRecommendations);
    
    // 追加到现有列表
    setInsightNodes([...basicNodes, ...advancedNodes]);
  }, 100);
}
```

---

#### 2. Web Worker 分批执行

```typescript
// 第一批执行完成后，立即渲染
await executeBatchNodes(basicNodes, { priority: 'high' });

// 第二批在后台执行
executeBatchNodes(advancedNodes, { priority: 'low' }).then(() => {
  logger.log('高级分析完成');
});
```

---

### 用户体验优化

**Timeline 对比**：

**当前**（单批次）：
```
[ 等待 30s ] → [ 膨胀 1s ] → [ 执行全部 14s ] → TTFI 45s
```

**优化后**（双批次）：
```
Batch 1: [ 等待 8s ] → [ 膨胀 0.5s ] → [ 执行基础 5s ] → TTFI 13.5s ✨
Batch 2: [ 等待 6s ] → [ 膨胀 0.5s ] → [ 执行高级 9s ] → 后台完成
```

**用户感知 TTFI**：从 **45s** 降至 **13.5s**（-70%）！

---

### 工程量评估

| 改动项                         | 工作量 |
| :----------------------------- | :----: |
| Router Prompt 增加 filter 参数 |   2h   |
| loadInsights 改为两次调用      |   3h   |
| UI 支持渐进式 append           |   2h   |
| Executor 增加优先级队列        |   3h   |
| 测试和验证                     |   2h   |

**总工作量**: **12 小时**

**建议**: ✅ **强烈推荐**（用户体验提升巨大）

---

## 🎯 方案三：限制 drillHint 只推荐高级分析

### 核心约束

**修改 Router Prompt（Line 72-73）**：

```diff
## 任务要求
1. 从上述模板中选择 **3-5 个**最适合当前数据的分析
2. 为每个推荐填写具体的列名参数
- 3. (可选) 预测用户下一步可能的下钻分析
+ 3. (可选) 如果推荐了基础分析（1-9），可在 drillHint 中推荐高级分析（10-21）

⚠️ **drillHint 约束**:
- drillHint 只能推荐高级分析模板（ID: 10-21）
- 示例正确: drillHint.promptId = 10 (cluster)
- 示例错误: drillHint.promptId = 1 (distribution)
```

---

### 优势分析

**1. 符合用户认知**
- 基础分析 → 高级分析：自然的分析深化路径
- 避免"分布 → 统计"这种平级跳转

**2. 减少 AI 思考负担**
- 当前：AI 需要从 21 个模板中选 drillHint
- 优化后：只需从 12 个高级模板中选
- **预计节省 0.5-1 秒**

**3. 提升推荐质量**
- 强制 AI 推荐更有价值的深度分析
- 减少无意义的重复推荐

---

### 与方案二的协同效应

**结合分批加载**：

```
第一批（基础分析）:
  - distribution (有 drillHint → cluster)
  - correlation (有 drillHint → regression)
  - trend (有 drillHint → time-decomposition)

第二批（高级分析）:
  - cluster (作为 drillHint 被触发)
  - regression (作为 drillHint 被触发)
  - 其他高级分析
```

**优势**：
- 第一批快速展示，用户立即可见
- drillHint 自然引导到第二批
- 第二批按需加载（用户点击后才执行）

---

### 工程量评估

| 改动项                  | 工作量 |
| :---------------------- | :----: |
| 修改 Router Prompt 约束 |  0.5h  |
| 增加 drillHint 验证逻辑 |   1h   |
| 测试验证                |  0.5h  |

**总工作量**: **2 小时**

**建议**: ✅ **立即实施**（工作量极小，体验提升明显）

---

## 📊 综合优化方案

### 推荐实施顺序

**Phase 1: 快速优化（MVP 上线前）**
- ✅ **方案三：限制 drillHint**（2h，-1s）
- ✅ **方案一：数字 ID**（5.5h，-3s）

**预期效果**：
- TTFI: 47.4s → **43s**（-9%）
- 工作量：**7.5 小时**

---

**Phase 2: 体验革命（MVP 上线后）**
- ✅ **方案二：分批加载**（12h，用户感知 TTFI -70%）

**预期效果**：
- 用户感知 TTFI: 47.4s → **13.5s**（-71%）
- 总工作量：**19.5 小时**（约 2.5 工作日）

---

### 最终效果对比

| 指标          | 当前  |   Phase 1   |        Phase 2        |
| :------------ | :---: | :---------: | :-------------------: |
| Prompt 长度   | 2236  | 1920 (-14%) |      1200 (-46%)      |
| AI 响应时间   | 30.4s |     27s     | 8s (基础) + 6s (高级) |
| 用户感知 TTFI | 47.4s |     43s     |      **13.5s** ✨      |
| 开发成本      |   -   |    7.5h     |         19.5h         |

---

## ✅ 决策建议

### MVP 上线前（必做）

1. **方案三：限制 drillHint 只推荐高级分析**
   - 理由：工作量极小（2h），体验提升明显
   - 风险：无
   
2. **方案一：使用数字 ID**
   - 理由：5.5h 工作量可接受，Prompt 精简 14%
   - 风险：低（向后兼容）

### MVP 上线后（重点优化）

3. **方案二：分批加载**
   - 理由：用户体验革命性提升（TTFI -71%）
   - 优先级：⭐⭐⭐⭐⭐

---

## 🎯 立即行动计划

**今天可做**：
1. 修改 Router Prompt，限制 drillHint（30 分钟）
2. 测试验证效果（30 分钟）

**本周可做**：
3. 实施数字 ID 映射（5.5 小时）
4. 完整测试（1 小时）

**下周启动**：
5. 设计分批加载架构（2 天）
6. 实施和验证（1 天）

---

**文档生成时间**: 2026-01-15 03:03  
**预期总收益**: 用户感知 TTFI 从 47.4s → 13.5s（-71%）
