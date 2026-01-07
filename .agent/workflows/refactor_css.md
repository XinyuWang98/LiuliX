---
description: 将内联样式或硬编码数值重构为 CSS 变量的标准流程
---

# 🎨 样式重构工作流 (/refactor_css)

此流程总结自 **`Refining Image Components`** 和 **`Refactor Report UI`** 对话。
在这些对话中，我们确立了“去除内联样式”和“统一 CSS 变量”的最佳实践。

## 1. 识别 (Identification)
1.  **扫描**：使用 `grep_search` 查找 `style={{` 或硬编码的颜色代码（如 `#E5E7EB`）。
2.  **定位**：确定这些样式所属的组件范围。

## 2. 变量核对 (Variable Check)
1.  **查阅字典**：检查 `src/index.css` 或 `src/variables.css`。
2.  **匹配**：
    *   是否存在含义相近的变量？(例如 `--gray-50` 或 `--border-color`)
    *   **复用优先**：如果存在，必须复用，禁止新建。
3.  **新建 (仅当必要)**：
    *   如果在现有体系中完全缺失，才在 `:root` 中定义新变量。
    *   命名必须符合语义（如 `--insight-card-min-height` 而非 `--h-200`）。

## 3. 执行重构 (Implementation)
1.  **创建/更新 CSS 文件**：
    *   如果组件没有独立的 `.css` 文件，创建一个。
    *   **禁止**使用 `styled-components` 或内联样式。
2.  **替换**：
    *   将 JSX 中的 `style={{ width: 200 }}` 替换为 `className="styles.imageContainer"`。
    *   在 CSS 中使用 `width: var(--insight-card-width);`。

## 4. 验证 (Verification)
1.  **视觉回归**：确保重构前后 UI 像素级一致。
2.  **主题测试**：(如果涉及颜色) 切换深色/浅色模式，确保变量响应正确。
