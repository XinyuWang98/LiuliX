# LiuliX Community Discord 设置与运营手册

## 📖 文档概览
本文档旨在指导 LiuliX 官方 Discord 社区的搭建与运营。目标是打造一个活跃、专业且能有效反哺产品的技术社区，同时利用 Discord 作为用户来源追踪和“每日邀请码”分发的关键枢纽。

---

## 🏗️ 第一阶段：基础架构设置

### 1. 身份组体系 (Roles)
通过身份组区分用户属性，便于精准运营。

| 身份组名称        | 颜色建议 | 权限/用途                       | 获取方式            |
| :---------------- | :------- | :------------------------------ | :------------------ |
| **Team LiuliX**   | 🔴 红色   | 管理员，全权管理                | 官方团队            |
| **Contributor**   | 🟢 绿色   | 代码贡献者，可访问内部开发频道  | GitHub PR 合并者    |
| **Analyst**       | 🔵 蓝色   | 数据分析师，Python/SQL 熟练用户 | Onboarding 问卷自选 |
| **Business User** | 🟡 黄色   | 业务用户，关注图表和报告        | Onboarding 问卷自选 |
| **Bug Hunter**    | 🟣 紫色   | 荣誉身份，优先体验新功能        | 提交有效 Bug        |
| **Bot**           | ⚪️ 灰色   | 机器人                          | 自动分配            |

### 2. 频道结构设计 (Channels)
精简频道数量，聚焦核心价值。建议开启 **Community** 功能以获得 Forum 频道支持。

#### 📢 Category: START HERE (只读/公告)
#### 📢 Category: START HERE (只读/公告)
- **#👋welcome**: 欢迎页
  - **Topic**: Welcome to the LiuliX Community! Start your journey here. | 欢迎来到 LiuliX 社区！从这里开始您的旅程。
- **#📜rules**: 社区规则 (Community Rules)
  - **Topic**: Please read and follow our community guidelines. | 请阅读并遵守我们的社区规范。
- **#📢announcements**: 版本更新 (Announcements)
  - **Topic**: Latest news, updates, and maintenance notices. | 最新消息、版本更新及维护通知。
- **#🔑daily-codes**: 每日邀请码 (Daily Codes)
  - **Topic**: Get your daily invite code here if you run out of quota! | 如果配额耗尽，请在此领取每日邀请码！

#### 💬 Category: COMMUNITY HUB (公共区)
- **#💬general**: 综合讨论 (General Chat)
  - **Topic**: Chill, chat, and hang out with other data enthusiasts. | 轻松闲聊，与其他数据爱好者交流。
- **#💡feature-requests**: 功能建议 (Feature Requests)
  - **Topic**: Have an idea for LiuliX? Post it here and vote! | 对 LiuliX 有想法？在这里发布并投票！
- **#📈showcase**: 成果展示 (Showcase)
  - **Topic**: Show off your reports and charts created with LiuliX. | 展示您用 LiuliX 制作的报告和图表。
- **#🍱prompt-sharing**: Prompt 分享 (Prompt Sharing)
  - **Topic**: Share your best prompts for cleaning and analysis. | 分享您用于清洗和分析的最佳 Prompt。

#### 🛠 Category: SUPPORT (技术支持)
- **#🐛bug-reports**: Bug 反馈 (Bug Reports)
  - **Topic**: Found a bug? Let us know with details and reproduction steps. | 发现 Bug？请告知详情和复现步骤。
  - **Log Submission Guide (日志上报指引)**:
    1. **Enable Dev Mode**: Go to App `Settings` -> Turn on `Developer Mode`. | 前往设置，开启开发者模式。
    2. **Download Logs**: Click `Download Logs` to get the `.md` file. | 点击下载日志按钮，获取日志文件。
    3. **Create Post**: Create a new post here and drag the file to upload. | 在此创建新帖并拖入文件上传。
    4. **Describe**: Tell us what happened, and we'll check it out! | 描述 Bug 现象，我们会尽快查看！
- **#🐍python-help**: Python 帮助 (Python Help)
  - **Topic**: Stuck on generated Python code? Ask for help here. | 生成的 Python 代码有问题？在这里求助。
- **#🔒privacy-help**: 隐私与安全 (Privacy & Security)
  - **Topic**: Questions about local processing and data privacy. | 关于本地处理和数据隐私的问题。

---
## 🎯 第二阶段：精准来源追踪 (Source Tracking)

由于 Discord 无法通过 API 直接读取用户来源，我们采用 **"专用邀请链接隔离法"**。

### 操作步骤
1. **进入邀请界面**：点击服务器名称 -> `Invite People`。
2. **创建专用链接**：
   - 点击 `Edit invite link`。
   - **Expire after**: 建议选 `Never` (永久有效)。
   - **Max number of uses**: `No limit`。
   - 点击 `Generate New Link`。
3. **分渠道配置与命名**：
   - 为 **Reddit** 创建一个链接 -> 记录在运营表：`Reddit Channel`
   - 为 **Product Hunt** 创建一个链接 -> 记录在运营表：`PH Channel`
   - 为 **App (配额耗尽Toast)** 创建一个链接 -> 记录在运营表：`App Redirect`
   - 为 **Twitter/X** 创建一个链接 -> 记录在运营表：`Social Media`

