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

使用示例：
```typescript
import { isFeatureEnabled } from '@/config/featureFlags';

if (isFeatureEnabled('NEW_FLAG_NAME')) {
    // 新功能代码
}
```

### 6. 更新文档

在 `FEATURE_FLAGS_REGISTRY.md` 添加：
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

- [ ] Flag定义已添加
- [ ] 功能代码已实现
- [ ] 文档已更新
- [ ] 编译通过
- [ ] 检测脚本确认使用

## 相关Workflow

- `/review_flags` - 审核Flag状态
- `/cleanup_flags` - 清理Flag
