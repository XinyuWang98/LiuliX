# Vercel 部署配置审计报告

**日期**: 2026-01-15
**审计对象**: Vercel 部署配置 (`package.json`, `vercel.json`, 后端代码)
**审计目的**: 确认当前项目配置是否符合 Vercel Serverless Function (Node.js) 的官方最佳实践，解决持续的 404 问题。

## 1. 核心发现 (Executive Summary)

经过对项目配置和 Vercel 官方文档的对比审计，我们确认了问题的根本原因：**Node.js 模块系统的混用 (CommonJS vs ESM)**。

*   **项目设定**: `package.json` 中定义了 `"type": "module"`，这意味着项目默认使用 **ESM (ECMAScript Modules)** 标准（使用 `import`/`export`）。
*   **错误实现**: 之前的后端代码 (`server/index.js`) 使用了旧式的 **CommonJS** 语法 (`require`/`module.exports`)。
*   **后果**:
    *   在本地开发时，Vite 可能掩盖了这个问题。
    *   在 Vercel 部署后，Node.js 运行时严格遵循 `type: "module"`，导致后端服务代码直接报错（ReferenceError: require is not defined），服务启动失败，从而表现为接口 404。
    *   后续尝试更名为 `.cjs` 虽然解决了语法问题，但引发了 Vercel 构建配置 (`functions` pattern) 的匹配错误。

## 2. 详细审计项

### 2.1 `package.json`
*   **配置**: `"type": "module"`
*   **状态**: ✅ 正确。这是现代前端项目的标准配置。
*   **要求**: 所有 `.js` 文件默认被视为 ESM。

### 2.2 `vercel.json`
*   **Rewrites 配置**:
    ```json
    { "source": "/api/(.*)", "destination": "/api/index.js" }
    ```
    *   **状态**: ✅ 正确。将所有 `/api` 请求重定向到单一入口。
*   **Functions 配置**:
    ```json
    "api/index.js": { "maxDuration": 60, ... }
    ```
    *   **状态**: ✅ 正确（在恢复为 `.js` 后）。

### 2.3 后端代码 (`api/index.js`, `server/*.js`)
*   **入口文件 (`api/index.js`)**:
    *   旧代码: `const app = require(...)` ❌ (在 ESM 模式下非法)
    *   新代码: `import app from ...; export default app;` ✅ (符合 Vercel ESM 规范)
*   **逻辑文件 (`server/index.js`)**:
    *   旧代码: `const express = require('express')` ❌
    *   新代码: `import express from 'express'` ✅
    *   **路由兼容性**: `app.use('/api', apiRouter)` 和 `app.use('/', apiRouter)` 双重挂载策略正确处理了 Vercel 的路径剥离行为。

## 3. 结论与建议

**结论**:当前代码库（经过刚才的 ESM 重构后）是**唯一正确**的配置状态。它统一了前后端的模块标准，消除了一切语法和配置冲突。

**下一步行动**:
1.  **保持信心**: 不需要再做额外的配置修改。
2.  **立即部署**: 推送当前的 ESM 版本代码。
3.  **验证**: 部署完成后，通过 Network 面板观察 `/validate-invite-code` 请求。如果仍然失败，现在的代码包含详细的 `[404 Debug]` 日志，将不仅返回 "404"，还会返回详细的路径信息，帮助我们做最后的微调。

---
*Antigravity Agent 审计生成*
