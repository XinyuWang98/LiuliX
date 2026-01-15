# 08-手册-Vercel新手部署指南 (图文版)

> [!TIP]
> **目标**: 将 LiuliX (包含前端和后端) 一键部署到 Vercel 平台。
> **预计耗时**: 5 分钟
> **前提**: 你已经拥有 GitHub 账号，并且代码已经同步到了 GitHub 仓库。

---

## 第一步：准备 Vercel 账号

1.  打开 [https://vercel.com/signup](https://vercel.com/signup)。
2.  点击 **"Continue with GitHub"** (强烈推荐)。
3.  授权 Vercel 访问你的 GitHub 账号。

---

## 第二步：导入项目

1.  登录后，点击 Dashboard（控制台）右上角的白色按钮 **"Add New..."** -> 选择 **"Project"**。
2.  在 "Import Git Repository" 列表中，找到 **LiuliX**。
3.  点击其右侧的 **"Import"** 按钮。

*(如果没有找到，点击 "Adjust GitHub App Permissions" 链接，勾选 LiuliX 仓库并保存)*

---

## 第三步：配置项目 (最关键的一步)

在 "Configure Project" 页面，你需要填写配置：

1.  **Project Name**: 保持默认 (如 `liulix`)。
2.  **Framework**: 会自动识别为 `Vite`，**不用改**。
3.  **Root Directory**: 保持默认 `./`，**不用改**。
4.  **Environment Variables** (环境变量):
    *   点击展开这一项。
    *   我们需要填入 `.env.local` 里的关键信息。
    *   请逐条添加以下变量 (复制 Key 和 Value，点击 Add):

| Variable Name (Key)       | Value (参考值)     | 说明                               |
| :------------------------ | :----------------- | :--------------------------------- |
| `DEEPSEEK_API_KEY`        | `sk-xxxxxxxx`      | **必须**。你的 DeepSeek API 密钥。 |
| `ENABLE_FREE_TRIAL_LIMIT` | `true`             | 防止被滥用，建议开启。             |
| `INVITE_CODE_TOTAL_LIMIT` | `20`               | 每天最多允许多少次邀请码使用。     |
| `VALID_INVITE_CODES`      | `TEST001,ADMIN888` | 你设定的邀请码，逗号分隔。         |

> [!IMPORTANT]
> **不要填写** `VITE_API_URL`。
> 因为我们现在是一体化部署，前端会自动找到后端的 `/api` 接口。

---

## 第四步：开始部署

1.  检查无误后，点击大大的 **"Deploy"** 按钮。
2.  **等待 1-2 分钟**。
    *   你会看到构建日志滚动 (Building...)。
    *   如果看到满屏的五彩纸屑 (Confetti) 🎉，说明部署成功了！

---

## 第五步：验证与测试

1.  点击卡片上的 **Screenshot** (截图) 或 **Visit** 按钮，打开你的网站。
2.  **功能检查**:
    *   打开 F12 -> Network (网络)。
    *   随便上传一个 CSV 文件。
    *   点击 "智能清洗"。
    *   观察网络请求：应该有一个发往 `/api/proxy/deepseek-cleaning` 的请求。
    *   如果状态码是 **200** (绿色)，说明后端工作正常！

---

## 常见问题 (Q&A)

### Q: 部署失败了，日志说 "Command not found"?
**A**: 极大概率是 Build Command 填错了。默认的 `npm run build` 是正确的。不要手滑改动它。

### Q: 提示 504 Gateway Timeout?
**A**: 说明 AI 思考时间太长了 (超过 10s)。
*   如果你已经按我们之前的方案修改了 `vercel.json` (设置了 `maxDuration: 60`)，这不应该发生。
*   确认一下你的 Vercel 账号是否是 Hobby (免费版)。如果是旧版账号，可能未开启 Fluid Compute。新建的项目通常默认开启。

### Q: 我更新了代码，怎么更新线上？
**A**: 很简单，你只需要把代码 **Push** (推送) 到 GitHub 的 main 分支。Vercel 会自动检测到变化，并自动开始新一轮部署。无需手动操作。
