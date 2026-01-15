# 07-架构-Vercel部署与预览环境方案 (Final)

> [!IMPORTANT]
> 本方案旨在实现 Frontend (Vite) + Backend (Express) 的 **Monorepo 一体化部署**。
> 利用 Vercel Fluid Compute 功能，将 Serverless Function 超时时间延长至 **60秒** 以上，以支持 DeepSeek API 长耗时请求。

---

## 1. 核心架构与原理

*   **Frontend**: Vite SPA，托管在 Vercel Edge Network，路由重写至 `index.html`。
*   **Backend**: Express Server，适配为 Vercel Serverless Function (`api/index.cjs`)。
*   **路由代理**: `vercel.json` 负责将 `/api/*` 请求转发给 Serverless Function。
*   **超时处理**: 通过 `functions` 配置 `maxDuration: 60`，确保不会因 AI 响应慢而 504。

---

## 2. 代码改造实施 (Code Implementation)

### 2.1 Refactor Backend (`server/index.js`)
**目标**: 使 Express App 可以被导出 (Exported)，并在被导入时不自动监听端口。

*   **修改点**:
    ```javascript
    // 自动判断环境：如果是被 require 引用（Vercel环境），则不监听端口
    if (require.main === module) {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
    module.exports = app;
    ```

### 2.2 Serverless Entry Point (`api/index.cjs`)
**目标**: 创建根目录下的 `api` 入口，这是 Vercel 默认寻找 Serverless Function 的位置标准。

*   **文件内容**:
    ```javascript
    // 直接复用 server/index.js 的逻辑
    const app = require('../server/index.js');
    module.exports = app;
    ```

### 2.3 Vercel Configuration (`vercel.json`)
**目标**: 正确路由 API 请求并**设置超时时间**。

*   **配置**:
    ```json
    {
      "rewrites": [
        { "source": "/api/(.*)", "destination": "/api/index.cjs" }
      ],
      "functions": {
        "api/index.cjs": {
          "maxDuration": 60,
          "memory": 1024
        }
      }
    }
    ```

---

## 3. 环境变量配置 (Environment Variables)

我们需要在 Vercel **Settings > Environment Variables** 配置以下字段：

| 变量名 (Key)                | 描述                         | 示例值                                 |
| :-------------------------- | :--------------------------- | :------------------------------------- |
| `DEEPSEEK_API_KEY`          | **[必须]** DeepSeek 核心密钥 | `sk-xxx`                               |
| `DEEPSEEK_API_KEY_CLEANING` | [建议] 清洗专用通道密钥      | `sk-yyy`                               |
| `DEEPSEEK_API_KEY_INSIGHT`  | [建议] 洞察专用通道密钥      | `sk-zzz`                               |
| `ENABLE_FREE_TRIAL_LIMIT`   | 启用免费试用限制             | `true`                                 |
| `INVITE_CODE_TOTAL_LIMIT`   | 邀请码每日次数上限           | `20`                                   |
| `VALID_INVITE_CODES`        | 静态白名单邀请码             | `TEST001`                              |
| `VITE_API_URL`              | 前端 API 地址                | **不填** (或填`/`，利用Vercel内部路由) |

> [!TIP]
> **关于 VITE_API_URL**: 
> 在 Vercel 内部部署时，前端请求 `/api/xxx` 会自动被 `vercel.json` rewrite 规则捕获并转发给后端。
> 因此 **生产环境不需要设置 VITE_API_URL** (留空即可)，或者设置为相对路径 `/`。

---

## 4. 部署验证流程

1.  **提交代码**: Push 包含上述修改的代码到 GitHub。
2.  **Vercel 自动构建**: Vercel 会自动检测 push 并触发 deployment。
3.  **验证**:
    *   访问 Preview URL。
    *   打开 Network 面板。
    *   执行一个 AI 清洗任务。
    *   **关键**: 观察请求即使超过 10秒 也能成功返回 (状态码 200)，而不是 504。

---

## 5. 局限性说明 (Limitations)

1.  **冷启动 (Cold Start)**: 首次请求可能会有 1-3秒 的 Node.js 启动延迟。
2.  **内存状态丢失**: 
    *   由于 Serverless 无状态，用户的 `userUsageCounter` (使用次数) 在长时间不活动后可能会重置。
    *   *MVP 阶段可接受*：因为主要目的是为了限制单日滥用，偶尔重置影响不大。
    *   *解决方案*: 后续对接 Redis (Vercel KV) 来持久化存储。
