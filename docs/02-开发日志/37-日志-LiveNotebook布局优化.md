# 2026-01-04 Live Notebook 布局与交互优化

> **摘要**: 完成 Live Notebook 双栏布局优化，集成 Resize 拖拽调整笔记本宽度功能，并将切换按钮移至全局标题栏，修复了多处 CSS 布局与显示问题。

## 1. 变更背景

用户反馈在 V2 探索页面中：
1.  **Live Notebook 布局问题**: 初始版本中 Notebook 与洞察卡片重叠或布局不合理。
2.  **交互缺失**: 缺少调整宽度和便捷切换显示/隐藏的功能。
3.  **显示 Bug**: 
    - 切换按钮因 `hideTitle` 属性被意外隐藏。
    - 左侧洞察卡片下钻内容被 `overflow: hidden` 裁剪。
    - 图表区域显示不全。

## 2. 核心变更

### 2.1 Live Notebook 布局优化 (`InsightChainFlow`)

*   **双栏 Resizable 布局**: 
    - 实现了左侧「洞察树」与右侧「Live Notebook」的左右分栏。
    - 添加拖拽手柄 (`.notebook-resize-handle`)，支持用户在 25% ~ 75% 范围内调整 Notebook 宽度。
    - 状态持久化：`notebookWidthPercent` 保存至 `localStorage`。

### 2.2 切换按钮交互升级

*   **位置迁移**: 
    - 将「展开/收起 Notebook」按钮从 `InsightChainFlow` 组件内部移至 `ContentPanel` 的 `.section-header` 中。
    - **原因**: `InsightChainFlow` 在 V2 中通常以 `hideTitle={true}` 模式渲染，导致内部 Header 及其包含的按钮被隐藏。
*   **状态提升**:
    - 在 `ContentPanel` 中管理 `showNotebook` 状态。
    - 通过 props 将状态传递给 `InsightChainFlow`。

### 2.3 视觉与 CSS 修复

*   **解决裁剪问题**:
    - 修改 `.insight-split-view`，移除 `overflow: hidden` 并将 `height: 100%` 改为自适应，修复了下钻卡片被截断的问题。
    - 确保 `iframe` 和图表容器在 Resize 过程中不捕获鼠标事件 (`pointer-events: none`)。
*   **V2 风格统一**:
    - 按钮采用 Glassmorphism 风格（`background: rgba(255, 255, 255, 0.05)`），与整体设计语言保持一致。
    - 适配 Dark Mode 高对比度显示。

## 3. 文件变更清单

| 文件路径                                       | 变更类型 | 说明                                       |
| :--------------------------------------------- | :------- | :----------------------------------------- |
| `src/components/insights/InsightChainFlow.tsx` | Modify   | 添加 Resize 逻辑，接收 `showNotebook` prop |
| `src/components/insights/InsightChainFlow.css` | Modify   | 双栏布局 Flex 设置，移除 overflow 限制     |
| `src/components/exploration/ContentPanel.tsx`  | Modify   | 添加按钮到 Header，管理 Notebook 状态      |
| `src/components/exploration/ContentPanel.css`  | Modify   | 适配 Header Flex 布局，添加按钮样式        |

## 4. 验证结果

*   ✅ **布局测试**: 左右分栏正常显示，拖拽流畅无卡顿。
*   ✅ **按钮测试**: 按钮在"洞察分析"标题旁正确显示，点击可切换 Notebook 显隐。
*   ✅ **持久化测试**: 刷新页面后，Notebook 的宽度和显示状态能正确恢复。
*   ✅ **兼容性测试**: 下钻卡片和图表内容完整显示，无裁剪。
