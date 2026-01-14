---
description: 规范化新增Feature Flag流程
---

# /new_flag Workflow

标准化新增Feature Flag的流程，确保命名规范、分类正确、文档完整。

## 前置条件

用户提供：
- Flag用途说明
- 影响范围（前端/后端/全局）
- 是否需要后端控制

## 执行步骤

### 1. 确认需求

向用户确认：
- [ ] 业务价值是否明确？
- [ ] 是否需要灰度发布？
- [ ] 预计使用周期（临时/长期）？

### 2. 命名规范

**格式**: `<ACTION>_<FEATURE>_<SCOPE>`

**常用前缀**:
- `ENABLE_` - 启用某功能
- `HIDE_` - 隐藏某功能
- `USE_` - 使用某方案
- `SHOW_` - 显示某UI

**示例**:
- ✅ `ENABLE_INVITE_CODE_GATE`
- ✅ `USE_AST_CODE_ENHANCER`
- ❌ `NEW_BUTTON` (太模糊)
- ❌ `flag1` (无意义)

### 3. 确定分类

**BACKEND_CONTROLLED** (需要后端集成):
- 影响安全/计费
- 需要远程开关
- 生产环境控制

**FRONTEND_OPTIONAL** (前端控制):
- 仅UI展示
- 实验性功能
- 开发调试用

### 4. 添加定义

**Step 4.1: 更新远程配置模板**

编辑 `public/api/feature-flags.template.jsonc`（带注释的模板文件）：

```jsonc
// ========== [模块名称] ==========

// [功能说明]
// 使用位置：[文件路径]
"NEW_FLAG_NAME": false,
```

**模块分类**：
- `AI 功能模块` - AI 相关功能
- `报告导出模块` - 报告生成和导出
- `数据源集成模块` - 外部数据源
- `高级功能模块` - 高级/付费功能
- `实验性功能模块` - 实验性功能
- `系统控制模块` - 系统级开关

**Step 4.2: 同步到生产配置**

编辑 `public/api/feature-flags.json`（生产环境使用，无注释）：

```json
{
  "NEW_FLAG_NAME": false
}
```

⚠️ **注意**: 保持 `feature-flags.json` 为单行压缩格式，减小文件大小。

---

**Step 4.3: 更新代码定义**

**后端控制的Flag** → `src/config/featureFlags.ts`
```typescript
// 在 FeatureFlags interface 中添加
/** [说明] */
NEW_FLAG_NAME: boolean;

// 在 DEFAULT_FEATURE_FLAGS 中添加
NEW_FLAG_NAME: false,
```

**前端控制的Flag** → `src/utils/featureFlags.ts`
```typescript
export const FeatureFlags = {
    /** [说明] */
    NEW_FLAG_NAME: import.meta.env.VITE_NEW_FLAG === 'true',
}
```

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
const edaEnabled = isFeatureEnabled('ENABLE_EDA_CONTEXT_LOOP');
logger.log('AI洞察', 'EDA闭环功能状态', { data: { enabled: edaEnabled } });

if (edaEnabled) {
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
- **状态**: Development
- **创建时间**: YYYY-MM-DD
- **使用位置**: [文件路径]
- **业务价值**: [说明]
- **Owner**: USER
```

### 7. 验证
// turbo
```bash
npm run build
npm run check:flags
```

## 输出清单

- [ ] Flag定义已添加（配置文件 + 代码）
- [ ] 功能代码已实现
- [ ] **日志上报已添加**（关键检查点）
- [ ] 文档已更新（FEATURE_FLAGS_REGISTRY.md）
- [ ] 编译通过
- [ ] 检测脚本确认使用

## 相关Workflow

- `/review_flags` - 审核Flag状态
- `/cleanup_flags` - 清理Flag
