# LiuliX Vercel 部署维护清单

## 日常维护要点

### 1. 环境变量管理

| 环境变量                    | 用途             | 在哪里配置       |
| --------------------------- | ---------------- | ---------------- |
| `DEEPSEEK_API_KEY_CLEANING` | 清洗 AI 服务     | Vercel Dashboard |
| `DEEPSEEK_API_KEY_INSIGHT`  | 洞察 AI 服务     | Vercel Dashboard |
| `VALID_INVITE_CODES`        | 邀请码白名单     | Vercel Dashboard |
| `ENABLE_FREE_TRIAL_LIMIT`   | 免费试用限制开关 | Vercel Dashboard |

> ⚠️ **重要**：`.env.local` 不会被 push 到 Git，Vercel 也不会读取仓库里的 `.env` 文件。必须在 Vercel Dashboard 单独配置！

---

### 2. 关键文件清单

修改以下文件时需要格外小心：

| 文件                            | 作用                | 注意事项                                   |
| ------------------------------- | ------------------- | ------------------------------------------ |
| `api/[...path].js`              | Serverless 函数入口 | 文件名不能改！Vercel 依赖此 catch-all 语法 |
| `server/index.js`               | Express 主逻辑      | 修改路由时同时更新本地和 Vercel 测试       |
| `server/package.json`           | ESM 配置            | 必须保留 `"type": "module"`                |
| `vercel.json`                   | Vercel 配置         | rewrites 顺序很重要                        |
| `src/workers/pyodide/worker.ts` | Pyodide 配置        | 必须使用 CDN，不能用本地路径               |

---

### 3. 部署前检查清单

- [ ] 本地 `npm run build` 无错误
- [ ] 本地 `vercel dev` 测试通过
- [ ] 核心 API 端点可访问：
  - [ ] `/health`
  - [ ] `/api/config`
  - [ ] `/api/validate-invite-code`
  - [ ] `/api/proxy/deepseek-cleaning`
- [ ] 新增环境变量已在 Vercel Dashboard 配置

---

### 4. 故障排查速查表

| 症状                           | 可能原因          | 解决方案                                          |
| ------------------------------ | ----------------- | ------------------------------------------------- |
| API 返回 404 (NOT_FOUND)       | Vercel 没找到函数 | 检查 `api/[...path].js` 和 `vercel.json` rewrites |
| API 返回 500 (HTML)            | 函数崩溃          | 查看 Vercel Runtime Logs                          |
| API 返回 500 (CORS error)      | Origin 不在白名单 | 更新 `server/index.js` 的 `isVercelPreview` 函数  |
| Pyodide 加载失败               | 本地文件未部署    | 使用 CDN URL，不要用 `/pyodide/`                  |
| 深层路径 404 (如 /api/proxy/*) | rewrite 规则缺失  | 添加 `/api/:path(.*)` rewrite                     |
| 邀请码验证失败                 | 环境变量未配置    | 检查 Vercel Dashboard 的 `VALID_INVITE_CODES`     |

---

### 5. Vercel 部署架构图

```
用户请求
    │
    ▼
Vercel Edge Network
    │
    ├─── /api/* ──────> api/[...path].js (Serverless Function)
    │                         │
    │                         ▼
    │                   server/index.js (Express App)
    │                         │
    │                         ├── /health
    │                         ├── /api/config
    │                         ├── /api/validate-invite-code
    │                         └── /api/proxy/deepseek-*
    │
    └─── /* (其他) ───> dist/index.html (Vite 静态文件)
```

---

### 6. 有用的命令

```bash
# 本地模拟 Vercel 环境
vercel dev --listen 3002

# 拉取 Vercel 环境变量到本地
vercel env pull

# 添加生产环境变量
vercel env add VARIABLE_NAME production

# 查看部署日志
vercel logs

# 强制重新部署（不使用缓存）
vercel --force
```

---

### 7. 定期检查项

**每周**：
- [ ] 检查 Vercel Dashboard 的错误日志
- [ ] 确认 AI API Key 额度正常

**每月**：
- [ ] 检查 Pyodide CDN 版本是否有更新
- [ ] 审查邀请码使用情况

**每次发版前**：
- [ ] 完整运行一次 E2E 测试流程
- [ ] 在预览环境验证所有功能
