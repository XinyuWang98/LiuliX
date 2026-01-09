# 📑 LiuliX v1.0.12 系统设计与规格白皮书

**文档类型**: System Design & Specification Whitepaper
**版本状态**: MVP v1.0.12 (Hybrid Deployment + EDA Loop Ready)
**最后更新**: 2026-01-09
**结构依据**: Product Feature Matrix (Strict Alignment)

---

## 🎯 Executive Summary (管理摘要)

**LiuliX** (原 DataPrism) 是一款**隐私优先**、**本地优先**的数据探索与分析平台。v1.0.12 版本标志着架构的重大转型：确立了 **"Web 版 (资源获取) + 离线版 (隐私变现)"** 的双轮驱动战略，并实施了 **Vercel (前端) + Railway (后端)** 的混合部署架构。

### 核心价值
*   **极致隐私**: 离线版数据永不上传，Local-First 架构。
*   **混合智能**: Web 版对接云端大模型 (DeepSeek/Grok)，离线版解锁本地模型 (Qwen2.5)。
*   **闭环进化**: EDA 闭环 (EDA Loop) 让 AI 具备短期记忆，基于过往洞察生成后续建议。

---

## 1️⃣ 混合部署架构 (Hybrid Deployment)

### 1.1 部署策略 (Strategy)
*   **前端 (Vercel)**: 
    *   托管 Next.js/React 静态资源与边缘中间件。
    *   **限制**: 由于 Serverless 函数超时限制 (10s)，不支持长连接 WebSocket。
*   **后端 (Railway)**:
    *   托管 Node.js/Python 服务，提供 API 代理、Feature Flags 配置与 WebSocket 支持。
    *   **优势**: 持久化容器，支持长任务与本地模型推理 (未来扩展)。

### 1.2 模型路由 (Model Routing)
*   **Web 模式**: 强制使用 Cloud API (DeepSeek V3 / Grok Beta)，通过 Feature Flags 隐藏 API Key 配置，由系统统一鉴权。
*   **Offline 模式**: 优先尝试连接本地 Ollama/WebLLM，实现零数据出境。

---

## 2️⃣ 数据接入与处理 (Ingestion & Processing)

### 2.1 增强功能 (Enhanced Features)
*   **邀请码门槛 (Invite Gate)**:
    *   Web 版文件上传需验证邀请码 (Invite Code)。
    *   邀请码存储于 `localStorage` + `Cookie`，验证通过后解锁云端 AI 额度。
*   **列名验证增强 (Column Validation+)**:
    *   **正则提取**: `pythonColumnExtractor.ts` 智能提取代码中的列引用 (`df['col']`, `df.col`)。
    *   **占位符检测**: 自动拦截 `your_column_name`, `TODO` 等 AI 幻觉生成的占位符，阻止无效执行。

### 2.2 EDA 智能闭环 (EDA Closed Loop) [✨Experimental]
*   **Context Injector**: 将用户已采纳的洞察 (Adopted Insight) 格式化为 Context 链。
*   **Analysis Context**: 维护分析上下文状态，将 "上一轮的发现" 注入 "下一轮的 Prompt"，实现连贯的探索式分析。
*   *注: 目前由 `ENABLE_EDA_CONTEXT_LOOP` 开关控制，待拦截率优化后全量开启。*

---

## 3️⃣ 可视化与报告工作台 (Viz & Report Workbench)

### 3.1 报告工作台 (Report Workbench)
*   **沉浸式体验**: 独立的 `.rw-workbench` 容器，整合吸顶工具栏 (Sticky Toolbar)。
*   **证据托盘 (Evidence Tray)**: 侧边可折叠托盘，拖拽管理已采纳的洞察卡片。
*   **双模式切换**: 
    *   **Notebook Mode**: 代码可见，支持单元格级编辑与重运行。
    *   **Preview Mode**: 仅展示图表与结论，所见即所得 (WYSIWYG)。

### 3.2 深度审计与修复 (Deep Audit Fixes)
*   **图片 431 修复**: 全面弃用 Base64，改用 `URL.createObjectURL` (Blob URL) 处理图表图片，彻底解决 HTTP Header 过大问题。
*   **序号列对齐**: 修复 `VirtualDataGrid` 序号列 CSS 优先级问题。
*   **审计简化**: 移除单元格级繁琐审计，改为一键签名 (One-Click Sign)。

---

## 4️⃣ AI 能力与代码安全 (AI & Security)

### 4.1 代码增强 v3.0 (Code Enhancer)
*   **AST 级修复**: 抛弃脆弱的正则替换，使用 Python AST (抽象语法树) 解析代码。
*   **运行时沙盒**: 改用 `Pyodide` 沙盒环境进行预运行检测，100% 准确识别 `ModuleNotFoundError`。
*   **自动防御**: 
    *   `df.empty` 检查自动注入。
    *   `verify_columns` 列名存在性预检。

### 4.2 特征开关系统 (Feature Flags)
*   **三层配置优先级**: Remote (Railway API) > Local (localStorage) > Default (Code)。
*   **动态控制**: 支持不发版即可动态开启/关闭 `REAL_AI_INSIGHT` 或 `ENABLE_INVITE_CODE_GATE`。

---

## 5️⃣ 系统管理 (Management)

### 5.1 用户鉴权体系
*   **Auth Strategy**: MVP 阶段不强制登录，采用 "设备指纹 + 邀请码" 的轻量级鉴权。
*   **Quota Management**: 基于 Token 计数的本地通过率限制，防止 API 滥用。

### 5.2 国际化 (i18n)
*   **全覆盖**: 扩展至 `src/types/i18n.ts` 类型定义，确保 Notebook、Prompt 库、设置页无死角双语支持。

---

## 6️⃣ 附录：技术栈更新 (Tech Stack Update)

| 模块 | 原方案 (v1.0.3) | 现方案 (v1.0.12) | 原因 |
| :--- | :--- | :--- | :--- |
| **部署** | 纯静态页面 | Vercel + Railway | 需要后端提供 Config/Proxy 服务 |
| **图片** | Base64 String | Blob URL | 解决 HTTP 431 错误 |
| **代码修复** | Regex Replace | Python AST | 提高复杂代码修复成功率 |
| **状态管理** | React Context | Context + IndexedDB | 支持 DataFrame 持久化 (P2) |

---

## 7️⃣ Roadmap (路线图)

*   **v1.1 (Q1)**:
    *   HTML 报告交互性增强 (可折叠/筛选)。
    *   EDA 闭环全量上线 (拦截率 > 80%)。
*   **v1.2 (Q2)**:
    *   OPFS 文件系统持久化 (解决大文件刷新丢失问题)。
    *   SharedArrayBuffer 零拷贝优化。
*   **v1.3 (Q3)**:
    *   Google Sheets 在线数据源集成。
    *   企业级隐私规则配置化 (GDPR/CCPA)。

---

> **白皮书总结**: v1.0.12 版本在保持隐私优先的前提下，大幅增强了系统的鲁棒性与可维护性。混合部署架构解决了配置灵活性问题，而 AST v3.0 与 EDA 闭环则标志着 LiuliX 从 "工具" 向 "智能体" 的进化。
