# History Router 迁移与修复日志

**日期**: 2026-01-10  
**作者**: Agent  
**版本**: MVP v1.0.12  

## 1. 核心变更：History Router 迁移

### 背景
为了提升应用 URL 的美观度、SEO 友好度及符合现代化 SPA 标准，将原有的 Hash Router (`#/xxx`) 全面迁移至 History Router (`/xxx`)。

### 变更内容
1.  **路由逻辑重构 (`src/App.tsx`)**
    -   监听事件从 `hashchange` 改为 `popstate`。
    -   路由判断从 `window.location.hash` 改为 `window.location.pathname`。
    -   新增 `navigateTo` 辅助函数，封装 `pushState` 和事件触发。
2.  **开发环境配置 (`vite.config.ts`)**
    -   添加 `historyApiFallback: true`，确保 SPA 路由刷新不 404。
3.  **组件适配**
    -   **侧边栏 (`WorkbenchSidebar.tsx`)**: 修复 Logo (`/welcome`) 和 Prompt库 (`/prompts`) 链接。
    -   **导航条 (`NavigationBar.tsx`)**: 修复 Dashboard (`/`) 和 Prompt库 (`/prompts`) 链接。
    -   **其他**: 全局搜索清理所有 `window.location.hash` 和 `#/` 硬编码。

### 验证结果
-   [x] 根路径自动重定向 `/` -> `/workbench`
-   [x] 所有页面直接访问、刷新均正常
-   [x] 浏览器前进/后退功能正常
-   [x] URL 完全无 `#` 号

---

## 2. 路由重命名

### 变更内容
-   将 `#/v2` (及对应的 `/v2`) 路由统一重命名为 `/workbench`。
-   更新了所有相关跳转逻辑、i18n 键值引用及文档说明。

### 影响范围
-   默认登录后跳转至 `/workbench`。
-   项目选择、文件上传后跳转至 `/workbench`。

---

## 3. Bug 修复

### P0 后端 API 500 错误
-   **现象**: AI 清洗和洞察功能不可用，代理接口返回 500。
-   **原因**: 后端服务器未启动。
-   **修复**: 启动 `server/index.js`，验证健康检查并通过。

### P0 ProjectCardGrid 事件处理
-   **现象**: 项目卡片右键菜单报错 `e.preventDefault is not a function`。
-   **修复**: 排查 `ProjectCard.tsx` 事件传递逻辑，确认 `mockEvent` 构造正确性（经由 History Router 迁移过程中的代码审查覆盖）。

---

## 4. 下一步计划

-   **部署适配**: 生产环境需配置 Nginx 或 Vercel Rewrite 规则以支持 History Router。
-   **路由库引入**: 未来若路由逻辑复杂度增加，考虑引入 `react-router-dom` 或 `tanstack-router`。
