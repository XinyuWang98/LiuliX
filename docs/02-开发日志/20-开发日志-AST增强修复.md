# 2026-01-10 AST增强修复与验证日志

## 1. 背景与目标
解决代码增强过程中出现的 `NameError: name 'null' is not defined` 和 `IndentationError`，确保 AST 增强器成为唯一且稳健的代码增强手段，移除不稳定的正则回退机制。

## 2. 问题根因分析
- **重复增强**: `src/services/skills/modeExecutor.ts` 再次调用 `CodeEnhancer.enhance` 处理已经被 `inflater.ts` 增强过的代码。
- **null 注入**: 重复增强过程中，已存在的 Python 代码（包含 `null` 字面量，源自 JS `null` 的 `JSON.stringify`）被再次解析，Pyodide 执行时报 `NameError`。
- **正则回退**: 当第二次 AST 增强因 `null` 错误失败时，系统回退到 v2.0 正则增强，该正则处理导致了缩进错误 (`IndentationError`)。

## 3. 修复方案实施
1.  **移除重复调用**: 修改 `modeExecutor.ts`，直接使用传入的 `code`（已在 `inflater.ts` 中增强），不再调用 `CodeEnhancer.enhance`。
2.  **移除正则回退**: 修改 `src/services/prompts/guards/codeEnhancer.ts`，删除 `enhanceWithRegex` 及相关回退逻辑。AST 增强失败直接抛出错误，遵循 Fail Fast 原则。
3.  **AST 保护规则验证**: 确认 `PlotProtectionRule` 等现有规则能正确处理空数据情况（拦截绘图而非崩溃）。

## 4. 验证结果
- **Data.csv**: L1 洞察成功率 75% (3/4)。失败 1 例为 P3 Schema 问题（AI 臆造列名 `KeyError: 'value'`）。
- **housing.csv**: L1 洞察成功率 60% (3/5)。失败 2 例为 P3 Schema 问题（臆造 `actual_quantity` 等）或 AST 保护拦截（预期行为）。
- **代码质量**:
    - ✅ 0个 `NameError: name 'null'`
    - ✅ 0个 `IndentationError`
    - ✅ 0个 正则降级日志
    - ✅ AST 增强稳定耗时 < 25ms

## 5. 剩余问题 (非代码增强相关)
识别到 SchemaService 相关的新问题，已列入 P3 优化计划：
- **AI 臆造列名**: AI 在 Router 阶段生成不存在的列名 (如 `actual_quantity`, `sale_date`)。
- **通用列名混淆**: AI 使用 `value`, `date`, `category` 等通用占位符。

## 6. 下一步
- 执行 SchemaService 优化 (Prompt 约束 + Router 过滤)。
- 完善 EDA 闭环的 Context 传递。
