---
description: 规范化新增Feature Flag流程
---

# /new_flag Workflow

标准化新增Feature Flag的流程，确保命名规范、**强制后端集成**、文档完整。

> **🆕 2026-02-03 v2.0 重大更新**：所有新 Feature Flags 必须由后端控制，不再支持纯前端 Flag。

## 前置条件

用户提供：
- Flag用途说明
- 影响范围（前端/后端/全局）
- 优先级等级（P0/P1/P2）

## 执行步骤

### 1. 确认需求

向用户确认：
- [ ] 业务价值是否明确？
- [ ] 是否需要灰度发布？
- [ ] 预计使用周期（临时/长期）？
- [ ] 优先级等级（P0 安全/P1 核心/P2 辅助）？

### 2. 命名规范

**格式**: `<ACTION>_<FEATURE>_<SCOPE>`

**常用前缀**:
- `ENABLE_` - 启用某功能
- `HIDE_` - 隐藏某功能
- `USE_` - 使用某方案
- `SHOW_` - 显示某UI
- `REAL_` - 真实服务（vs Mock）

**示例**:
- ✅ `ENABLE_INVITE_CODE_GATE`
- ✅ `USE_AST_CODE_ENHANCER`
- ✅ `REAL_AI_INSIGHT`
- ❌ `NEW_BUTTON` (太模糊)
- ❌ `flag1` (无意义)

### 3. ⚠️ 强制后端集成（2026-02-03 v2.0）

**所有新 Feature Flags 必须由后端控制**，以支持：
- ✅ 生产环境快速开关
- ✅ 灰度发布与 A/B 测试
- ✅ 紧急回滚能力

**不再支持 FRONTEND_OPTIONAL 分类**，所有 Flag 必须：
1. 添加到 `server/configRoutes.js`
2. 配置到 `server/.env.local`
3. 支持环境变量控制

### 4. 添加定义

#### **Step 4.1: 后端配置（强制）**

**4.1.1 更新 `server/configRoutes.js`**

在 `getCoreFlags()` 函数中添加：

```javascript
// 🆕 [优先级]: [功能说明]
NEW_FLAG_NAME: process.env.NEW_FLAG_NAME !== 'false', // 默认true/false
```

**优先级标识**：
- `🔴 P0` - 安全/计费相关，生产环境必控
- `🟡 P1` - 核心功能，影响用户体验
- `🟢 P2` - 辅助功能，可快速回滚

**默认值策略**：
- `=== 'true'` - 默认关闭，需主动启用（实验性功能）
- `!== 'false'` - 默认开启，需主动禁用（稳定功能）

**示例**：
```javascript
// 🟡 P1: 真实AI洞察（生产环境启用DeepSeek API）
REAL_AI_INSIGHT: process.env.REAL_AI_INSIGHT !== 'false', // 默认true

// 🟢 P2: 本地Router AI（实验性功能，默认关闭）
ENABLE_LOCAL_ROUTER: process.env.ENABLE_LOCAL_ROUTER === 'true', // 默认false
```

**4.1.2 更新控制台日志**

在 `console.log('[Feature Flags] 配置请求:', { ... })` 中添加：

```javascript
NEW_FLAG_NAME: flags.NEW_FLAG_NAME,
```

**4.1.3 配置环境变量**

编辑 `server/.env.local`：

```bash
# 🆕 Feature Flags (后端控制)
# [功能说明]（默认 true/false，[使用场景]）
NEW_FLAG_NAME=true
```

---

#### **Step 4.2: 前端定义（同步）**

编辑 `src/config/featureFlags.ts`：

```typescript
// ========== 在 FeatureFlags interface 中添加 ==========
export interface FeatureFlags {
    // ... 现有 Flags
    
    /** [功能说明] */
    NEW_FLAG_NAME: boolean;
}

// ========== 在 DEFAULT_FEATURE_FLAGS 中添加（兜底值） ==========
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
    // ... 现有 Flags
    
    NEW_FLAG_NAME: false,  // 后端未响应时的降级值
};
```

⚠️ **注意**：
- 前端的 `DEFAULT_FEATURE_FLAGS` 仅作兜底
- 实际生产环境由后端 `/api/config` 控制
- 前端会自动拉取并缓存远程配置（24小时）

