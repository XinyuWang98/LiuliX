---
description: 定期审核Feature Flags状态，生成清理建议
---

# /review_flags Workflow

审核所有Feature Flags的使用状态，生成清理建议报告。

## 执行步骤

// turbo
1. 运行检测脚本：
```bash
npm run check:flags
```

2. 查看检测报告，关注以下内容：
   - ✅ 使用中的Flags（正常）
   - ⚠️ 未使用的Flags（建议归档）
   - 🗑️ 已废弃的Flags（建议清理）

3. 根据报告，用户决策：
   - **立即清理**: 对于已废弃或从未启用的Flag → 执行 `/cleanup_flags`
   - **归档观察**: 对于可能需要的Flag → 添加 `@deprecated` 注释
   - **保持现状**: 对于正在使用的Flag → 无需操作

4. 更新文档（如有归档或清理）：
   - 更新 `docs/05-项目管理/FEATURE_FLAGS_REGISTRY.md`
   - 记录决策原因

## 输出示例

```
🔍 Feature Flags 使用情况检测

📋 发现 5 个 Feature Flags 定义

✅ 使用中 (3个)
  • ENABLE_INVITE_CODE_GATE
    使用: 2处 - FileUploader.tsx, APISettingsSimple.tsx
  • USE_AST_CODE_ENHANCER  
    使用: 1处 - codeEnhancer.ts

⚠️ 未使用 (2个)
  • CUSTOM_DRILL_DOWN_TRIGGER
    建议: 📦 归档

💡 清理建议
  • CUSTOM_DRILL_DOWN_TRIGGER - 代码中未检测到使用
```

## 触发时机

- 每季度自动提醒（第一个工作日）
- 重大版本发布前
- 用户主动触发

## 相关Workflow

- `/new_flag` - 新增Feature Flag
- `/cleanup_flags` - 执行清理
