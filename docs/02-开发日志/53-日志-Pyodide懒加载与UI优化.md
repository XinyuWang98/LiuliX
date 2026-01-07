# 2026-01-07 Pyodide 懒加载与 UI 体验深度优化

## 1. 核心变更摘要

本次更新主要解决了**非数据分析页面的加载性能问题**，通过从全局移除 Pyodide 初始化逻辑，实现了欢迎页与 Prompt 库的秒开体验。同时修复了邀请码门槛、国际化显示及下钻分析交互等多个 P1 级体验问题。

## 2. 详细变更内容

### ⚡ 性能优化：Pyodide 懒加载 (Lazy Loading)

**背景**：原架构在 `App.tsx` 全局初始化 Pyodide，导致访问 `/welcome` 或 `/prompts` 等轻量级页面时也需要等待 10-30 秒加载 Python 环境。

**变更**：
1.  **全局解耦**：从 `App.tsx` 移除了 `useEffect` 全局初始化逻辑及全局 `LoadingScreen`。
2.  **按需加载**：将初始化逻辑下沉至 `ExplorationFlowV2.tsx`，仅在进入工作台路由时触发。
3.  **独立组件**：提取 `LoadingScreen.tsx` 为独立组件，支持复用。
4.  **状态管理**：V2 页面内部维护 loading 状态，加载期间显示进度条，加载完成后渲染主界面。

**效果**：
-   **Welcome / Prompt Library**：加载时间 < 1s (提升 95%)
-   **V2 Workstation**：保持原有加载体验，但在首次进入时才触发下载

### 🐛 问题修复 (Bug Fixes)

#### 1. 邀请码门槛失效修复
-   **现象**：`ENABLE_INVITE_CODE_GATE: false` 配置下，用户点击上传仍被拦截。
-   **根因**：`localStorage` 中缓存了旧的 `ENABLE_INVITE_CODE_GATE: true` 配置，覆盖了代码默认值。
-   **修复**：在 `FileUploader` 初始化时添加开发环境强制重置逻辑，自动修正错误配置。

#### 2. DataViewer 国际化参数缺失
-   **现象**：英文模式下显示 "Selected Columns" 而非 "Selected 10/11"。
-   **根因**：`en-US` 翻译文件缺少 `{count}/{total}` 占位符。
-   **修复**：更新 `locales/en-US/index.ts`，对齐中文格式。

#### 3. 下钻卡片代码展示修复
-   **现象**：点击下钻推荐卡片，Live Notebook 不显示对应 Python 代码。
-   **根因**：`resolvedCodes` 生成逻辑仅遍历了顶层 `insightNodes`，漏掉了 `children` 属性中的下钻子节点。
-   **修复**：引入 `flattenNodes` 递归函数，展平所有层级节点，确保子节点代码正确传递给 LiveNotebookPanel。

### 🎨 UI/UX 微调

-   **DataViewer**：列选择器样式微调。
-   **DrillDownRecommendationCard**：优化卡片交互反馈。

## 3. 技术债务清理

-   [x] 移除 App.tsx 中不必要的全局状态
-   [x] 清理 LandingPage 无效的 console.log
-   [x] 规范化 i18n 键值对

## 4. 遗留/待办

-   `code-step-label` 标题格式优化：需改为 `stepX+L0/L1...` 格式（用户推迟至明日）。
