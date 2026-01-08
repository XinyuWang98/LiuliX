---
description: 清理已归档或未使用的Feature Flag
---

# /cleanup_flags Workflow

安全清理Feature Flag及其相关代码。

## 前置条件

- 已运行 `/review_flags` 确认需要清理的Flag
- 用户已批准清理决策

## 执行步骤

1. **确认清理目标**
   用户提供要清理的Flag名称，例如：`CUSTOM_DRILL_DOWN_TRIGGER`

2. **搜索影响范围**
// turbo
```bash
grep -rn "CUSTOM_DRILL_DOWN_TRIGGER" src/ --include="*.ts" --include="*.tsx"
```

3. **分析输出**
   - 定义位置（featureFlags.ts）
   - 使用位置（组件文件）
   - 相关导入

4. **执行清理**（按顺序）
   a. 删除Flag定义
   b. 删除使用代码（条件渲染块）
   c. 清理相关状态变量
   d. 移除未使用的导入

5. **验证**
// turbo
```bash
npm run build
```

6. **浏览器测试**
   - 启动开发服务器
   - 验证相关页面正常

7. **提交变更**
```bash
git add -A
git commit -m "cleanup: 移除未使用的 [FLAG_NAME] Feature Flag"
```

## 安全保障

### TypeScript类型检查
如果清理不完整，编译会报错：
```
TS Error: Argument of type '"FLAG_NAME"' 
is not assignable to parameter of type 'FeatureFlagKey'
```

### Git回滚
```bash
git revert <commit-hash>
```

## 示例：清理 CUSTOM_DRILL_DOWN_TRIGGER

### Step 1: 删除定义
```diff
// src/utils/featureFlags.ts
-   CUSTOM_DRILL_DOWN_TRIGGER: false,
```

### Step 2: 删除使用代码
```diff
// src/components/insights/DrillDownArea.tsx
-   {isFeatureEnabled('CUSTOM_DRILL_DOWN_TRIGGER') && (
-       <div>...</div>
-   )}
```

### Step 3: 清理状态
```diff
-   const [showCustom, setShowCustom] = useState(false);
```

### Step 4: 移除导入
```diff
-   import { isFeatureEnabled } from '@/utils/featureFlags';
```

## 相关Workflow

- `/review_flags` - 审核Flag状态
- `/new_flag` - 新增Feature Flag
