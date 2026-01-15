# worker-cluster-v1 列名校验失败根因分析

> **问题**: `worker-cluster-v1` Prompt 被列名校验100%拦截  
> **时间**: 2026-01-15  
> **影响**: 7次拦截，导致mega数据集只有2个洞察

---

## 🎯 问题总结

**您的猜测完全正确！** 问题**不是模板参数设置有误**，而是**列名校验时机的设计缺陷**。

---

## 📝 模板本身是正确的

### 代码逻辑

查看 `worker_cluster.zh.ts` Line 44-84:

```python
# 1. 参数输入
feature_cols = {{feature_cols}}  # 例如: ['age', 'salary', 'experience']
n_clusters = {{n_clusters}}      # 例如: 3

# 2. 数据准备
df_clean = df[feature_cols].copy()
# ... 标准化处理 ...

# 3. K-Means 聚类
kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
labels = kmeans.fit_predict(data_scaled)

# 4. ⭐ 关键：生成 Cluster 列
df['Cluster'] = labels  # ← Line 60

# 5. 可视化和总结
counts = pd.Series(labels).value_counts().to_dict()
largest_cluster = max(counts, key=counts.get)
summary = f"已将数据分为 {n_clusters} 个群体。最大群体为 Cluster {largest_cluster}..."
```

### 参数定义

```typescript
inputVariables: ['feature_cols', 'n_clusters']
```

**模板只需要两个参数**:
- `feature_cols`: 用于聚类的特征列（已存在的列）
- `n_clusters`: 聚类数量（数字）

**模板不引用 `Cluster` 列作为输入** - 它在执行时创建这个列。

---

## ❌ 真正的问题：列名校验时机

### 执行流程

```
时间线：
1. AI Router返回推荐
   ├─ promptId: 'worker-cluster-v1'
   └─ params: {feature_cols: ['age', 'salary'], n_clusters: 3}

2. inflateRecommendation() - 膨胀
   ├─ ✅ 获取模板
   ├─ ✅ 填充参数
   └─ ✅ 生成可执行代码

3. streamProcessor - 列名校验 ← 问题在这里！
   ├─ 检查 params 中的列名是否存在
   ├─ 扫描: feature_cols ✅ (age, salary 存在)
   ├─ 扫描: Cluster ❌ (不存在！)
   └─ 拦截！

4. [永远不会执行]
   └─ Python执行 → 生成 Cluster 列
```

---

## 🔍 列名校验逻辑检查

查看 `streamProcessor.ts` Line 140-172:

```typescript
// 列名校验
if (enableColumnValidation && validateColumnsExist) {
    const columnParamKeys = [
        'column_name', 'col_x', 'col_y', 
        'date_col', 'value_col', 'group_col'
    ];
    
    const paramsToValidate: Record<string, unknown> = {};
    
    for (const key of columnParamKeys) {
        if (node.params?.[key]) {
            paramsToValidate[key] = node.params[key];
        }
    }
    
    const validationResult = validateColumnsExist(paramsToValidate, validColumns);
    
    if (!validationResult.valid) {
        // ❌ 拦截！
        node.result = {
            summary: `列名校验失败: 列 ${validationResult.invalidColumns?.join(', ')} 不存在`
        };
        return node;
    }
}
```

### 问题在哪里？

**当前逻辑的假设**:
> "所有 Prompt 引用的列名都必须在数据集中已存在"

**但 worker-cluster-v1 的实际情况**:
> "我需要的特征列存在，我会生成新的 Cluster 列"

---

## 🤔 为什么会被拦截？

### 可能的原因分析

#### 假设 1: AI 返回了多余的参数

**AI 可能返回了**:
```json
{
  "promptId": "worker-cluster-v1",
  "params": {
    "feature_cols": ["age", "salary", "experience"],
    "n_clusters": 3,
    "cluster_col": "Cluster"  // ← 多余的参数？
  }
}
```

但模板只需要 `feature_cols` 和 `n_clusters`。

#### 假设 2: 列名校验扫描了代码内容

**可能的逻辑**:
```typescript
// 伪代码
const codeContent = fillTemplate(template, params);
const referencedColumns = extractColumnReferences(codeContent);
// referencedColumns = ['age', 'salary', 'experience', 'Cluster']

validateColumnsExist(referencedColumns, validColumns);
// ❌ 'Cluster' 不在 validColumns 中
```

