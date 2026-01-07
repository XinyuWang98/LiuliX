# 设计：MVP 阶段 AI 鉴权策略变更 (Feature Flag 版)

**日期**: 2026-01-07  
**状态**: ✅ 已确认  
**版本**: v1.1  

## 1. 核心决策
为简化 MVP 阶段用户体验，同时保留未来扩展性，决定采用 **特征开关 (Feature Toggle)** 策略管理 AI 设置界面。

-   **默认行为 (MVP)**：隐藏复杂的 API Key 配置，仅提供 **"本地 vs 内置"** 二选一界面。
-   **高级行为 (Advanced)**：通过开关开启完整配置界面（支持 Gemini/Claude/Grok 等自定义 Key）。
-   **架构维持**：保留 `src/server` 作为后端代理，负责隐藏 DeepSeek Key、验证邀请码及实施免费额度控制。不迁移至纯前端。

## 2. 详细变更方案

### 2.1 特征开关机制
-   **开关名称**: `ENABLE_ADVANCED_API_CONFIG`
-   **默认值**: `false`
-   **控制方式**: `src/config/featureFlags.ts` (代码级默认) + `localStorage` (运行时覆盖)。

### 2.2 设置界面重构 (`APISettings.tsx`)

### 2.2 设置界面重构 (`APISettings.tsx`)

#### 模式 A：简易模式 (默认)

**核心变更：邀请码前置（Global Gate）**
用户必须先输入 **邀请码** 才能解锁 AI 功能。

1.  **全局激活区**
    -   **输入框**: "请输入内测邀请码"
    -   **行为**: 调用 `/api/validate-invite-code` 验证。验证通过后解锁下方模型选择。

2.  **模型选择区 (解锁后可用)**

    -   **🏠 本地隐私模式 (Local Mode)**
        -   **配额**: **无限使用** (Hardware Dependent)
        -   **后端**: Ollama (运行于 localhost:11434)
        -   **说明**: "不消耗云端额度，完全免费"

    -   **✨ LiuliX 内置 AI (Cloud Mode)**
        -   **配额**: **有限额度** (基于邀请码策略，如 20次/天)
        -   **后端**: DeepSeek (通过 LiuliX 代理服务器)
        -   **说明**: "消耗云端计算资源"

#### 模式 B：高级模式 (开关开启)
-   渲染原有的 `APISettings` 完整界面。
-   支持选择 Gemini, Claude, Grok 等模型。
-   支持手动输入 API Key 和 Base URL。

### 2.3 服务层适配 (`aiService.ts`)
-   **DeepSeek 配置增强**:
    -   支持从 `localStorage` 读取 `invite_code`。
    -   请求 Header 增加 `x-invite-code`。
-   **兼容性**:
    -   保持 `CONFIG` 对象中的其他模型配置不变，以支持高级模式。

## 3. 验证与测试
1.  **MVP 验证**:
    -   清空 LocalStorage -> 确认界面仅显示二选一。
    -   输入邀请码 -> 确认 DeepSeek 调用成功。
2.  **高级功能验证**:
    -   `localStorage.setItem('ENABLE_ADVANCED_API_CONFIG', 'true')`。
    -   确认界面恢复完整版。

## 4. 后续规划
-   **v1.5**: 视用户反馈决定是否开放更多模型的简易配置（如 "Bring Your Own Key"）。
-   **v2.0**: 企业版可能默认开启高级配置。
