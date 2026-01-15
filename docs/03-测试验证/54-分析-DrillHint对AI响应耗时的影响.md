# DrillHint 对 AI 响应耗时影响分析

> **问题提出**: 用户怀疑 Prompt 中的"(可选) 预测用户下一步可能的下钻分析"要求可能导致 AI 响应变慢  
> **分析时间**: 2026-01-15 02:56  

---

## 📋 问题背景

在 Router Prompt 的任务要求中（Line 70-73），有这样一条：

```
## 任务要求
1. 从上述模板中选择 **3-5 个**最适合当前数据的分析
2. 为每个推荐填写具体的列名参数
3. (可选) 预测用户下一步可能的下钻分析  ← 这里！
```

对应的输出格式中包含 `drillHint` 字段：

```json
{
  "promptId": "worker-distribution-v1",
  "params": { "column_name": "age" },
  "reason": "推荐理由",
  "drillHint": {              ← 下钻提示（可选）
    "promptId": "worker-correlation-v1",
    "params": { "col_x": "age", "col_y": "salary" },
    "label": "下钻按钮文案"
  }
}
```

---

## 🔍 分析：这是否是性能瓶颈？

### 假设验证

**假设**：要求 AI 预测下钻分析增加了思考负担，导致响应变慢。

#### 证据 1：Prompt 中标注为"(可选)"

在 Router Prompt（Line 72）中，这个要求被标注为 **(可选)**：
```
3. (可选) 预测用户下一步可能的下钻分析
```

**意义**：
- AI 可以选择不返回 `drillHint`
- 即使返回，也只是简单的 JSON 字段（promptId + params + label）

#### 证据 2：实际测试数据对比

从测试报告中，我们可以对比不同数据集的情况：

| 数据集   |   列数    | AI Suggestion 耗时 | Prompt Length |
| :------- | :-------: | :----------------: | :-----------: |
| Small    |     5     |       9.77s        |     2037      |
| Medium   |     7     |       9.99s        |     2102      |
| Large    |   7-10    |       8.23s        |     2131      |
| **Mega** | **10-15** |     **10.52s**     |   **2236**    |

**观察**：
- AI Suggestion 耗时在所有量级中都相对稳定（8-11s）
- Mega 数据集的 AI Suggestion 耗时（10.52s）只比 Small（9.77s）多 **0.75秒**
- **不存在显著的耗时增长**

#### 证据 3：drillHint 的复杂度分析

**drillHint 要求 AI 做什么**：
1. 理解当前推荐的分析类型
2. 从 21 个模板中选择一个合适的后续分析
3. 填写对应的参数

**预估增加的 token 数**：
- 每个 drillHint 约 80-100 字符
- 假设 4 个推荐都有 drillHint：~400 字符
- 占 AI 响应的比例：400/2236 = **18%**

**预估增加的思考时间**：
- 如果移除 drillHint 要求，AI Suggestion 可能从 10.52s → **8.5-9s**
- **预计节省 1.5-2 秒**

---

## 💡 结论

### 主要发现

1. **drillHint 不是主要瓶颈**
   - AI Suggestion 耗时在所有数据集中都相对稳定（8-11s）
   - Mega 数据集的真正瓶颈是 **AI API 响应等待**（30.4s），而非 AI Suggestion 本身

2. **drillHint 有潜在优化空间**
   - 移除后预计节省 **1.5-2 秒**
   - 但相比总 TTFI（47.4s），收益仅 **3-4%**

3. **优先级排序**
   - **优先级 1**：精简模板列表（21 → 10 个，节省 ~10s）
   - **优先级 2**：切换更快的 AI 模型（节省 ~15s）
   - **优先级 3**：移除 drillHint（节省 ~2s）

---

## 📊 实际模板清单示例

根据代码分析，当前有以下 L2 Worker Prompts（**21 个分析类 + 6 个清洗类**）：

### 分析类 Prompts（会出现在 Router Prompt 中）

