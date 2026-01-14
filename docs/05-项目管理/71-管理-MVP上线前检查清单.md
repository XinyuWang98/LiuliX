# MVP 上线前检查清单

> [!IMPORTANT]
> 本文档用于记录 MVP 版本（最小可行性产品）在部署上线前必须完成的检查项、已知缺陷修复计划及关键文档链接。上线前请务必逐项确认。

## 1. 关键缺陷修复 (Critical Bug Fixes)

### 🚨 邀请码验证接口硬编码问题（已修复 ✅）
- **问题描述**: `InviteCodeModal.tsx` 中验证接口被硬编码为 `http://localhost:3001/api/validate-invite-code`。
- **影响**: 导致非本机环境（如局域网测试、生产环境部署）下无法验证邀请码，用户无法获得试用权限。
- **修复方案**: ✅ **已完成（2026-01-09）**
  - [x] 修改 `src/components/InviteCodeModal/InviteCodeModal.tsx`，移除硬编码 URL
  - [x] 修改 `src/services/localLLMService.ts`，移除硬编码 URL
  - [x] 修改 `src/App.tsx` 健康检查接口，移除硬编码 URL
  - [x] 修改 `src/components/settings/components/LocalModelSelector.tsx`，移除硬编码 URL
  - [x] 使用环境变量 `VITE_API_URL` 动态配置后端地址
  - [x] 配置后端 CORS 白名单（`server/index.js`）
  - [ ] 本地环境验证（待测试）
  - [ ] 生产构建验证（待测试）
- **相关文档**: [73-管理-API配置方案决策记录.md](./73-管理-API配置方案决策记录.md)

## 2. 功能对齐与文档 (Feature Alignment & Docs)

### � AI 鉴权策略变更 (Design)
- **关联文档**: [45-设计-AI免费试用与邀请码策略.md](../04-技术专题/45-设计-AI免费试用与邀请码策略.md)
- **检查项**:
  - [x] 确认已实现“本地 vs 内置”二选一界面 (Feature Flag 控制)。
  - [x] 确认邀请码验证链路通畅 (前端集成完成)。
  - [x] **【新增】验证 Feature Flags 后端集成** (安全加固) - *已审计 `configService.ts`，三层优先级策略实现完整。*

### 🧩 Prompt 库用户编辑功能 (Post-MVP)
- **关联文档**: [08-专题-Prompt库MVP功能设计总纲.md](file:///Users/catherinewang/Documents/GitHub/LiuliX/docs/04-技术专题/02-Prompt库/08-专题-Prompt库MVP功能设计总纲.md)
- **状态**: ⏸️ **已推迟 (Deferred)** - *经 2026-01-13 审计决定，暂不开放用户自定义编辑权限，等待上线后收集反馈。*
- **检查项**:
  - [ ] (Post-MVP) LocalStorage 注册表改造。
  - [ ] (Post-MVP) 用户编辑/克隆功能。

### �📄 欢迎页与产品介绍
- **关联文档**: [51-专题-欢迎页产品介绍升级方案.md](file:///Users/catherinewang/Documents/GitHub/LiuliX/docs/04-技术专题/51-专题-欢迎页产品介绍升级方案.md)
- **检查项**:
  - [ ] 确认欢迎页文案已更新为最新产品策略。
  - [ ] 确认欢迎页的“开始探索”等按钮链接跳转正确。
  - [ ] 确认新设计的特性展示卡片在不同屏幕尺寸下的适配性。

## 3. 常规 MVP 检查项 (General Checklist)

### 🌍 环境变量 (Environment Variables)
- [ ] **检查**: 确认所有敏感配置（API Keys, Base URLs）均通过 `.env` 文件管理，无代码硬编码。
- [ ] **动作**: 准备 `.env.production` 模板。

### 🌐 国际化 (i18n)
- [ ] **检查**: 运行全站文本扫描，确保无未翻译的中文字符串遗留。⚠️ *`aiService.ts` 中发现硬编码中文回退文本*。
- [ ] **验证**: 切换语言（中/英），检查关键路径（登录、数据导入、分析报告）文案是否完整。

### 🚀 性能与构建 (Performance & Build)
- [ ] **Console Logs**: 检查控制台并在生产构建中移除 `console.log`（保留 `console.error` 和关键 `logger`）。
- [ ] **Bundle Size**: 运行 `npm run build`，检查是否有超大 Chunk 警告，确认 Pyodide 等大文件加载策略。

### 🛡️ 错误处理 (Error Handling)
- [ ] **边界测试**: 模拟 API 失败（如断网、500错误），确认 UI 有友好提示而非白屏。
- [ ] **404 页面**: 确认访问不存在路由时显示自定义 404 页面。

---

## 4. 上线确认签字 (Sign-off)

- **前端负责人**: [ ]
- **后端/运维负责人**: [ ]
- **产品负责人**: [ ]

---

## 5. 核心架构升级 (Core Architecture Upgrade)

### 🧠 Prompt 闭环架构 (L1/L2 Split)
- **关联文档**: [125-专题-EDA闭环与Context回流方案.md](../04-技术专题/02-Prompt库/125-专题-EDA闭环与Context回流方案.md)
- **优先级**: **P0 (Critical)**
- **检查项**:
  - [ ] **Layer 1**: 实现 Context 提取器与 Router Prompt。
  - [ ] **Layer 2**: 实现 `ContextMixin` 并应用到所有执行类 Prompt。
  - [ ] **Store**: 实现全局 `AnalysisContext` 状态管理。

## 6. 核心架构专项验证 (Core Architecture Verification)

> [!WARNING]
> 本项目依赖 Local-First + WASM 架构，以下验证对于稳定性至关重要。

### 5.1 核心依赖兼容性
- [ ] **Safari/WebKit**: 在 macOS Safari 上完整跑通数据加载与 SQL 执行（检查 `SharedArrayBuffer` 兼容性）。
- [ ] **WASM 缓存**: 验证发布新版本后，浏览器缓存的 WASM 文件版本哈希是否正确更新，避免加载旧核。

### 5.2 AI 服务韧性 (Resilience)
- [ ] **鉴权回退**: 验证无邀请码或邀请码失效时的报错提示是否友好（应提示“请输入邀请码”而非 401/500 代码）。
- [ ] **流式中断**: 在 AI 生成报告/建议中途（Stream 模式）点击取消或跳转页面，确认请求被 Abort，无后台残留报错。

### 5.3 数据隐私与边界
- [ ] **隐私红线**: 抓包验证在**不开启** AI 功能时，确认没有任何业务数据（CSV 内容）被发送到后端。
- [ ] **存储配额**: 上传 50MB+ CSV，验证 IndexedDB 写满后的报错提示。
- [ ] **大文件压力**: 测试浏览器崩溃临界值（如 100万行），并在界面增加“建议最大行数”提示。
- [ ] **内存动态评估**: 实现 [55-专题-内存评估与采样策略规范.md](../04-技术专题/04-性能优化/55-专题-内存评估与采样策略规范.md) 中的 6 档策略 (代码需适配)。

### 5.4 无痕/新用户流程
- [ ] **白板启动**: 在浏览器隐身模式下打开，验证无 `localStorage` 时的引导流程及 WASM 加载 Loading 状态。
