# 10-核心-Agent协作与演进方法论

## 1. 引言

本文档旨在总结在 LiuliX 项目开发过程中，用户（User）与 Agent 通过深度协作沉淀下来的**系统性工作流**与**全局铁律**。这些规则并非凭空产生，而是在解决具体问题的过程中，从“单点突破”演进为“系统治理”的产物。

理解这些方法论的背景，有助于 Agent 更好地执行任务，并保持项目架构的长期健康。

## 2. 系统工作流的演进 (Evolution of Workflows)

以下工作流均已内置于 `.agent/workflows/` 或作为标准作业程序（SOP）存在。

### 2.1 Feature Flags 全生命周期管理
*   **触发场景**：
    *   在 Conversation `eaedb7f5` (Feature Flags Management Plan) 中，面对日益增多的 Feature Flags，出现了命名不统一、废弃 Flag 滞留代码（僵尸代码）以及手动管理易出错的问题。
*   **沉淀成果**：
    *   **Workflow**: `/new_flag` (创建), `/review_flags` (定期审查), `/cleanup_flags` (清理)。
    *   **核心思想**：Flag 不仅仅是一个布尔值，它有生命周期（Dev -> Beta -> Release -> Deprecated -> Removed）。Agent 必须负责 flag 的“生”也负责“死”。

### 2.2 CSS/UI 规范化重构体系
*   **触发场景**：
    *   在 Conversation `b12dbf48` (Refining Image Components) 和 `9840d092` (Refactor Report UI) 中，发现大量内联样式 (`style={{...}}`) 导致难以统一调整主题，且硬编码数值导致视觉不一致。
*   **沉淀成果**：
    *   **Workflow**: `/refactor_css`。
    *   **核心规则**：
        *   **零内联样式**：禁止使用 `style` 属性定义布局或装饰。
        *   **CSS 变量强制化**：所有颜色、间距、圆角必须消费 `:root` 变量（来源于 `LiuliX` 设计系统）。
    *   **价值**：保证了 LiuliX “从第一眼就感到 Premium” 的设计目标。

### 2.3 核心逻辑无头验证 (Headless Verification)
*   **触发场景**：
    *   在 Conversation `8ef6484d` (Automating Core Logic Verification) 中，为了验证后端核心逻辑（如数据加载、Prompt 生成），每次都需要启动前端、打开浏览器、点击按钮，效率极低且不稳定。
*   **沉淀成果**：
    *   **Methodology**：建立 `src/scripts/verify-core.ts`。
    *   **核心思想**：通过 Mock 浏览器环境（localStorage, window），在 Node.js 环境中直接运行前端核心逻辑代码。
    *   **价值**：将验证时间从分钟级降低到秒级，成为 `/start_task` 和 `/fix_bug` 的前置检查步骤。

## 3. 全局铁律的起源 (Origins of Global Rules)

全局规则通常诞生于惨痛的教训或对质量的极致追求。

### 3.1 防上下文丢失与文件拆分 (Rule #11, #12)
*   **起源背景**：
    *   在复杂组件（如 `InsightChain` 重构，Conversation `647fdabe`）的开发中，Agent 容易在重构长文件时意外丢失原有的逻辑细节（如 `useEffect` 依赖、特定属性透传）。
    *   文件过大（>500行）使得 Agent 的上下文窗口难以覆盖全貌，导致幻觉或遗漏。
*   **确立规则**：
    *   **500行红线**：超过即拆分，强制执行【文件拆分分析卡片】流程。
    *   **上下文完整性检查**：重构前必须输出【上下文丢失分析卡片】，确认“改动前后逻辑等价性”。

### 3.2 I18n 类型强一致性 (Rule #21)
*   **起源背景**：
    *   在 Conversation `59c967f2` (Fixing Browser Title) 及其他多语言任务中，经常出现翻译 Key 拼写错误或漏加 Key 导致页面显示 Key 字符串的情况。
*   **确立规则**：
    *   翻译文件 (`locales/`) 的变更必须同步更新 `src/types/i18n.ts`。利用 TypeScript 的类型检查来保证国际化的健壮性。

### 3.3 文档归类体系 (Rule #13)
*   **起源背景**：
    *   随着 Conversation `fe3eb595` (Documenting Report DnD Task) 等任务的进行，产生的文档散落在根目录或 haphazardly 命名，导致知识检索困难。
*   **确立规则**：
    *   建立 `6大分类` 目录结构（00-必读, 01-架构...）。
    *   强制“文档驱动开发”：先更新文档，再写代码。

## 4. 协作方法论总结

### 4.1 "Task Boundary" 驱动模式
我们不仅仅是对话，而是共同维护一个动态的**任务状态机**：
1.  **Planning Mode**: 必须先有 `implementation_plan.md`，用户确认后才动手。
2.  **Execution Mode**: 如果发现计划不可行（Unexpected Complexity），**保持 TaskName 不变**，切回 Planning 模式重新调整，而不是硬着头皮写。
3.  **Verification Mode**: 必须有 **Proof of Work** (截图、录屏、验证脚本日志)。

### 4.2 错误驱动的知识库构建
**每一次报错都是扩充知识库的机会**。
*   遇到报错 -> 输出【错误分析卡片】。
*   卡片归档至 `docs/05-项目管理/51-管理-错误日志记录.md`。
*   下次遇到类似问题，先检索该文档。

### 4.3 "Ask, Don't Guess" (不确定即询问)
*   在 Conversation `2b76410e` (Refining Notebook Toggle) 和其他 UI 调整任务中，这一原则被反复验证。
*   对于 设计决策（Design Decision）、破坏性变更（Breaking Changes）、依赖选型，Agent 必须主动询问用户偏好，而不是根据训练数据盲猜。

---
*Created by Antigravity based on analysis of project history and user interactions.*
