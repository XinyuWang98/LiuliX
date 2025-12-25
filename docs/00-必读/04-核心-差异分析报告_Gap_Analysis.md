# 04-核心-差异分析报告_Gap_Analysis (v1.2)

> **文档说明**
> 本文档基于 [03-核心-现状功能反向推演PRD](03-核心-现状功能反向推演PRD.md) 与 [02-核心-产品需求文档PRD](02-核心-产品需求文档PRD.md) 的对比分析生成。
>
> **版本更新**: 
> - v1.2 (2025-12-25): Phase 1 专家脑植入**已完成** ✅，Phase 2 交互重构**进行中**
> - v1.1: 集成用户决策（B+其他），明确了技术演进方向

## 1. 总体评估 (Executive Summary)

*   **功能完成度**: **90%** (核心闭环+Prompt库已实现)
*   **交互还原度**: **70%** (Click & Run 架构已就绪，待 UI 完全接入)
*   **架构一致性**: **85%** (Prompt Library 双层架构已落地)

**核心结论**:
LiuliX 目前是一个 **"AI 辅助 Copilot"** 雏形。已成功实现 "Local-First AI" 的技术底座（WASM/WebLLM）+ **Prompt Library 专家脑系统**。Click & Run 交互模式的后端 Hook 已就绪，待 UI 完全接入后即可体验。

**战略决策 (B+方案)**:
我们 **不追求** 全自由度的"对话框式"交互（避免复杂的上下文工程陷阱）。
改为采用 **"场景化推荐 + 点击即在" (Click & Run)** 模式：
> 核心路径：**Prompt Library (预埋专家脑)** $\rightarrow$ **Context Matching (场景匹配)** $\rightarrow$ **User Click (一键执行)**。

---

## 2. 关键差异矩阵 (Critical Gaps)

### 2.1 洞察分析模块 (Insight Analysis)

| 特性 | PRD 原设计要求 (Ideal) | 当前代码实现 (Actual) | 差异定性 | **我的决策 (Decision)** |
| :--- | :--- | :--- | :--- | :--- |
| **触发方式** | 用户输入问题/假设 + AI 推荐 | ✅ L1 推荐 + 规则层兜底 | 🟢 **已解决** | **场景化推荐**: 根据数据特征推荐 Prompt 列表 (10个L2可用) |
| **假设交互** | 用户确认变量 X/Y 及统计方法后运行 | ✅ ActionChip + DrillDownArea | 🟢 **已解决** | **点击即跑 (Click-to-Run)**: 点击具体 Prompt，系统自动执行 |
| **代码能力** | 可交互沙盒 (Traceback/Repair) | 只读展示，出错无法修复 | 🟠 **体验缺失** | **暂维持现状**: 优先解决"能不能跑"的问题 |
| **模型能力** | 支持回归/聚类等模型训练 | 仅基础统计绘图 | 🟡 **功能裁剪** | **Skill 化**: 将建模能力封装为 L2 Prompt |

### 2.2 数据清洗模块 (Data Cleaning)

| 特性 | PRD 原设计要求 (Ideal) | 当前代码实现 (Actual) | 差异定性 | **我的决策 (Decision)** |
| :--- | :--- | :--- | :--- | :--- |
| **AI 介入** | 按需调用 (Ask for help) | 自动预加载 (Auto-Preload) | 🟢 **体验优化** | **保留预加载**: 这是一个优秀的体验，保持不变。 |
| **反馈闭环** | RLHF (权重更新) | 无状态 (Stateless) | 🟡 **智能缺失** | **延迟实现**: 短期内不引入复杂的强化学习机制。 |
| **操作粒度** | 单元格级修正 | 列/表级 SQL 批处理 | 🟡 **功能裁剪** | **维持现状**: 保持对"大数据量"处理的性能优势。 |

### 2.3 报告与 Prompt 架构 (Infrastructure)

