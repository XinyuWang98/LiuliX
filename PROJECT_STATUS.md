# 项目现状全景报告

## 1. 项目文件树 (src/)

```text
src/
├── App.tsx
├── main.tsx
├── config/
│   ├── modelConfig.ts          # 模型配置定义
│   └── prompts.json            # 提示词库
├── styles/
│   └── variables.css           # 全局 CSS 变量
├── themes/                     # [NEW] 主题定义
│   └── ... (theme definitions)
├── types/
│   ├── duckdb.d.ts             # DuckDB 类型定义
│   ├── exploration.ts          # 探索流类型
│   ├── i18n.ts                 # 国际化类型
│   ├── data.ts                 # [NEW] 数据结构定义
│   ├── project.ts              # 项目类型
│   └── theme.ts                # 主题类型
├── locales/
│   ├── en-US.ts
│   └── zh-CN.ts                # 中文语言包
├── contexts/
│   ├── I18nContext.tsx         # 国际化上下文
│   └── ThemeContext.tsx        # 主题上下文
├── services/
│   ├── aiService.ts            # 多模型 AI 聚合服务
│   ├── GeminiService.ts        # (旧) Gemini 服务
│   └── PyodideManager.ts       # Pyodide Python 运行时管理
├── db/
│   └── duckdbEngine.ts         # DuckDB-WASM 单例引擎
├── workers/                    # [NEW] Web Workers
│   └── pyodide/
│       └── worker.ts           # Python 运行时 Worker
├── hooks/
│   ├── useAI.ts                # AI 调用 Hook
│   └── useI18n.ts              # 国际化 Hook
├── utils/
│   ├── projectUtils.ts         # 项目管理工具
│   ├── fileParser.ts           # 文件解析工具
│   ├── indexedDB.ts            # 数据库工具
│   └── formatters.ts           # 格式化工具
└── components/
    ├── VirtualDataGrid.tsx     # [已重写] 简化分页表格组件
    ├── VirtualDataGrid.css     # [已重写] 表格样式
    ├── AIConfigModal.tsx       # AI API Key 配置弹窗
    ├── common/
    │   ├── LanguageSwitcher.tsx
    │   ├── ThemeSwitcher.tsx
    │   └── WorkflowProgressBar.tsx
    ├── cleaning/
    │   ├── DataCleaner.css         # [NEW] 清洗样式
    │   └── DataCleaner.tsx         # [NEW] 数据清洗组件
    ├── layout/
    │   ├── NavigationBar.tsx
    │   └── LeftSidebar.tsx
    ├── data/
    │   ├── DataViewer.tsx      # 数据查看器
    │   └── FileUploader.tsx    # 文件上传组件
    ├── exploration/
    │   ├── ExplorationFlow.tsx # 核心探索流容器
    └── settings/
        └── APISettings.tsx     # 设置面板
```

---

## 2. 关键技术栈

- **DuckDB-WASM**: 浏览器内 SQL 引擎（OPFS 持久化暂时禁用）
- **CSS 变量系统**: 新增 40+ 变量，支持主题切换和全局样式管理
- **i18n**: 中英双语，严格类型检查
- **Vite**: 构建工具（ESM 优先）

---

## 3. 最新变更 (2025-12-09)

### 🔧 VirtualDataGrid 重构
- **原因**: `react-window` 在 Vite/ESM 中导入失败导致应用崩溃
- **方案**: 移除依赖，实现简化的分页表格
- **特性**: 表头统计（唯一值、缺失率）、自适应列宽、统一滚动

### 📐 CSS 变量扩充
新增 40+ 变量至 `styles/variables.css`:
- Grid 系统: `--grid-min-height`, `--grid-header-z`
- 尺寸: `--fs-xxs`, `--gap-xxs`, `--btn-padding-y/x`
- 颜色: `--text-inverse`, `--border-light`, `--text-tertiary`
- 组件: `--spinner-size`, `--stat-card-min-width`

### ✅ 代码合规
- VirtualDataGrid: 硬编码字符串 → 通用翻译 (`common.loading`)
- 魔法数字 → 常量定义 (6个)
- 硬编码像素/颜色 → CSS 变量 (21处)

---

## 4. 文件变更记录 (Recent Changes)

