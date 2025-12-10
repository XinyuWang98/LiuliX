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
├── types/
│   ├── duckdb.d.ts             # DuckDB 类型定义
│   ├── exploration.ts          # 探索流类型
│   └── i18n.ts                 # 国际化类型
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
│   └── duckdbEngine.ts         # DuckDB-WASM由于单例引擎
├── hooks/
│   └── useAI.ts                # AI 调用 Hook
├── utils/
│   ├── projectUtils.ts         # 项目管理工具
│   └── fileParsers.ts          # 文件解析工具
└── components/
    ├── VirtualDataGrid.tsx     # [已重写] 简化分页表格组件（原虚拟滚动组件）
    ├── VirtualDataGrid.css     # [已重写] 表格样式（全面应用 CSS 变量）
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
    │   ├── DataTable.tsx       # (旧) 普通表格组件
    │   ├── DataViewer.tsx      # 数据查看器 (集成 DuckDB/Pyodide 路由)
    │   └── FileUploader.tsx    # 文件上传组件
    ├── exploration/
    │   ├── ExplorationBlock.tsx
    │   └── ExplorationFlow.tsx # 核心探索流容器
    ├── prompt/
    │   └── PromptLibrary.tsx   # 提示词库界面
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
【2025-12-10 晚】* 增强 src/components/VirtualDataGrid.tsx (数据格式化+序号列+高亮选中) | * 增强 src/components/VirtualDataGrid.css (高亮样式+序号列样式) | * 修复 src/locales/en-US.ts (同步 grid/pagination 翻译键) | * 扩展 src/styles/variables.css (新增高亮色变量)

---

## 5. 当前运行状态

✅ **开发服务器**: 运行正常 (http://localhost:5173/)
✅ **编译状态**: 无错误
✅ **浏览器**: 页面正常渲染，无控制台错误
✅ **核心功能**: 
  - 文件上传 ✅
  - 数据展示 ✅  
  - DuckDB 引擎 ✅
  - Pyodide Python 运行时 ✅
  - 国际化（中英文） ✅
  - 主题切换 ✅