| 特性 | PRD 原设计要求 (Ideal) | 当前代码实现 (Actual) | 差异定性 | **我的决策 (Decision)** |
| :--- | :--- | :--- | :--- | :--- |
| **Prompt 库** | 动态系统 (YAML/JSON, CRUD) | ✅ PromptRegistry + 10个种子Prompt | 🟢 **已完成** | 双层架构(L1决策+L2执行)已落地 |
| **报告编辑器** | Notion-like (块级编辑) | 静态气泡流 (Chat-bubble) | 🔴 **形态偏差** | **维持气泡流**: 但需增强气泡的可操作性 |
| **技能路由** | 语义路由 (Semantic Router) | ✅ 4维标签 + hasPrompt检测 | 🟢 **已解决** | **标签路由**: 利用 Prompt Library 的 Tag 进行精准匹配 |

---

## 3. 演进路线图 (Roadmap to PRD)

### Phase 1: 专家脑植入 (Prompt Library Architecture) - ✅ **已完成 (2025-12-25)**

- [x] **Prompt Schema 定义**: `UserPrompt` 接口 (id, layer, dimensions, template, inputVariables)
- [x] **Prompt Library 实现**: `src/services/prompts/` + `PromptRegistry` 单例
- [x] **Context Injector**: `usePromptExecution` Hook (fillTemplate + 上下文继承)
- [x] **L1 质量保障策略**: 三层架构（规则→AI→兜底）+ 选择题式设计

**新增文件清单**:

| 文件 | 说明 |
|:---|:---|
| `src/types/insightTree.ts` | 森林式下钻数据结构 |
| `src/utils/l1Validator.ts` | L1 响应校验 + 规则层兜底 |
| `src/hooks/usePromptExecution.ts` | Prompt 执行 Hook |
| `src/components/insights/ActionChip.tsx` | 下钻按钮组件 |
| `src/components/insights/DrillDownArea.tsx` | 推荐区 + 自选区 |
| `src/components/insights/InsightTreeNode.tsx` | 递归树节点 |
| `src/components/insights/InsightChainFlowV2.tsx` | V2 洞察流程组件 |
| `src/services/prompts/library/l2/*.ts` | 9个 L2 执行层 Prompt |

### Phase 2: 交互重构 (Click & Run UI) - 🚧 **进行中**

- [x] **UI 组件**: `ActionChip`, `DrillDownArea`, `InsightTreeNode` 已创建
- [x] **执行 Hook**: `usePromptExecution` 已完成
- [ ] **集成测试**: `InsightChainFlowV2` 待接入实际页面验证

**UI 画面感描述**

**1. 洞察结果卡片 (Insight Card) 的变化**
*   **以前**: 一张卡片就是一张死图，看完就没了。
*   **以后**: 每张卡片底部会多出一排 **"行动胶囊" (Action Chips)**。
    *   长得像：小小的圆角按钮，带图标，例如 `[🔍 分析异常]` `[📉 看分布]`。
    *   如果有多个建议，它们会横向排列，贴在卡片底部。

**2. 整个流程 (The Flow)**
1.  **进页面**: 屏幕中间先出来一张"全局概览"卡片，告诉你数据大概长啥样。
2.  **看推荐**: 这张卡片下面挂着三个胶囊：`[🔍 分析 Price 分布]` `[📈 分析 Price vs Area]` `[❓ 探索更多]`。
3.  **点一下**: 你点了 `[🔍 分析 Price 分布]`。
4.  **出结果**: 屏幕下方 **"滋"** 地一下滑出一张新卡片，展示 Price 的直方图。
5.  **无限套娃**: 新出来的直方图卡片底下，又挂着新的胶囊（比如 `[👀 剔除异常值]`）。

**这就叫"顺藤摸瓜"，你只管点，洞察自己长出来。**

### Phase 3: 技能扩充 (Skill Expansion) - 🟢 **部分完成**

- [x] **9个 L2 Prompt**: distribution, correlation, outlier, groupby, trend, topn, missing, stats, crosstab
- [ ] **Model Skills**: 增加 "线性回归", "K-Means" 等高级分析 Skill

---

*结论: 我们不把用户当成 Prompt Engineer，而是通过预置的高质量 Prompt (专家脑)，让用户只需做"选择题"。*