【文件变更】+ 新增 src/components/cleaning/DataCleaner.tsx | + 新增 src/components/cleaning/DataCleaner.css | + 新增 src/config/modelConfig.ts | * 修改 src/services/aiService.ts (重构引用)
【文件变更】* 修改 src/db/duckdbEngine.ts (analyzeCSV) | * 修改 src/utils/fileParser.ts (原始文件) | * 修改 src/components/data/FileUploader.tsx (预检流程) | * 修改 src/components/data/DataViewer.tsx (Raw Ingest)
【2025-12-09】* 重写 src/components/VirtualDataGrid.tsx (移除 react-window，改分页表格) | * 重写 src/components/VirtualDataGrid.css (全面应用 CSS 变量) | * 修改 src/styles/variables.css (新增 40+ CSS 变量) | * 修改 src/locales/zh-CN.ts (恢复备份)
【2025-12-10】* 修复 src/locales/zh-CN.ts (新增 dbNotReady/opfsFailed/opfsSuccess/parseSuccess + cleaning 部分) | * 重构 src/components/settings/APISettings.tsx (移除不存在的 modelConfig 导入，直接定义 AVAILABLE_MODELS)
【2025-12-10 晚 补充】* 增强 src/types/data.ts (ColumnStats 新增 labels) | * 增强 src/db/duckdbEngine.ts (智能直方图/离散值逻辑) | * 修改 src/components/VirtualDataGrid.tsx (直方图 Tooltip 优化/区间显示/日期列格式化) | * 修改 src/components/VirtualDataGrid.css (移除图表灰色背景/优化样式) | * 修改 src/components/data/DataViewer.tsx (调整按钮布局) | * 修改 src/locales/en-US.ts (补全缺失键值) | * 更新 PRD.md (新增 MVP 交付形态)

---

## 6. MVP 进度核对 (2025-12-10)

基于 PRD v1.1 "MVP 功能切割" 与 "交付形态" 的实施情况对比：

| MVP 功能项 (PRD 7.0) | 状态 | 说明 |
| :--- | :--- | :--- |
| **1. 文件导入** | ⚠️ 部分完成 | 支持 CSV/XLSX，暂未见 Parquet 支持；大文件流式解析优化中。 |
| **2. Google Sheets 集成** | ❌ 未开始 | 核心差异化功能尚未启动。 |
| **3. 大文件处理** | 🔄 进行中 | 虚拟滚动已重构 (VirtualDataGrid)，抽样逻辑已在 DuckDBEngine 预留接口。 |
| **4. 数据表 + 统计** | ✅ **已完成** | 支持列头详细统计、直方图、智能离散值显示、类型修正 (UI层面)。 |
| **5. 清洗模块** | 🔄 进行中 | `DataCleaner` 组件框架已搭建，Python 清洗逻辑待完善。 |
| **6. 分析假设** | ❌ 未开始 | 未见 AI 生成假设相关代码。 |
| **7. Prompt 库** | ⚠️ 部分完成 | `prompts.json` 存在，但 UI 交互 (PromptLibrary) 尚未完全联动。 |
| **8. 分析看板** | ⚠️ 部分完成 | `ExplorationFlow` 框架存在，Python 图表渲染逻辑待验证。 |
| **9. 证据池** | ❌ 未开始 | 未见明确的 Evidence Pool 实现。 |
| **10. 报告页** | ❌ 未开始 | 未见 Report 模块。 |
| **11. 主题切换** | ✅ **已完成** | `ThemeContext` + CSS 变量系统完全落地，包含 Chrome 插件适配准备。 |
| **12. Chrome 插件版** | ⏳ 待发布 | `manifest.json` 已规划，代码架构已支持纯前端运行，随时可打包。 |

### 🛑 风险提示
1. **Google Sheets 集成** 是核心差异点，目前进度为 0。
2. **清洗与分析的核心 AI 闭环** (假设生成 -> 代码执行 -> 结果反馈) 尚未完全不仅。
3. **P0 级功能** (证据池、报告) 缺口较大。

### 📅 下一步建议
优先攻克 **Google Sheets 导入** 或 **AI 清洗全流程闭环**，以确保 MVP 核心价值点的落地。