---

### 5. 实现功能代码

#### 基础使用

```typescript
import { isFeatureEnabled } from '@/config/featureFlags';

if (isFeatureEnabled('NEW_FLAG_NAME')) {
    // 新功能代码
}
```

#### ⚠️ 日志上报规范（强制）

在以下场景**必须**添加日志上报：

**场景 1: 模块启动时检查**
```typescript
import { isFeatureEnabled } from '@/config/featureFlags';
import { logger } from '@/utils/logger';

// ✅ 在模块/组件初始化时记录
const flagEnabled = isFeatureEnabled('NEW_FLAG_NAME');
logger.log('模块名', 'NEW_FLAG_NAME 功能状态', { data: { enabled: flagEnabled } });

if (flagEnabled) {
    // 功能逻辑
}
```

**场景 2: 关键业务逻辑分支**
```typescript
if (isFeatureEnabled('NEW_FLAG_NAME')) {
    logger.log('模块名', 'NEW_FLAG_NAME 已启用，执行新逻辑');
    // 新逻辑
} else {
    logger.log('模块名', 'NEW_FLAG_NAME 已禁用，使用旧逻辑');
    // 旧逻辑
}
```

**场景 3: 用户操作触发**
```typescript
const handleAction = async () => {
    const flagEnabled = isFeatureEnabled('NEW_FLAG_NAME');
    logger.log('用户操作', '执行操作', { 
        data: { action: 'xxx', flagEnabled } 
    });
    
    if (flagEnabled) {
        // 新流程
    }
};
```

#### 日志规范

| 场景     | 日志类型     | 示例                                                        |
| -------- | ------------ | ----------------------------------------------------------- |
| 功能启用 | `logger.log` | `logger.log('模块', 'XX功能已启用')`                        |
| 功能禁用 | `logger.log` | `logger.log('模块', 'XX功能已禁用，使用降级方案')`          |
| 状态检查 | `logger.log` | `logger.log('模块', 'XX状态', { data: { enabled: true } })` |

### 6. 更新文档

在 `docs/04-技术专题/FEATURE_FLAGS_REGISTRY.md` 添加：
```markdown
### NEW_FLAG_NAME
- **分类**: BACKEND_CONTROLLED
- **优先级**: P0/P1/P2
- **状态**: Development
- **创建时间**: YYYY-MM-DD
- **使用位置**: [文件路径]
- **业务价值**: [说明]
- **Owner**: USER
- **环境变量**: `NEW_FLAG_NAME` (默认 true/false)
```

### 7. 验证
// turbo
```bash
# 编译检查
npm run build

# Flag 使用检测
npm run check:flags

# 后端配置验证
curl http://localhost:3001/api/config | jq '.data.featureFlags'
```

## 输出清单

- [ ] **后端配置已添加**（`server/configRoutes.js` + `server/.env.local`）
- [ ] **前端类型已同步**（`src/config/featureFlags.ts`）
- [ ] 功能代码已实现
- [ ] **日志上报已添加**（关键检查点）
- [ ] 文档已更新（FEATURE_FLAGS_REGISTRY.md）
- [ ] 编译通过（`npm run build`）
- [ ] 后端配置生效验证（`curl http://localhost:3001/api/config`）
- [ ] 检测脚本确认使用（`npm run check:flags`）

## 相关Workflow

- `/review_flags` - 审核Flag状态
- `/cleanup_flags` - 清理Flag

---

## 附录：历史 Flag 迁移计划

当前剩余 **21 个** 前端自治 Flag 待迁移。迁移优先级：

**P0（影响安全/计费）**：
- `ENABLE_INVITE_CODE_GATE` - ✅ 已迁移

**P1（核心功能）**：
- `REAL_AI_INSIGHT` - ✅ 已迁移（2026-02-03）
- `REAL_AI_CLEANING` - 待迁移
- `AI_CHAT_PANEL` - 待迁移

**P2（辅助功能）**：
- `ENABLE_LOCAL_ROUTER` - ✅ 已迁移（2026-02-03）
- 其余 16 个 - 待迁移

迁移执行：使用 `/new_flag` workflow 标准流程，逐步替换。
