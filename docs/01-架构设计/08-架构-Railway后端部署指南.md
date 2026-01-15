# 08-架构-Railway后端部署指南

> [!NOTE]
> **适用场景**: Node.js 后端服务 (Express) 部署。
> **选择理由**: 相比 Vercel Serverless，Railway 提供完整的容器化环境，支持**长连接**（解决 DeepSeek 超时问题）和**WebSocket**，且配置更接近本地环境。

---

## 1. 准备工作

*   **GitHub 账号**: 拥有 `LiuliX` 仓库的访问权限。
*   **代码准备**: 确保 `server/` 目录下有 `package.json` (我们已有) 和 `index.js`。

---

## 2. Railway 部署流程

### 2.1 注册与项目创建
1.  访问 [Railway.app](https://railway.app/)。
2.  点击 **Login** -> 选择 **Login with GitHub**。
3.  登录后，点击 Dashboard右上角的 **+ New Project**。
4.  选择 **Deploy from GitHub repo**。
5.  搜索并选择 `LiuliX` 仓库。
6.  点击 **Deploy Now** (此时会先失败，因为没配置环境变量，不用慌)。

### 2.2 服务配置 (Settings)
进入项目后，点击刚刚创建的服务卡片，进入 **Settings** 标签页：

1.  **General > Root Directory**:
    *   输入: `/` (或者留空，只要 package.json 在根目录或 server 目录被正确识别)
    *   *修正*: 我们的后端逻辑在 `server/` 目录，但 `package.json` 在根目录也有。
    *   **建议**: 保持默认，Railway 会自动检测 `package.json`。

2.  **General > Build Command**:
    *   输入: `npm install` (Railway 默认会自动识别，可不填)

3.  **General > Start Command** (关键):
    *   输入: `node server/index.js`
    *   *说明*: 这是启动 Express 服务器的命令。

### 2.3 环境变量 (Variables)
点击 **Variables** 标签页，添加以下变量：

| 变量名 (Name)               | 值 (Value)                           | 说明                                                                                      |
| :-------------------------- | :----------------------------------- | :---------------------------------------------------------------------------------------- |
| `PORT`                      | `3001`                               | Railway 会动态分配端口，但建议显式声明，通常 Railway 会覆盖此值。代码中 `process.env.PORT |  | 3001` 已兼容。 |
| `DEEPSEEK_API_KEY`          | `sk-xxxxxxxx`                        | **[必须]** 您的 DeepSeek Key                                                              |
| `DEEPSEEK_API_KEY_CLEANING` | `sk-xxxxxxxx`                        | [可选] 清洗专用 Key                                                                       |
| `DEEPSEEK_API_KEY_INSIGHT`  | `sk-xxxxxxxx`                        | [可选] 洞察专用 Key                                                                       |
| `ENABLE_FREE_TRIAL_LIMIT`   | `true`                               | 开启试用限制                                                                              |
| `INVITE_CODE_TOTAL_LIMIT`   | `20`                                 | 每日限制次数                                                                              |
| `VALID_INVITE_CODES`        | `TEST666,ADMIN888`                   | 静态白名单                                                                                |
| `ALLOWED_ORIGINS`           | `https://your-vercel-app.vercel.app` | **[重要]** 允许的前端域名 (部署完前端后再回来补)                                          |

> [!TIP]
> 修改变量后，Railway 会自动重新触发部署 (Redeploy)。

### 2.4 生成域名 (Networking)
1.  点击 **Settings > Networking**。
2.  在 **Public Networking** 下，点击 **Generate Domain**。
3.  你会获得一个类似 `liulix-production.up.railway.app` 的域名。
4.  **复制这个域名**，这就是你的**后端 API 地址**。

---

## 3. 前端对接 (Vercel)

现在回到 Vercel 的前端项目配置：

1.  进入 Vercel Dashboard -> LiuliX 项目 -> **Settings > Environment Variables**。
2.  添加/修改变量：
    *   **Key**: `VITE_API_URL`
    *   **Value**: `https://liulix-production.up.railway.app` (刚才复制的域名，注意加 `https://`)
3.  **Redeploy**: 具体的 Deployment 需要重新构建才能生效 (或者在 Deployments 页面 Redeploy)。

---

## 4. 验证清单

部署完成后，按以下步骤验证：

1.  **后端健康检查**:
    *   浏览器访问: `https://liulix-production.up.railway.app/health`
    *   预期: 返回 `{"status":"ok", ...}`

2.  **前端连通性**:
    *   打开 Web 版，F12 -> Network。
    *   尝试输入邀请码或上传文件。
    *   观察请求 URL 是否为 `https://liulix-production.up.railway.app/api/...`。
    *   观察 Status 是否为 200。

---

## 5. 免费额度说明 (Pricing)
*   **Trial**: Railway 提供 $5.00 的免费试用额度（一次性）。
*   **Hobby Plan**: $5/月 (如果有 GitHub Student Pack 可通过申请获取额度)。
*   **注意**: 如果试用额度耗尽，服务会暂停。对于 MVP 演示，试用额度绰绰有余。
