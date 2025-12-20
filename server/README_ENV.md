# 🔧 后端代理服务器配置指南

## ❌ 当前问题

后端代理服务器已启动，但出现错误：
```
[代理警告] 环境变量 DEEPSEEK_API_KEY 未设置
```

这导致代理无法转发请求到 DeepSeek API。

---

## ✅ 解决方案

### 步骤 1: 创建 `.env.local` 文件

在 `server/` 目录下创建 `.env.local` 文件（如果已存在，请编辑它）：

```bash
cd server
notepad .env.local  # Windows
# 或
nano .env.local     # Linux/Mac
```

### 步骤 2: 添加 API Key

将以下内容写入 `.env.local` 文件：

```env
# DeepSeek API Configuration
# 获取 API Key: https://platform.deepseek.com/api_keys
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 可选：其他 AI 服务的 API Key
# GEMINI_API_KEY=your_gemini_api_key_here
# CLAUDE_API_KEY=your_claude_api_key_here
```

**重要**：
- 将 `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 替换为你的真实 DeepSeek API Key
- 可以从 https://platform.deepseek.com/api_keys 获取

### 步骤 3: 重启后端服务器

保存文件后，在终端中：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run server
```

---

## 🔍 验证配置

启动后，你应该看到：

```
🚀 后端代理服务器运行于 http://localhost:3001
   - 健康检查: http://localhost:3001/health
   - 代理端点: http://localhost:3001/api/proxy
```

然后在前端测试 AI 连接应该会成功。

---

## 📝 配置文件说明

- `.env.local` - 本地环境变量（不会被 Git 跟踪）
- `.env.example` - 配置示例（可选，用于团队协作）

---

## 🚨 安全提示

⚠️ **绝对不要**将 `.env.local` 文件提交到 Git 仓库！

API Key 是敏感信息，应该保密。`.gitignore` 已经配置忽略此文件。
