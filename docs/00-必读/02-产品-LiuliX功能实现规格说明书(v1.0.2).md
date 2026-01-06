# 📑 LiuliX v1.0.3 系统设计与规格白皮书

**文档类型**: System Design & Specification Whitepaper
**版本状态**: MVP v1.0.3 (Production Ready + UI Refined)
**最后更新**: 2026-01-06
**结构依据**: Product Feature Matrix (Strict Alignment)

---

## 🎯 Executive Summary (管理摘要)

**LiuliX** (原 DataPrism) 是一款**隐私优先**、**本地优先**的数据探索与分析平台。它通过 WebAssembly 将数据栈完全下移至浏览器，结合 AI 智能辅助，提供零延迟、零风险的分析体验。

### 核心价值
*   **极致隐私**: 数据永不上传，Local-First 架构。
*   **即刻响应**: DuckDB-WASM + Pyodide 毫秒级响应。
*   **AI 协同**: "带实习生"模式，Human-in-the-loop。

---

## 1️⃣ 数据接入模块 (Data Ingestion)

### 1.1 功能规格 (Features)
*   **多格式导入**: 支持 `.csv` (自动分隔符识别) 和 `.xlsx` (Sheet 选择) 拖拽导入。
*   **大文件流式读取**: 针对 >100MB 文件采用 Chunked Stream 读取，避免浏览器崩溃。
*   **智能采样**:
    *   < 5万行: 全量加载。
    *   > 20万行: 自动建议 Top-N 采样（截取前 N 行供 AI 分析）。

### 1.2 技术实现 (Architecture)
*   **Ingestion Pipeline**: `duckdbIngestion.ts` 负责流式解析与类型推断。
*   **Excel 解析**: 使用 `xlsx` (SheetJS) 库解析，支持多 Sheet 选择。

### 1.3 深度审计 (Deep Audit)
*   **✅ 优势**: 流式加载极其稳定，支持大文件。
*   **🔧 后续开发建议**:
    - **真正的 Reservoir Sampling**: 当前采样使用 `LIMIT N`（截取前 N 行），可能导致样本偏倉。建议改为 `ORDER BY RANDOM() LIMIT N` 或 DuckDB 的 `USING SAMPLE 20%` 语法 (v1.2)。
    - **XLSX Worker 化**: 当前 Excel 解析在主线程执行，大文件可能阻塞 UI。建议迁移到 Web Worker (v1.2)。
    - **Google Sheets 导入**: 在线数据源集成 (v1.3)。

---

## 2️⃣ 数据处理模块 (Data Processing)

### 2.1 功能规格 (Features)
*   **AI 智能清洗**:
    *   自动检测缺失值、重复行、异常值。
    *   提供 5 种建议操作 (FillNA, DropDup, Typecast, Outlier, Normalize)。
*   **手动修正**: 列重命名、类型强制转换、自定义 SQL 过滤。
*   **DuckDB 引擎**: 支持标准 SQL-92 查询、窗口函数与聚合分析。

### 2.2 技术实现 (Architecture)
*   **Three-Layer Gate**: 清洗建议经过 JSON校验(L1) -> SQL安全校验(L2) -> Dry Run(L3) 三层过滤。
*   **Parallel Execution**: `validateWithDryRun` 并行执行所有建议的预演，耗时 < 2s。
*   **WASM Engine**: `DuckDBEngine` 单例管理，自动适配 `mvp`/`eh` Bundle。

### 2.3 深度审计 (Deep Audit)
*   **✅ 优势**: 零漏网之鱼的 SQL 安全校验机制；Dry Run 让用户在大数据量下敢于操作。
*   **🔧 优化**: 建议引入 Feedback Loop，记录用户采纳的清洗建议以微调 Prompt。

---

## 3️⃣ 可视化与洞察模块 (Visualization & Exploration)

### 3.1 功能规格 (Features)
*   **虚拟滚动表格**: `VirtualDataGrid` 支持百万行流畅浏览，列宽自动适配。
*   **AI 洞察链 (Insight Chain)**:
    *   可视化 "数据源 -> 转换 -> 分析 -> 结论" 节点流。
    *   自动推荐 Trend/Distribution/Correlation 等分析类型。
*   **图表系统**:
    *   **Mini Charts**: 表头直方图 (Histogram) 快速预览分布。
    *   **Matplotlib**: Python 生成静态高清大图，支持 **Blob URL** 预览与下载。
*   **沉浸式报告**: `ReportWorkbench` 提供吸顶工具栏与证据托盘，支持 Markdown/HTML 导出。
*   **欢迎页 2.0**: 全新 PPT 风格全屏布局，集成 Roadmap 与 Feedback。

### 3.2 技术实现 (Architecture)
*   **Router Mode**: `prompts/routerPrompt.ts` 使用轻量 JSON 路由意图，节省 60% Token。
*   **Blob Strategy**: 图表图片使用 `URL.createObjectURL` 替代 Base64，解决 HTTP 431 Header 过大问题。
*   **Virtualization**: `react-window` 实现 DOM 回收，内存占用恒定。

### 3.3 深度审计 (Deep Audit)
*   **✅ 优势**: Insight Chain 的节点化设计非常适合复杂分析的可追溯性；Blob URL 策略极大提升了图片性能。
*   **🔧 优化**: Report 导出 HTML 目前是单文件，建议优化样式兼容性；流式响应 (SSE) 需在 v1.1 落地。

