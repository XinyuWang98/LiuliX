# 03-核心-现状功能反向推演PRD (v1.0)

> **文档说明**
> 本文档由 Agent 通过读取当前 `src/` 代码库反向生成，旨在真实反映 LiuliX (DataPrism) 的 **实际已实现功能** 与 **技术逻辑**。
>
> *生成时间*: 2025-12-25
> *生成依据*: `src/components/{cleaning,insights,report}`, `src/services`, `src/hooks`

## 1. 产品概述 (Implemented Scope)

LiuliX 是一个 **Local-First** 的纯前端数据分析应用，利用 WebAssembly (DuckDB-WASM) 和 WebLLM 实现浏览器端的数据清洗与洞察，主打隐私安全与即时交互。

### 1.1 核心价值主张 (Actual)
*   **零数据出境**: 数据仅在浏览器内存与 IndexedDB 中流转。
*   **双模式 AI**: 支持云端 API (DeepSeek) 与 本地模型 (WebLLM/Qwen) 混合调度。
*   **琉璃质感 UI**: 采用 "Tech-Glazed" 视觉风格 (玻璃拟态 + 暗色科技风)。

---

## 2. 核心模块现状 (Module Breakdown)

### 2.1 数据清洗模块 (Data Cleaning)
**代码路径**: `src/components/cleaning/DataCleaner.tsx`, `useSuggestionGeneration.ts`

*   **交互逻辑**:
    *   **自动预加载 (Auto-Preload)**: 文件加载后，自动在后台触发 AI 清洗建议生成，无须用户手动点击。
    *   **双层建议体系**:
        1.  **规则建议 (Rule-based)**: 基于硬编码阈值检测缺失值 (>30%)、重复行、异常列。
        2.  **AI 建议 (AI-based)**: 异步请求 LLM，返回 `dedup`, `fill_missing`, `normalize` 等操作。
    *   **操作模式**: 用户勾选建议卡片 -> 点击 "应用选中" -> SQL 执行 -> 历史记录堆栈 (支持撤销)。

*   **技术实现**:
    *   **SQL 执行**: 所有清洗操作最终转化为 DuckDB SQL。
    *   **防抖与缓存**: 24小时内的 AI 建议会被缓存 (`analysisCache`)，通过 `AbortController` 防止并发请求竞态。

### 2.2 智能洞察模块 (Insight Analysis)
**代码路径**: `src/components/insights/InsightChainFlow.tsx`, `useInsightLoaderV2.ts`

*   **交互逻辑**:
    *   **全自动生成**: 用户进入洞察 Tab -> 自动触发 `loadInsights` -> AI 分析列特征 -> 生成假设列表。
    *   **假设卡片**: 展示 "标题", "验证方法", "相关列名" (如: P0 新增的 `columnsUsed`)。
    *   **展开详情**: 点击卡片 -> 展开洞察节点 -> 展示图表 (Chart.js) 或 代码 (Python/SQL)。
    *   **盲盒体验**: 用户无法输入假设，无法干预 Prompt，只能被动接受 AI 生成的预置假设。

*   **技术架构 (V2 Loader)**:
    *   **双模式路由**:
        *   **Local**: 检测 GPU 显存 -> WebLLM 加载 Qwen -> 本地推理。
        *   **Cloud**: 降级 -> DeepSeek API。
    *   **质量门控 (Quality Gate)**: 生成后经过 `batchValidateInsights` 评分，剔除低分洞察。
    *   **资源限制**: 强制限制最多执行 5 个洞察，大表自动截断前 50 列。

### 2.3 报告生成模块 (Reporting)
**代码路径**: `src/components/report/ReportGenerator.tsx`, `ReportSummary.tsx`

*   **交互逻辑**:
    *   **证据流 (Evidence Stream)**: 自动收集用户采纳的 Insight 和 Cleaning 记录。
    *   **气泡流展示**: 以对话气泡形式展示分析结论，包含静态图表截图。
    *   **导出能力**: 支持复制 Markdown 和导出 PDF (html2pdf)。
*   **功能限制**:
    *   **只读 (Read-Only)**: 用户无法修改报告文字，无法调整图表。
    *   **无审批流**: 不存在 "签字 (Sign-off)" 或 "锁定" 机制。

---

## 3. 数据与存储架构 (Data Architecture)

*   **数据存储**:
    *   **原始数据**: IndexedDB (存储 CSV/Excel Blob)。
    *   **运行时**: DuckDB-WASM 内存表 (`__TABLE_NAME__`)。
    *   **元数据**: `Project` 对象树 (包含 `files`, `cleaningHistory`, `insightCache`)。

*   **AI 交互协议**:
    *   **Prompt 构造**: 仅基于 `Sampled Data` (前 10 行) + `Column Stats` (DuckDB Describe)。
    *   **脱敏策略**: 具备 `auto_sanitize` 模式，敏感列自动替换为占位符。

---

## 4. UI/UX 规范 (Implemented Standards)

*   **设计语言**: "Tech-Glazed" (科技琉璃)
    *   **色彩**: 黑色背景 (#0F0F12), 霓虹强调色 (Cyan/Purple)。
    *   **组件**: 磨砂玻璃容器，微渐变边框，辉光文字。
*   **国际化**: 全面支持 `zh-CN` / `en-US`，由 `I18nContext` 驱动，无硬编码文本。

---

## 5. 关键差异点预警 (Gap Analysis Preview)

> 此部分由代码反推与原始认知对比得出

1.  **缺失的 Prompt 库**: 代码中未发现 "Prompt Library" 的动态加载逻辑，目前是硬编码的 Template 字符串。
2.  **缺失的用户交互**: 洞察模块不支持 "User Input Hypothesis" (用户输入假设)，纯粹是 AI 猜。
3.  **缺失的模型实验**: 没有发现 "Model Training" (线性回归/聚类) 的执行入口，仅限于 "EDA (探索性分析)"。

---
*本文档仅代表代码库当前 (2025-12-25) 的真实状态。*
