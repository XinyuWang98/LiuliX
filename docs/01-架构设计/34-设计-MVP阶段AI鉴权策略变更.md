# MVP 阶段 AI 鉴权策略变更设计

> [!IMPORTANT]
> 本文档记录 MVP 阶段移除用户端自定义 API Key 入口，全面转向“邀请码+后端托管 Key”模式的决策与设计。

## 1. 背景与决策

### 1.1 现状
- 原设计允许用户在“设置”面板输入自己的 API Key (OpenAI/Gemini/DeepSeek)。
- 同时存在“邀请码”机制，用于解锁后端托管的免费试用 Key。

### 1.2 问题
- **产品定位模糊**: 让用户填写 API Key 会让产品看起来像一个简单的“AI 套壳”工具，降低专业感。
- **体验门槛高**: 目标用户（数据分析师）可能没有自己的 API Key。
- **管理复杂**: 前端需要同时维护 Custom Key 和 System Key 两套逻辑。

### 1.3 决策
- **MVP 阶段**: **使用特征开关 (Feature Toggle) 隐藏**用户端 API Key 入口，而非删除代码。
- **唯一鉴权方式**: **邀请码 (Invitation Code)**。
- **后端策略**: 所有请求通过 Proxy 转发，后端根据邀请码鉴权，并使用系统托管的 DeepSeek API Key。
- **扩展性**: 后续如需开放 Custom Key，只需修改环境变量开启开关。

## 2. 变更影响范围

### 2.1 UI/UX 调整
- **SettingsModal (设置面板)**:
  - 引入 `ENABLE_USER_API_KEYS` 开关。
  - MVP 阶段开关默认为 `false`，界面不渲染 `ModelSettings` 区域。
  - 代码逻辑保留，随时可复用。
- **Header (顶部导航)**:
  - 简化状态展示，不再区分 "Custom Key" vs "Trial Key"。

### 2.2 核心逻辑调整
- **aiService.ts**:
  - 增加安全检查：若开关关闭，即使本地有残留 Key 也忽略，强制使用 Proxy 通道。
  - 异常处理统一为：“请输入/检查邀请码”或“配额耗尽”。

### 2.3 隐私与合规
- **数据脱敏**: 无论是否使用托管 Key，发送给 AI 的数据必须经过脱敏处理（行数限制、敏感字段过滤）。
- **用户协议**: 需在邀请码输入处或首次使用时，明确提示“使用系统 AI 服务处理数据”。

## 3. 实施步骤

1. **Features Config**: 创建 `src/config/features.ts`，定义 `ENABLE_USER_API_KEYS`。
2. **Hide UI**: 修改 `SettingsModal.tsx`，使用开关包裹 Key 输入相关代码。
3. **Service Safety**: 在 `aiService.ts` 中添加开关判断，防止逻辑绕过。

## 4. 风险评估与缓解策略 (Risk Assessment)

> [!CAUTION]
> 使用单一系统兜底 API Key (System Fallback Key) 存在资源竞争与配额耗尽风险，需严格控制。

### 4.1 核心风险
1.  **全局限流 (Global Rate Limit)**:
    - DeepSeek 等服务商通常对单个 API Key 有 RPM/TPM 限制。
    - 风险：MVP 阶段如果多个用户同时高频使用（如批量数据清洗），可能触发 `429 Too Many Requests`，导致所有用户不可用（单点故障）。
2.  **成本不可控 (Uncontrolled Cost)**:
    - 恶意用户或 Bug 导致的死循环可能短时间内耗尽账户余额。
3.  **密钥泄露 (Key Leakage)**:
    - 虽然 Key 存储在后端，但如果代理服务鉴权逻辑有漏洞，黑客可伪造请求盗刷流量。

### 4.2 缓解策略 (Mitigation)
1.  **后端限流 (Backend Throttling)**:
    - **策略**: 基于 `x-invite-code` 或 IP 进行限流（例如：每分钟最多 10 次请求，每天最多 100 次）。
    - **Header 检查**: 严格校验 `x-invite-code` 是否在白名单内。
2.  **前端防抖与缓存 (Frontend Debounce & Cache)**:
    - **缓存**: 对相同的 Prompt（如生成的 SQL 清洗规则）在前端或后端进行缓存。
    - **Loading 锁**: AI 请求响应期间，禁用提交按钮，防止用户疯狂点击。
3.  **监控告警 (Monitoring)**:
    - 后端需记录 Token 消耗量，当达到阈值（如余额 < $5）时发送相关告警。

### 4.3 兜底策略升级 (Advanced Fallback)
> [!TIP]
> 针对“单 Key 风险”，建议在 MVP 后期采用以下低成本升级方案，无需重构代码。

1.  **多 Key 轮询 (Multi-Key Round Robin)**:
    - 后端支持读取 `DEEPSEEK_KEYS="key1,key2,key3"` 环境变量。
    - 简单的随机或轮询算法选择 Key，分散并发压力。
2.  **备用 Key 池**:
    - 准备 1-2 个备用的 `api_key` 仅在主 Key 报错 429 时自动切换（需简单的状态机逻辑）。
    - **当前 MVP 决策**: 暂不实现自动轮询，优先保证人工监控和手动热切换能力。
