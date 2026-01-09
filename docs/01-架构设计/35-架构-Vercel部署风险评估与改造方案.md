# 🚀 架构评估分析报告

基于您提供的部署方案（前端 Vercel + 后端 Railway），我对当前代码进行了深度扫描与评估。虽然该方案成本低且易于维护，但**当前代码存在严重架构冲突**，特别是涉及“本地大模型 (Local AI)”的功能。

---

## 🛑 核心风险 (Critical Risks)

### 1. 本地模型功能将完全失效 (P0 级风险)
*   **现状**：当前架构是 `前端 -> 后端(Node) -> 本地Ollama(localhost:11434)`。
*   **冲突**：当后端部署到 Railway (云端) 后，**它无法连接您电脑上的 Ollama**。Railway 服务器在云端，它访问 `localhost` 是访问它自己，而不是您的电脑。
*   **后果**：所有“本地模型”功能（Qwen/Llama 选择、下载、对话）将直接报错不可用。
*   **建议**：
    *   **方案 A（仅云端 AI）**：在 Web 版中**禁用/隐藏**本地模型功能，仅提供 DeepSeek (云端 API)。
    *   **方案 B（混合架构 - 复杂）**：前端判断环境，如果是 Web 版，尝试直接连接 `localhost:11434` (需用户配置 CORS)，绕过后端。但目前代码逻辑不支持。

### 2. 硬编码地址导致生产环境故障 (P1 级风险)
扫描发现多处硬编码了 `http://localhost:3001`，部署到 Vercel 后将直接连接失败：
*   `src/services/localLLMService.ts` (L10): `const API_BASE_URL = 'http://localhost:3001/api/model';`
*   `src/App.tsx` (L122): `fetch('http://localhost:3001/health', ...)`
*   `src/components/settings/components/LocalModelSelector.tsx`: 硬编码了 `/api/model/list` 和下载接口。
*   **影响**：前端上线 Vercel 后，依然尝试访问用户本地的 3001 端口，导致无法连接后端。

### 3. 数据持久化风险 (P2 级风险)
*   **用户用量统计**：`server/index.js` 中的 `userUsageCounter` 使用内存 `Map` 存储。Railway 免费版休眠/重启后，**所有用户的使用次数记录将清零**（邀请码额度、免费次数重置）。
*   **Feature Flags**：目前依赖环境变量或本地文件，Railway 上配置环境变量即可，无风险。

---

## 💡 推荐改造方案 (Refactoring Plan)

为了适配 Vercel + Railway 架构，必须执行以下改造（按优先级排序）：

### 🥇 第一阶段：生产环境适配（必须执行）
1.  **注入环境变量**：
    *   前端代码中所有 `http://localhost:3001` 必须替换为 `import.meta.env.VITE_API_URL`。
    *   Vercel 环境变量设置 `VITE_API_URL = https://your-backend.railway.app`。
2.  **CORS 安全配置**：
    *   `server/index.js` 目前允许所有来源 (`cors()`)。建议修改为仅允许 Vercel 域名（环境变量控制）。

### 🥈 第二阶段：功能降级与开关
1.  **Web 版禁用本地模型**：
    *   修改 `LocalModeSelector` 和 `localLLMService`，增加环境判断。
    *   如果是生产环境 (Vercel)，**隐藏或禁用**“本地模型”选项，提示用户“Web 版仅支持云端模型，请下载桌面版使用本地模型”。
2.  **移除/重写本地后端依赖**：
    *   `server` 端不仅做代理，还在做“模型下载”。Railway 磁盘非持久化，且下载大模型会耗尽内存/带宽。**必须禁止云端后端执行模型下载**。

### 🥉 第三阶段：数据持久化（可选）
*   如果需要严格限制“免费 5 次”，则需在 Railway 挂载 Redis 或 Postgres（Railway 提供插件），将 `userUsageCounter` 移入数据库。

---

## ✅ 最终架构建议

**混合部署（Web版 + 桌面版）**

| 平台 | 前端 | 后端 | 本地模型 (Ollama) | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **Web (Vercel)** | Vercel Hosting | Railway (只做 DeepSeek 代理) | **⛔ 不支持** (需隐藏入口) | 快速体验、分享、云端 AI |
| **Desktop (Electron)** | 本地渲染 | 本地 Node 进程 | **✅ 支持** (完美调用) | 隐私数据、本地大模型、离线使用 |

**结论**：您可以继续推进 Vercel+Railway 部署，但**必须接受 Web 版无法使用本地模型**这一事实，并做好相应的代码兼容（改造硬编码连接、隐藏本地入口）。
