---
description: 添加或更新 i18n 翻译的严格流程
---

# 🌍 更新 i18n 工作流 (/update_i18n)

添加或更改翻译 Key 时，请**严格**遵循此流程（用户规则 #2, #21）。

## 1. 添加翻译键 (Add Translation Key)
1.  打开 `src/locales/zh-CN/[module].ts`（或相关模块文件）。
2.  添加新的 Key 和中文文本。
3.  打开 `src/locales/en-US/[module].ts`。
4.  添加对应的英文 Key。

## 2. 更新类型定义 (关键规则 #21)
1.  **打开 `src/types/i18n.ts`**。
2.  **同步类型**：将新的 Key 添加到接口/类型定义中。
    *   *注意：不执行此步骤属于 P0 级严重错误。*
3.  **验证**：运行 `npm run build` 或检查 IDE 是否有 TS 报错。

## 3. 使用 (Usage)
1.  在代码中使用 `t('module.key')`。
2.  **严禁**使用硬编码字符串。

## 4. 验证 (Verification)
1.  在 UI 中切换语言。
2.  验证文本是否正确更新。
3.  检查控制台是否有 "Missing key" 警告。