### 数据查看
- 进入 `Server Settings` -> `Invites`。
- 你可以看到每个邀请链接的 **Uses (使用次数)**。
- 结合 **Invite Tracker Bot** (推荐)，可以自动记录每个新进群用户是通过哪个链接进来的，并记录日志。

---

## 🚀 第三阶段：Onboarding (入群引导)

利用 Discord 自带的 **Onboarding** 功能（设置 -> Onboarding），替代简单的欢迎消息。
**所有问题均采用【英文 | 中文】双语格式。**

### 1. 加入前问题 (Pre-join Questions)
*用户必须回答才能看到频道。*

**Q1: What brings you to LiuliX? | 您为什么来到 LiuliX?**
*(用于分配身份组 / Assign Roles)*

- **A**: **I'm a Data Analyst/Developer (Code-savvy) | 我是数据分析师/开发者**
  - 自动分配角色：`@Analyst`
  - 推荐频道：`#python-help`, `#bug-reports`
  
- **B**: **I'm a Business User (Charts & Reports) | 我是业务用户**
  - 自动分配角色：`@Business User`
  - 推荐频道：`#showcase`, `#general`

**Q2: Which feature interests you most? | 您最感兴趣的功能是?**
*(用于推荐频道 / Recommend Channels)*

- **A**: **Privacy & Local Processing | 隐私安全与本地处理**
  - 推荐频道：`#privacy-help`

- **B**: **AI Analysis & Insights | AI 分析与洞察**
  - 推荐频道：`#prompt-sharing`

### 2. 加入后问题 (Post-join Questions)
*作为来源追踪的辅助验证。*

**Q: Where did you hear about us? | 您从哪里听说我们的?**

- **Reddit**
- **Product Hunt**
- **Twitter / X**
- **Friend Recommendation | 朋友推荐**
- **"The App sent me here (Quota Limit) | App内配额耗尽提示"** (重要验证项)

### 3. 新成员要做的事 (New Member To-Dos)
*非强制性引导清单，旨在帮助新成员快速上手。*

**Task 1: Get Daily Invite Code | 领取每日邀请码**
- **Action**: Visit Channel (访问频道)
- **Channel**: `#daily-codes`
- **Description**: Grab a fresh code to unlock unlimited analysis. | 获取新邀请码解锁无限分析。

**Task 2: Read Community Rules | 阅读社区规则**
- **Action**: Visit Channel (访问频道)
- **Channel**: `#rules`
- **Description**: Understand our privacy policy and community guidelines. | 了解隐私政策与社区规范。

---

## 🤖 第四阶段：自动化与运营机制

### 1. 每日邀请码发布 (Daily Code Drop)
这是保持 Discord 活跃度（DAU）的关键。

#### 方案 A：GitHub Actions 自动化 (推荐)
已为您创建自动化脚本：`.github/workflows/daily-code-bot.yml`，每天北京时间 8:00 自动发布。

**配置步骤**：
1.  **创建 Webhook**:
    - Discord 频道 `#daily-codes` -> `Edit Channel` -> `Integrations` -> `Webhooks`。
    - 点击 `New Webhook`，命名为 "LiuliX Daily Bot"，复制 **Webhook URL**。
2.  **配置 GitHub Secret**:
    - GitHub 仓库 -> `Settings` -> `Secrets and variables` -> `Actions`。
    - 点击 `New repository secret`。
    - Name: `DISCORD_WEBHOOK_URL_DAILY_CODE`
    - Value: (粘贴刚才复制的 URL)
3.  **完成！** 机器人将每天自动运行。

#### 方案 B：人工发布
- **机制**：由运营人员每天手动发布。
- **格式**：
  ```
  🔑 LiuliX Daily Pass for Jan 17
  Code: LIULIX-20260117
  (Valid for 24h. Enjoy unlimited AI analysis!)
  ```
- **App 联动**：确保 App 端 "配额耗尽" 的 Toast 按钮文案为 "Get Daily Code on Discord"，直接指向这个频道的链接。

### 2. 自动欢迎与引导
- 使用 **MEE6** 或 **Dyno** Bot。
- 当用户通过 `App Redirect` 专用链接进入时，Bot 发送私信（DM）：
  *"Welcome! Runs out of quota? Check #daily-codes to grab a fresh invite code immediately!"*

### 3. Bug Hunter 奖励计划
- 在 `#bug-reports` 设置置顶消息。
- 规则：凡是提交被确认为 P0/P1 Bug 的用户，手动赋予 `@Bug Hunter` 角色。
- 权益：承诺未来付费版给予 3 个月免费或 5 折优惠。

---

## 📋 操作清单 (Checklist)

- [ ] **创建身份组**：Admin, Contributor, Analyst, Business User。
- [ ] **整理频道**：按上述结构创建/重命名频道，开启 Forum 功能。
- [ ] **生成邀请链接**：为 App、Reddit、PH 分别生成专用链接，并**必须**在 [159-管理-Discord渠道追踪记录表](159-管理-Discord渠道追踪记录表.md) 中登记。
- [ ] **更新 App 代码**：将前端的 Discord 跳转链接替换为 **专用追踪链接**。
- [ ] **配置 Onboarding**：在 Discord 设置中配好问卷和身份组映射。
- [ ] **发布第一条每日 Code**：在 `#daily-codes` 试运行。

---

*文档维护人: Agent Antigravity*
*最后更新: 2026-01-17*
