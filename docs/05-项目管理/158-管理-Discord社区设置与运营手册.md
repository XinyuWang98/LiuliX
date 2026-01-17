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
- **#👋welcome**: 欢迎页，配置 MEE6 或自带的 Welcome Screen。
- **#📜rules**: 社区规则 (Community Rules)。
- **#📢announcements**: 版本更新、维护通知 (Announcements & Updates)。
- **#🔑daily-codes**: **[双语]** 每日邀请码 / Daily Invite Codes。每日自动/手动发布当天的邀请码。解决 App 内配额耗尽用户的痛点。

#### 💬 Category: COMMUNITY HUB (公共区)
- **#💬general**: 综合讨论 (General Chat)。
- **#💡feature-requests**: **[Forum形式]** 功能建议 / Feature Requests。用户发帖提需求，支持投票 。
- **#📈showcase**: 成果展示 / Showcase。用户展示使用 LiuliX 生成的报告/图表。
- **#🍱prompt-sharing**: Prompt 分享 / Prompt Sharing。分享好用的清洗或分析 Prompt。

#### 🛠 Category: SUPPORT (技术支持)
- **#🐛bug-reports**: **[Forum形式]** Bug 反馈 / Bug Reports。要求填写特定格式（版本、复现步骤）。
- **#🐍python-help**: Python 帮助 / Python Help。讨论生成的 Python 代码报错问题。
- **#🔒privacy-help**: 隐私与安全 / Privacy & Security。讨论本地隐私安全特性。

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

---

## 🤖 第四阶段：自动化与运营机制

### 1. 每日邀请码发布 (Daily Code Drop)
这是保持 Discord 活跃度（DAU）的关键。
- **机制**：每天由运营人员（或开发 Bot）在 `#daily-codes` 频道发布当日有效的动态邀请码。
- **格式**：
  ```
  🔑 LiuliX Daily Pass for Jan 17
  Code: REDDIT20260117
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
- [ ] **生成邀请链接**：为 App、Reddit、PH 分别生成永久链接并做好记录。
- [ ] **更新 App 代码**：将前端的 Discord 跳转链接替换为 **专用追踪链接**。
- [ ] **配置 Onboarding**：在 Discord 设置中配好问卷和身份组映射。
- [ ] **发布第一条每日 Code**：在 `#daily-codes` 试运行。

---

*文档维护人: Agent Antigravity*
*最后更新: 2026-01-17*