---

## 🔬 需要确认的信息

### 关键问题

**查看实际日志**:
```
> 11:09:48.593 [AI服务] [流式处理] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster]
```

**需要回答**:
1. AI 返回的 `params` 中是否包含 `Cluster`？
2. 列名校验是扫描 `params` 还是扫描生成的代码？
3. `validateColumnsExist` 函数的具体实现是什么？

### 建议查看

1. **检查 AI 返回的原始推荐**:
   ```typescript
   // 在 Router 返回后立即打印
   logger.debug('AI返回的推荐', recommendations);
   ```

2. **检查膨胀后的节点**:
   ```typescript
   // 在 inflateRecommendation 返回后
   logger.debug('膨胀后的节点', {
     promptId: node.promptId,
     params: node.params,
     columnsReferenced: extractColumns(node.code)
   });
   ```

3. **查看 validateColumnsExist 实现**:
   需要确认它到底检查什么

---

## 💡 可能的解决方案

### 方案 A: 模板级别的元数据标记

为 Prompt 添加 `generatesColumns` 元数据:

```typescript
export const workerClusterPrompt: UserPrompt = {
    id: 'worker-cluster-v1',
    // ...
    inputVariables: ['feature_cols', 'n_clusters'],
    
    // 🆕 新增：声明会生成的列
    generatesColumns: ['Cluster'],
    
    // 🆕 新增：区分输入列和输出列
    columnRequirements: {
        input: ['feature_cols'],    // 必须已存在
        output: ['Cluster']          // 执行时生成，跳过校验
    }
};
```

**校验逻辑修改**:
```typescript
if (prompt.columnRequirements) {
    // 只校验输入列
    const inputColumns = extract(params, prompt.columnRequirements.input);
    validateColumnsExist(inputColumns, validColumns);
} else {
    // 旧逻辑
    validateColumnsExist(allParams, validColumns);
}
```

---

### 方案 B: 智能列名提取

**改进列名校验**:
```typescript
// 不要扫描生成的代码中的所有列引用
// 只校验 params 中明确的列名参数

const COLUMN_PARAM_KEYS = [
    'column_name', 'col_x', 'col_y', 
    'date_col', 'value_col', 'group_col',
    'target_col', 'numeric_col', 'category_col'
    // 不包括 'cluster_col' 等输出列
];
```

**关键**: 不要校验 `feature_cols` 的内容，因为它们应该已经被 AI 限制在有效列中。

---

### 方案 C: 禁用此 Prompt (临时)

```typescript
{
    id: 'worker-cluster-v1',
    enabled: false,
    deprecatedReason: '列名校验时机问题，暂时禁用'
}
```

**快速有效，但不是长期方案**。

---

## 🎯 推荐行动

### 立即行动（今天）

1. **确认根因**: 
   - 添加调试日志查看 AI 返回的原始 params
   - 确认 validateColumnsExist 的具体实现

2. **临时修复**:
   - 禁用 `worker-cluster-v1` (方案C)

### 短期优化（本周）

3. **实现方案B**: 改进列名校验逻辑
   - 只校验明确的列名参数
   - 区分输入列和输出列

### 长期优化（下月）

4. **实现方案A**: Prompt 元数据系统
   - 所有 Prompt 声明输入/输出列
   - 校验系统理解 Prompt 的列依赖关系

---

## 📊 预期效果

| 方案              |  开发成本  | 立即见效 | 长期价值 |
| :---------------- | :--------: | :------: | :------: |
| **A: 元数据系统** |  高 (2天)  |    ❌     |   ⭐⭐⭐    |
| **B: 智能提取**   | 中 (4小时) |    ✅     |    ⭐⭐    |
| **C: 禁用Prompt** | 低 (1分钟) |    ✅     |    ⭐     |

**建议**: C + B 组合
1. 立即禁用 (方案C)
2. 本周实现方案B
3. 未来考虑方案A

---

## 🔚 总结

**问题不是模板参数设置有误**，而是：

1. ✅ 模板本身设计正确
2. ✅ 模板会在执行时生成 `Cluster` 列
3. ❌ 列名校验在执行前进行，无法预见生成的列
4. ❌ 校验逻辑没有区分"输入列"和"输出列"

**解决方案**: 改进列名校验，使其理解 Prompt 的输入/输出列依赖关系。
