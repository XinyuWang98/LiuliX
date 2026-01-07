# 错误分析：Router 建议图标丢失问题复盘

## 1. 问题描述
用户反馈虽然 Router 层已成功生成清洗建议（如有明确的 SQL 模板和参数），但在 UI 上这些建议仍然显示为通用的 "AI 建议"（ ✨ 图标），而不是预期的 "PROMPT"（ 🪄 图标）。这导致用户无法直观区分哪些建议是经过验证的 Router 模板，哪些是纯 AI 生成的。

## 2. 现象确认
*   **日志证据**：
    *   Router 层成功执行：`[AI清洗] Router层返回 2 条建议`
    *   Prompt ID 确认：`[AI服务] Prompt 使用: 缺失值填充（均值）` (对应 `cleaner-fill-null-mean-v1`)
    *   最终建议列表包含 6 条建议（2 Router + 4 AI）。
*   **UI 证据**：
    *   截图显示所有 6 个卡片均为 "AI 建议" 样式。
    *   卡片标题正确显示了模板生成的标题（如 "缺失值填充 (均值)"），证明数据确实来自 Router。

## 3. 根因分析 (Root Cause Analysis)

经过对代码的深度审查，发现问题的根源在于 **ID 生成规则与 UI 判断逻辑的不匹配**。

### 3.1 ID 生成逻辑 (`CleaningRouter.ts`)
在 `CleaningRouter.ts` 的 `inflateSQLTemplates` 方法中，系统为生成的建议 ID 添加了 `router-` 前缀：

```typescript
// src/services/prompts/cleaningRouter.ts (Line 258)
suggestions.push({
    id: `router-${rec.promptId}`, // 结果如: "router-cleaner-fill-null-mean-v1"
    // ...
});
```

### 3.2 UI 判断逻辑 (`SuggestionCard.tsx`)
在 `SuggestionCard.tsx` 中，判断是否为 Router 建议的逻辑如下：

```typescript
// src/components/cleaning/components/SuggestionCard.tsx
const isFromRouter = suggestion.source === 'router' || suggestion.id.startsWith('cleaner-');
```

### 3.3 判定失效原因
1.  **ID 匹配失败**：
    *   生成 ID：`router-cleaner-fill-null-mean-v1`
    *   匹配规则：`startsWith('cleaner-')`
    *   **结果**：`false` (因为以 `router-` 开头)

2.  **Source 属性失效 (次要原因)**：
    *   虽然我们在 `cleaningSuggestionService.ts` 中显式添加了 `source: 'router'`，但在经过 React 的 State 更新、去重逻辑 (`deduplicateSuggestions`) 或对象序列化传输后，该属性可能未能正确传递或被 UI 组件正确读取。
    *   由于主要依赖 ID 的 Fallback 机制失效，导致 UI 彻底无法识别 Router 来源。

## 4. 解决方案

### 方案 A：修正 UI 判断逻辑 (推荐)
更新 `SuggestionCard.tsx` 的判断条件，使其能识别 `router-` 前缀。

```typescript
// 修改前
const isFromRouter = suggestion.source === 'router' || suggestion.id.startsWith('cleaner-');

// 修改后
const isFromRouter = 
    suggestion.source === 'router' || 
    suggestion.id.startsWith('cleaner-') || 
    suggestion.id.startsWith('router-'); // 新增兼容
```

### 方案 B：统一 ID 格式
修改 `CleaningRouter.ts`，不再添加 `router-` 前缀，直接使用 `cleaner-` 开头的 ID。但这样做可能会导致与种子模板 ID 冲突（虽然在建议列表中可能不是问题，但为了区分 "模板" 和 "基于模板生成的建议实例"，保留 `router-` 前缀在架构上更清晰）。

## 5. 结论
本次 Bug 是典型的 **"生产者-消费者契约不一致"** 问题。生产者 (`CleaningRouter`) 修改了 ID 格式（添加命名空间前缀），而消费者 (`SuggestionCard`) 的校验逻辑过于僵化，未能同步适应这种变化。

**后续行动**：
1.  执行方案 A，修复 `SuggestionCard.tsx`。
2.  在 `SuggestionCard.tsx` 中添加单元测试或注释，明确 ID 格式的预期。