---

## 4️⃣ AI 能力模块 (AI Capabilities)

### 4.1 功能规格 (Features)
*   **模型矩阵**:
    *   **Local**: Qwen2.5-Coder (7B/14B) 本地推理。
    *   **Cloud**: DeepSeek, Gemini, Claude, Grok。
*   **代码增强 v3.0**: 基于 Python AST 的代码审计，自动修复 `df.empty`、拦截 `import os`。
*   **AI 鉴权**: MVP 采用 "Feature Flag 隐藏 API Key + 系统自动兜底" 策略。

### 4.2 技术实现 (Architecture)
*   **Local-First Hybrid**: 优先调用本地模型 (WebLLM/Local API)，失败自动降级 Cloud API。
*   **Smart Dispatcher**: 根据 RAM/GPU 评分 (`smartModelRecommendation.ts`) 动态路由模型。
*   **AST Guard**: `codeEnhancer.ts` 解析语法树，注入 `try/catch` 防御代码，耗时 < 25ms。

### 4.3 深度审计 (Deep Audit)
*   **✅ 优势**: AST v3.0 构建了坚实的代码安全底座；本地/云端无缝切换体验极佳。
*   **🔧 优化**: Router Mode 开关建议移至 Feature Flag (v1.1)；Prompt 模板建议移入数据库 (v1.2)。

---

## 5️⃣ 安全与隐私模块 (Security & Privacy)

### 5.1 功能规格 (Features)
*   **隐私模式**: 支持 "Send Raw" (原样) 和 "Sanitized" (脱敏) 两种模式。
*   **敏感识别**: 自动检测 7 类 PII (身份证, 手机, 邮箱等)。
*   **沙箱隔离**: Python 代码在无网络权限的 Web Worker 中运行。

### 5.2 技术实现 (Architecture)
*   **Unified Sanitizer**: `unifiedDataSanitizer.ts` 统一所有 AI 请求的脱敏入口。
*   **Regex Masks**: `dataSanitizer.ts` 实现 Fine (掩码) / Coarse (统计) 粒度控制。
*   **Network-Restricted**: Worker 仅允许特定网络请求（如字体/PyPI 包加载），业务数据禁止外传。

### 5.3 深度审计 (Deep Audit)
*   **✅ 优势**: 架构上杜绝了数据外泄可能；Unified Sanitizer 保证了策略一致性。
*   **🔧 后续开发建议**:
    - **完全网络隔离** (可选): 若安全要求严格，可移除 Worker 中的 `fetch` 字体加载逻辑，改为预打包字体 (v1.2)。
    - **隐私规则配置化**: `SENSITIVE_PATTERNS` 目前硬编码，建议提取到 `config/privacyRules.json` 以支持 GDPR/CCPA (v1.3)。

---

## 6️⃣ 系统管理模块 (Management)

### 6.1 功能规格 (Features)
*   **Prompt 库**:
    *   可视化管理界面，支持 CRUD 与调试。
    *   **i18n**: 双语架构 (`zh`/`en`)，消除 Prompt 硬编码。
    *   **库配置**: 支持配置 `seaborn`, `matplotlib` 等 Python 库加载。
*   **用户设置**: 角色配置 (分析师/业务人员)，API Key 管理。
*   **免费试用**: 基于 LocalStorage 的 Token 计数与配额限制。

### 6.2 技术实现 (Architecture)
*   **I18n Architecture**: `library/category/name/*.{zh,en}.ts` 标准目录结构。
*   **IndexedDB**: `indexedDB.ts` 存储项目与文件元数据。
*   **Config**: `modelConfig.ts` 与 `featureFlags.ts` 集中管理系统行为。

### 6.3 深度审计 (Deep Audit)
*   **✅ 优势**: Prompt 系统的 i18n 设计非常灵活；配置管理清晰。
*   **🔧 优化**: 日志目前仅在控制台，建议持久化到 IndexedDB 以便诊断 (v1.2)。

---

## 7️⃣ 附录：基础设施与 UI 体系 (Foundation)

### 7.1 UI 设计体系 (Visual System)
*   **Glassmorphism**: 统一的玻璃态 CSS 变量 (`--glass-surface`, `--blur-medium`)。
*   **Layout**: 响应式网格与可折叠侧边栏 (Workbench Sidebar)。
*   **ChartImage**: 统一的图表渲染容器，解决 Layout Shift。

### 7.2 基础设施 (Infrastructure)
*   **Logger**: 结构化日志 (`[Service] Message`)。
*   **Doc Sync**: 自动化文档同步脚本。
*   **Type Safety**: 严格的 TypeScript 类型定义 (尤其 i18n key)。

---

## 8️⃣ Roadmap & 优先级 (Roadmap)
*   **v1.1 (Q1)**: 流式响应 (SSE), Router 开关解耦, 主题变量清理。
*   **v1.2 (Q2)**: OPFS 持久化, SharedArrayBuffer 零拷贝, 日志持久化。
*   **v1.3 (Q3)**: Google Sheets 集成, 隐私规则配置化, Prompt 数据库化。

---

> **白皮书总结**: 本文档严格遵循**产品功能矩阵**重构。LiuliX v1.0.3 在数据接入、处理、可视化、AI、安全、管理六大维度均达到了 MVP 预期，是一个架构严谨、隐私安全的现代化数据平台。