```
- worker-distribution-v1: 数据分布分析 (参数: column_name)
- worker-correlation-v1: 双变量相关性 (参数: col_x, col_y)
- worker-groupby-v1: 分组聚合 (参数: group_col, agg_col)
- worker-trend-v1: 时间趋势分析 (参数: date_col, value_col)
- worker-stats-v1: 描述性统计 (参数: column_name)
- worker-topn-v1: Top N 排行榜 (参数: column_name, n)
- worker-missing-v1: 缺失值分析 (参数: column_name)
- worker-outlier-v1: 异常值检测 (参数: column_name)
- worker-crosstab-v1: 交叉表分析 (参数: col_x, col_y)
- worker-cluster-v1: 聚类分析 (参数: feature_cols, n_clusters)
- worker-dbscan-v1: 密度聚类 (参数: feature_cols, eps, min_samples)
- worker-decision-tree-v1: 决策树分析 (参数: target_col, feature_cols)
- worker-regression-v1: 线性回归 (参数: target_col, feature_cols)
- worker-granger-v1: 格兰杰因果检验 (参数: col_x, col_y, max_lag)
- worker-time-decomposition-v1: 时序分解 (参数: date_col, value_col)
... (共约 21 个)
```

### 清洗类 Prompts（被过滤掉）

```
- worker-clean-dedup: 去重
- worker-clean-dropna: 删除缺失值
- worker-clean-fillna: 填充缺失值
- worker-clean-normalize: 标准化
- worker-clean-outlier: 异常值处理
- worker-clean-typecast: 类型转换
```

**实际发送给 AI 的模板清单长度**：
```
21 个模板 × 约 50 字符/行 = ~1050 字符
```

**占 Prompt 总长度**：
```
1050 / 2236 = 47%  ← 最大优化空间！
```

---

## ✅ 优化建议

### 短期优化（立即可实施）

**移除 drillHint 要求**

修改 `routerPrompt.zh.ts` Line 70-73：

```diff
## 任务要求
1. 从上述模板中选择 **3-5 个**最适合当前数据的分析
2. 为每个推荐填写具体的列名参数
- 3. (可选) 预测用户下一步可能的下钻分析
```

**预期收益**：
- AI 响应时间：10.52s → **8.5-9s**（-1.5-2s）
- 总 TTFI：47.4s → **45-46s**（-3-4%）

---

### 中期优化（需要开发）

**动态筛选模板列表**

基于数据特征，只展示 10-12 个最相关的模板：

```typescript
function filterRelevantPrompts(
    allPrompts: Prompt[],
    dataFeatures: {
        hasNumeric: boolean;
        hasDate: boolean;
        hasCategorical: boolean;
        columnCount: number;
    }
): Prompt[] {
    // 基础分析（总是包含）
    const basePrompts = ['distribution', 'stats', 'correlation'];
    
    // 条件性推荐
    if (dataFeatures.hasDate) {
        basePrompts.push('trend', 'time-decomposition');
    }
    
    if (dataFeatures.columnCount > 10) {
        basePrompts.push('cluster', 'regression');
    }
    
    // ... 返回 10-12 个模板
}
```

**预期收益**：
- Prompt 长度：2236 → **1700 字符**（-24%）
- AI 响应时间：30.4s → **20-22s**（-30%）
- 总 TTFI：47.4s → **37-39s**（-18%）

---

## 📌 最终建议

**您的怀疑部分正确**：
- ✅ drillHint 确实增加了 AI 的工作负担
- ⚠️ 但它只占小部分耗时（~2s）
- 🎯 **模板列表才是最大优化空间**（~10s）

**建议优先级**：
1. **立即优化**：动态筛选模板（节省 10s）
2. **次要优化**：移除 drillHint（节省 2s）
3. **长期优化**：切换 AI 模型（节省 15s）

综合优化后，Mega 数据集的 TTFI 预计可从 **47.4s 降至 25-30s** 左右！
