---
description: Vercel 混合应用（Vite + Express Serverless）部署与调试流程
---

# Vercel 混合应用部署 Workflow

// turbo-all

本 workflow 适用于 LiuliX 项目的 Vercel 部署，涵盖 Vite 前端 + Express Serverless Functions 的混合架构。

## 前置检查

1. 确认 `api/[...path].js` 存在且正确导出 Express app
   ```bash
   cat api/[...path].js
   # 应该看到：import app from '../server/index.js'; export default app;
   ```

2. 确认 `server/package.json` 包含 `"type": "module"`
   ```bash
   grep '"type"' server/package.json
   ```

3. 确认 `vercel.json` 配置正确
   ```bash
   cat vercel.json | grep -A5 '"rewrites"'
   # 应包含 /api/:path(.*) 到 /api/[...path] 的 rewrite
   ```

## 本地测试（强烈推荐）

4. 启动 Vercel Dev 本地测试环境
   ```bash
   vercel dev --listen 3002
   ```

5. 测试核心 API 端点
   ```bash
   # 健康检查
   curl http://localhost:3002/health
   
   # Feature Flags
   curl http://localhost:3002/api/config
   
   # 邀请码验证
   curl -X POST http://localhost:3002/api/validate-invite-code \
     -H "Content-Type: application/json" \
     -d '{"code":"TEST"}'
   
   # AI 代理（深层路径）
   curl -X POST http://localhost:3002/api/proxy/deepseek-cleaning \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"test"}]}'
   ```


6. 如果本地测试失败，检查 Terminal 中的错误日志

## Pre-deployment检查（强烈推荐）⭐

在提交并推送代码前，建议先运行 `/pre-deploy-check` workflow进行完整检查：

- ✅ Git工作区状态（无未提交文件）
- ✅ TypeScript类型检查
- ✅ 大文件检测（>100MB）
- ✅ Vercel环境变量验证
- ✅ Deployment Protection配置

**快速执行**：
```bash
# 运行 Agent workflow
/pre-deploy-check

# 或手动执行关键检查
git status --short  # 应为空
npm run type-check  # 应通过
npm run build       # 应成功
```

**如果跳过此步骤**，请至少确认：
- [ ] `git status` 无未提交的重要文件
- [ ] `npm run type-check` 通过

## 部署到 Vercel

7. 提交并推送代码
   ```bash
   git add .
   git commit -m "deploy: <描述>"
   git push
   ```


8. 检查 Vercel 构建日志
   - 访问 https://vercel.com/your-project/deployments
   - 点击最新部署 → Build Logs
   - 确认无构建错误

9. 检查 Functions 是否被检测
   - 在 Deployment Details → Functions 标签
   - 应该看到 `api/[...path]` 函数

## 部署后验证

10. 测试生产环境 API
    ```bash
    curl https://liulix.vercel.app/health
    curl https://liulix.vercel.app/api/config
    curl -X POST https://liulix.vercel.app/api/validate-invite-code \
      -H "Content-Type: application/json" \
      -d '{"code":"XINYU2026"}'
    ```

11. 检查 Runtime Logs
    - Vercel Dashboard → Logs 标签
    - 触发一次 API 请求，查看是否有日志
    - 如果无日志，说明请求没到达函数

## 常见问题排查

### 404 NOT_FOUND（Vercel 层面）
- 检查 `api/[...path].js` 文件是否存在
- 检查 `vercel.json` 的 rewrites 配置
- 深层路径（如 /api/proxy/xxx）需要 rewrite 规则

### 500 Internal Server Error
- 检查 Runtime Logs 中的错误信息
- 常见原因：
  - ESM 模块问题 → 确保 `server/package.json` 有 `"type": "module"`
  - 重复 import → 删除重复的 import 语句
  - Express 5.x 语法 → 不支持 `app.use('*', ...)`

### CORS 错误
- 检查 `server/index.js` 中的 `allowedOrigins`
- 预览部署 URL 需要正则匹配（`isVercelPreview` 函数）

### Pyodide 加载失败
- 确保使用 CDN 而非本地路径（`public/pyodide/` 不会被部署）
- 检查 `src/workers/pyodide/worker.ts` 中的 `indexURL`

## 环境变量

12. 新增环境变量时：
    - 本地：编辑 `.env.local`
    - Vercel：Dashboard → Settings → Environment Variables
    - 添加后需要**重新部署**才能生效

---

## 部署失败排查

如果部署失败或遇到问题，运行 `/fix-deployment-issue` workflow进行系统化诊断：

**常见问题快速索引**：
- Build Failed → 查看问题1（TypeScript/Import错误）
- API返回HTML → 查看问题2（Deployment Protection）
- Git Push失败 → 查看问题3（Large File）
- UI改动未生效 → 查看问题4（未提交文件/错误URL）
- 环境变量问题 → 查看问题5（环境范围设置）

**或直接运行**：
```bash
/fix-deployment-issue
```

