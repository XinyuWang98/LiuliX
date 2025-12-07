# DataPrism 开发任务清单

## 阶段一:项目初始化与核心架构 [x]
- [x] 创建 React + TypeScript 项目结构
- [x] 配置 package.json 依赖(React, TypeScript, Pyodide, Plotly.js 等)
- [x] 设置 tsconfig.json 和构建配置
- [x] 创建基础目录结构

## 阶段二:类型系统定义 [x]
- [x] 创建 `types/` 目录和核心接口
  - [x] PromptSchema 接口
  - [x] ColumnMetadata 接口
  - [x] HypothesisSchema 接口
  - [x] ThemeSchema 接口
  - [x] TransformationSchema 接口
  - [x] Project 和 File 相关接口

## 阶段三:全局样式变量系统 [x]
- [x] 创建 CSS 变量定义文件
  - [x] 颜色变量(配色方案)
  - [x] 间距系统
  - [x] 字体层级
  - [x] 按钮样式
  - [x] 图标系统
  - [x] 动画与过渡
  - [x] 进度条样式
  - [x] 圆角与阴影
- [x] 创建主题配置 JSON
- [x] 实现主题切换 Context
- [x] 实现国际化(i18n)系统
  - [x] 创建语言配置类型
  - [x] 创建中英文语言配置文件
  - [x] 实现 I18nContext 和翻译函数
  - [x] 创建语言切换器组件
  - [x] 更新所有组件移除硬编码文本
  - [x] 修复 vite.config.ts 路径别名
  - [x] 移除工具函数中的硬编码错误信息
  - [ ] 增强毛玻璃效果 (高透明度, 亮边缘, 暗夜模式优化) <!-- id: 3.1.6 -->

## 阶段四:核心基础设施 [/]
- [x] 批量文件上传功能
  - [x] 修改 FileUploader 支持 multiple 属性
  - [x] 实现批量文件解析逻辑
  - [x] 添加上传进度显示
  - [x] 实现批量大文件检测和抽样(统一比例)
  - [x] 更新语言配置文件
  - [x] 修改 LeftSidebar 回调处理
  - [x] 移除所有硬编码错误提示
- [x] 文件列表显示
  - [x] 添加文件列表状态管理
  - [x] 显示上传的文件
  - [x] 支持删除文件
  - [x] 文件点击选中功能
- [x] 文件数据预览和持久化
  - [x] 创建 DataViewer 组件
  - [x] 在 App.tsx 中集成数据预览
  - [x] 创建 IndexedDB 封装
  - [x] 保存项目数据
  - [x] 加载项目数据
- [x] 项目结构和自动命名
  - [x] 创建项目工具函数(自动命名逻辑)
  - [x] 更新项目类型定义
  - [x] 更新语言配置(国际化主题命名)
  - [x] 更新 LeftSidebar 为项目-文件层级
  - [x] 实现展开/折叠功能
  - [x] 实现项目删除功能
  - [x] 添加新增项目和上传文件按钮
  - [x] 实现项目重命名功能(双击编辑)
- [x] 侧边栏交互增强
  - [x] 左侧栏展开/收起按钮
  - [x] 右侧栏展开/收起按钮
  - [x] 左侧栏宽度拖拽调节
  - [x] 右侧栏宽度拖拽调节
- [x] Prompt 库功能(单独页面)
  - [x] 添加导航栏 Prompt 库按钮
  - [x] 创建 Prompt 库页面组件
  - [x] 创建示例 Prompt 数据
  - [x] 实现搜索和筛选功能
  - [x] 实现自动填充到 AI 交互面板(演示用)
- [x] Web Worker 架构(Pyodide 集成)
  - [x] 创建 Pyodide Web Worker
  - [x] 创建 Worker 管理器
  - [x] 实现 Python 代码执行接口
  - [x] 实现数据加载和统计功能
- [x] Prompt 库配置文件
  - [x] 创建 JSON 配置文件
  - [x] 实现配置加载器
  - [x] 支持多语言翻译
  - [x] 更新 PromptLibrary 组件使用配置
- [x] 工具函数库(数据格式化、验证等)
  - [x] fileParser.ts (文件解析)
  - [x] formatters.ts (数据格式化)

## 阶段五:核心组件开发 [/]
### 5.1 布局组件
- [x] NavigationBar(导航栏 + 主题切换器)
- [x] LeftSidebar(数据源管理 + 文件上传)
- [x] RightSidebar(智能工坊 + 证据池)
- [x] MainContent(中间核心交互区)

### 5.2 数据探索组件
- [x] FileUploader(文件上传器)
- [ ] DataEditor(数据表 + 统计信息)
- [ ] ColumnMetadataPanel(列元数据展示)
- [ ] DataCleaningPanel(清洗建议)
- [x] ProgressBar(线性流程进度条)

### 5.3 分析组件
- [ ] HypothesisPanel(假设建议)
- [ ] AnalysisDashboard(分析看板)
- [ ] CodeExecutor(代码沙盒)
- [ ] ChartRenderer(图表渲染)

### 5.4 报告组件
- [ ] EvidencePool(证据池)
- [ ] ReportEditor(Notion-style 可编辑报告)
- [ ] ReportExporter(导出功能)

### 5.5 UI 交互优化 (已完成)
- [x] ExplorationFlow 交互优化
  - [x] 聊天输入框自动调整高度 (41px 完美居中)
  - [x] 进度条步骤动画优化 (上浮式)
  - [x] 搜索栏布局修复 (防止高度跳动)
  - [x] 导航栏视图切换器简化 (单按钮)
  - [x] 提示词库导航修复
  - [x] 标题与按钮基线对齐

## 阶段六:Pyodide 集成
- [ ] Pyodide Worker 初始化
- [ ] 数据加载与解析
- [ ] 统计计算封装
- [ ] 代码执行沙盒

## 阶段七:MVP 功能实现
- [ ] 文件导入(CSV/XLSX/Parquet)
- [ ] 数据表展示 + 统计信息
- [ ] 清洗模块(3-5 种 Prompt)
- [ ] 假设生成与管理
- [ ] 分析看板基础功能
- [ ] 证据池拖拽与管理
- [ ] 报告生成与编辑
- [ ] 大文件抽样提示
- [x] 主题切换功能

## 阶段八:测试与优化
- [ ] 性能优化(大文件处理)
- [ ] 错误处理完善
- [ ] 用户体验优化
- [ ] 浏览器兼容性测试
