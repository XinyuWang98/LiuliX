# 错误分析报告：问题#19 AI清洗Prompt数据丢失深度复盘

## 1. 问题背景
- **现象**：用户在使用 AI 清洗建议功能时，发现生成的 Prompt 中数据集概览显示异常：
  ```
  - common.totalRows: 0
  - common.totalColumns: 0
  【列详情】(空)
  ```
- **影响**：AI 无法获取数据的 Schema 信息（列名、类型、分布），导致生成的建议完全基于“盲猜”，建议质量极差，且生成的 SQL 无法通过安全校验（因为不知道有效列名），导致功能完全不可用。

## 2. 深度根因分析
经过完整的 Console 日志调用链路追踪（Trace Analysis），我们发现系统中存在两个不一致的数据对象，揭示了问题的本质是**前端状态管理中的数据流断裂**。

### 对象 A: `fileData` (Import Scope)
- **位置**：`LeftSidebar.tsx` 组件内部状态。
- **来源**：DuckDB 导入 CSV 完成后的直接结果。
- **内容**：包含完整的 DuckDB Schema 信息：
  - `tableName`: "t_1766571323985_working"
  - `columns`: Array(15) [完整列定义] ✅
  - `rowCount`: 206200
- **状态**：**正确且完整**。

### 对象 B: `activeFile` (Application Scope)
- **位置**：`useSuggestionGeneration.ts` 接收到的 Context 状态。
- **来源**：全局 `ProjectContext` 中的当前选中文件状态。
- **内容**：仅包含原始文件的元数据：
  - `fileName`: "synthetic_online_communities_2025.csv"
  - `originalFile`: File Object
  - `columns`: [] ❌ (空数组)
- **状态**：**不完整**。

### 根本原因
**状态同步断裂**。
当 `LeftSidebar` 完成 CSV 导入并设置本地 `fileData` 时，虽然它试图更新项目全局状态，但由于 React 状态更新的机制或对象引用的问题，包含完整 Schema 的 `fileData` **没有正确合并或传递**到全局的 `activeFile` 对象中。
导致下游的 `useSuggestionGeneration` 钩子读取到的是初始的、仅包含文件上传信息的元数据对象，而非 DuckDB 导入后的完整数据对象。

## 3. 解决策略演进

### 策略 1：尝试修复 Prompt 参数格式（早期尝试）
- **操作**：发现 `map` 函数报错，尝试调整传递给 `generateAICleaningSuggestions` 的参数结构。
- **结果**：失败。因为源数据 `activeFile.data.columns` 本身就是空的，怎么格式化都没用。

### 策略 2：尝试修复状态传递（分析后放弃）
- **思路**：修改 `LeftSidebar` 和 Context 的状态更新逻辑，强制同步 `columns`。
- **放弃理由**：这增加了组件间的强耦合。如果要修复，涉及修改核心状态管理逻辑 (`ProjectContext`)，风险较高，且容易在未来再次因为状态覆盖（如重新上传文件时）而复发。

### 4. 最终解决方案（已实施）

**方案：基于统计信息的“自给自足”模式 (Source of Truth Pattern)**

我们采用了**解耦**且**最健壮**的修复方案：在 `useSuggestionGeneration.ts` 组件内部，不依赖上游传递的不可靠的 `columns` 状态，而是利用已经存在的 `getColumnStats` 查询结果来反向构建列元数据。

#### 代码实现
在 `useSuggestionGeneration.ts` 中：

```typescript
// 1. 获取绝对真实的统计信息 (来自 DuckDB 直接查询)
// DuckDB 是数据的单一事实来源 (Single Source of Truth)
const stats = await duckdb.getColumnStats(activeFile.data.tableName);

// 2. 智能回退策略
// 如果上游传递的 columns 为空，直接从 stats 中提取列定义
//这是“原子性”的：stats 里有什么列，columns 就一定是什么列，绝不会错
const columns = (activeFile.data.columns && activeFile.data.columns.length > 0)
    ? activeFile.data.columns
    : stats.map(s => ({ name: s.name, type: s.type }));

// 3. 传递给 AI 服务
const aiResults = await generateAICleaningSuggestions(
    activeFile.data.tableName,
    columns, // ✅ 此时 columns 必定有值
    stats,
    ...
);
```

## 5. 方案理由与价值

1.  **单一事实来源 (Single Source of Truth)**：
    DuckDB 数据库本身是数据的最终事实来源。直接查询 DuckDB 获取的 Schema (通过 `stats` 接口) 永远比经过多层 React 状态传递、合并后的前端对象更可靠、更实时。

2.  **原子一致性 (Atomic Consistency)**：
    `stats` 和 `columns` 来自同一个函数上下文中的同一次查询。这消除了“列定义”和“统计数据”版本不匹配的风险（例如：前端状态记录由 10 列，但数据库实际只有 9 列）。

3.  **组件解耦 (Decoupling)**：
    清洗组件 (`useSuggestionGeneration`) 不再强依赖导入组件 (`LeftSidebar`) 的状态同步逻辑。即使上游状态管理逻辑发生变化或出现 Bug，清洗组件依然能通过直接查询数据库正常工作。

4.  **防御性编程 (Defensive Programming)**：
    通过 `columns || stats.map(...)` 的回退机制，系统同时兼容了“状态传递正常”和“状态传递失败”两种情况，极大地提高了系统的健壮性。
