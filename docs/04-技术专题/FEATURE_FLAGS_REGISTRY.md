# Feature Flags 注册表

本文档记录所有 Feature Flags 的详细信息，包括创建时间、使用位置、业务价值等。

---

## 🔍 使用说明

- **状态定义**:
  - `Development` - 开发中
  - `Active` - 已启用
  - `Inactive` - 已禁用
  - `Deprecated` - 已废弃（90天后清理）

- **分类**:
  - `BACKEND_CONTROLLED` - 后端控制（通过远程配置）
  - `FRONTEND_OPTIONAL` - 前端控制（通过环境变量）

---

## AI 功能模块

### REAL_AI_INSIGHT
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: `src/services/insights/`
- **业务价值**: 启用真实 AI 洞察生成，替代 Mock 数据
- **Owner**: Backend Team
- **备注**: 等待 AI 服务接入

### REAL_AI_CLEANING
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: `src/services/cleaning/`
- **业务价值**: 启用真实 AI 清洗建议，替代 Mock 数据
- **Owner**: Backend Team
- **备注**: 等待 AI 服务接入

### AI_CHAT_PANEL
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: 暂无
- **业务价值**: AI 聊天面板功能
- **Owner**: Product Team
- **备注**: MVP 阶段未实现

### LOCAL_AI_MODEL
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: `src/services/aiService.ts`
- **业务价值**: 支持本地 AI 模型推理
- **Owner**: AI Team
- **备注**: MVP 阶段质量未达标，暂时禁用

---

## 报告导出模块

### PDF_EXPORT
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: `src/components/report/`
- **业务价值**: PDF 格式报告导出
- **Owner**: Frontend Team
- **备注**: 当前仅支持 HTML 导出

### INTERACTIVE_HTML
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: `src/components/report/`
- **业务价值**: 交互式 HTML 报告
- **Owner**: Frontend Team
- **备注**: 开发中

### AUTO_REPORT
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: `src/config/skillsConfig.ts`
- **业务价值**: 自动生成报告
- **Owner**: Product Team

---

## 数据源集成模块

### GOOGLE_SHEETS
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: 暂无
- **业务价值**: Google Sheets 数据导入
- **Owner**: Integration Team
- **备注**: 未实现

### DATABASE_CONNECT
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: 暂无
- **业务价值**: 数据库直连功能
- **Owner**: Backend Team
- **备注**: 未实现

### API_IMPORT
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: 暂无
- **业务价值**: API 数据导入
- **Owner**: Integration Team
- **备注**: 未实现

---

## 高级功能模块

### AGENT_MODE
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: 暂无
- **业务价值**: 本地 Agent 模式
- **Owner**: Product Team
- **备注**: 未实现

### ADVANCED_VIZ
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: 暂无
- **业务价值**: 高级可视化功能
- **Owner**: Frontend Team
- **备注**: 未实现

### COLLABORATION
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: 暂无
- **业务价值**: 多人协作功能
- **Owner**: Product Team
- **备注**: 未实现

### ENABLE_DRILL_DOWN_NODE_CACHE
- **分类**: BACKEND_CONTROLLED
- **状态**: Development
- **创建时间**: 2026-01-15
- **使用位置**: 
  - `src/components/insights/InsightChainFlow.tsx` (下钻触发)
  - `src/workers/pyodide/worker.ts` (Python缓存写入)
  - `src/services/insights/executor.ts` (缓存表名记录)
  - `src/services/insights/inflater.ts` (下钻卡片显示控制)
- **业务价值**: 解决下钻失败问题（父节点生成的列未持久化），提升下钻可靠性
- **降级策略**: 禁用时隐藏所有下钻卡片
- **Owner**: Catherine Wang
- **备注**: MVP开发中，预计01/18上线

---

## 实验性功能模块

### SKILLS_ARCHITECTURE
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: `src/config/skillsConfig.ts`
- **业务价值**: Skills 架构系统
- **Owner**: Architecture Team
- **备注**: 已实现，默认关闭

### PYODIDE_OFFLINE
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: 暂无
- **业务价值**: Pyodide 离线模式
- **Owner**: Performance Team
- **备注**: 未实现

### USE_AST_CODE_ENHANCER
- **分类**: BACKEND_CONTROLLED
- **状态**: Active
- **创建时间**: 2026-01-03
- **使用位置**: `src/services/prompts/guards/codeEnhancer.ts`
- **业务价值**: AST 代码增强器 v3.0
- **Owner**: AI Team
- **备注**: 默认开启，提升代码质量

---

## 系统控制模块

### ENABLE_ADVANCED_API_CONFIG
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: `src/components/settings/APISettings.tsx`
- **业务价值**: 高级 API 配置界面
- **Owner**: Product Team
- **备注**: MVP 阶段隐藏

### ENABLE_INVITE_CODE_GATE
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2025-12-01
- **使用位置**: `src/components/data/FileUploader.tsx`, `src/components/settings/APISettingsSimple.tsx`
- **业务价值**: 邀请码前置验证
- **Owner**: Growth Team
- **备注**: 开发阶段关闭，上线时开启

### ENABLE_EDA_CONTEXT_LOOP
- **分类**: BACKEND_CONTROLLED
- **状态**: Inactive
- **创建时间**: 2026-01-13
- **使用位置**: `src/contexts/InsightChainContext.tsx`
- **业务价值**: EDA 闭环与 Context 回流
- **Owner**: Product Team
- **备注**: 2026-01-14 关闭，等待进一步优化

### ENABLE_UPLOAD_ROW_LIMIT
- **分类**: BACKEND_CONTROLLED
- **状态**: Active
- **创建时间**: 2026-01-01
- **使用位置**: `src/services/duckdb/ingestion.ts`
- **业务价值**: MVP 强制限制上传文件行数 < 100万行
- **Owner**: Performance Team
- **备注**: 生产环境保护措施

---

## 📊 统计

- **总计**: 21 个 Feature Flags
- **Active**: 2 个
- **Inactive**: 18 个
- **Development**: 1 个
- **Deprecated**: 0 个

---

**最后更新**: 2026-01-15  
**维护者**: Agent + Catherine Wang
