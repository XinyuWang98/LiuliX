# 2026-01-06 Python库细粒度配置功能开发

## 📅 开发概览

- **功能目标**：允许用户在设置页面细粒度控制 Python 库的加载（如 seaborn, matplotlib, scikit-learn 等），以优化启动速度。
- **当前阶段**：✅ 已完成
- **完成度**：100% (功能开发完成，浏览器验证通过)

## ✅ 已完成工作

### 1. 数据结构扩展
- 新增 `PyodideLibraryConfig` 接口，支持库的大小预估、加载时间、是否必需等元数据。
- 新增 `LibraryMissingStrategy` 枚举（自动加载 vs 过滤建议）。
- **文件**: `src/types/analysisPackage.ts`

### 2. 核心逻辑实现
- 创建 `libraryConfig.ts`: 负责从 PromptRegistry 自动汇总所需的 Python 库。
- 创建 `libraryStorage.ts`: 负责 LocalStorage 持久化存储用户配置，集成 Logger。
- **✅ 新增** `src/utils/libraryChecker.ts`: 库依赖检查工具，包含 `getMissingLibraries`、`canExecuteWithLibraries`、`filterPromptsByLibraryPolicy` 三个核心函数。
- **扁平化设计**: 废弃了原有的 "能力包" (AnalysisPackage) 概念，改为扁平化的库列表管理。

### 3. 设置面板 UI 重构 (V4)
- 全面重构 `AnalysisPackagesSettings.tsx`。
- **全局策略**: 新增 Radio 按钮组，支持选择 "自动加载" (推荐) 或 "仅展示已配置"。
- **列表展示**: 实现了库列表的渲染，包含 Checkbox、库名称、必需标记、大小预估及被多少个 Prompt 使用的引用计数。
- **SimHei 支持**: 保留了中文字体配置开关。
- **i18n**: 完成了所有相关文案的中英文翻译 (`src/locales/*/settings.ts`, `packages.ts`)。

### 4. 执行层集成
- **✅ 修改** `PyodideManager.ts`: 新增 `ensurePackagesInstalled()` 方法，实现自动库安装。
- **✅ 修改** `modeExecutor.ts`: 集成库依赖自动查询，根据 `promptId` 获取 `requiredPackages` 并传递给 Pyodide。
- **✅ 修改** `executor.ts`: 透传 `promptId` 到执行层。

### 5. 测试验证
- **✅ 创建** `scripts/test-library-integration-simple.ts`: 集成测试脚本，验证完整数据流。
- **✅ 浏览器验证**: 成功加载 seaborn 等库，无 `ModuleNotFoundError`。

## ⚠️ 关键缺陷修复 (2026-01-07)

### 问题：库已启用但实际未安装

**现象**：
用户在设置中启用了 seaborn，但执行时仍报错 `ModuleNotFoundError: No module named 'seaborn'`。

**根本原因**：
`PyodideManager.ensurePackagesInstalled()` 的逻辑错误（第132-134行）：

```typescript
// ❌ 错误逻辑
const { missingLibraries } = canExecuteWithLibraries(requiredPackages);
if (missingLibraries.length === 0) {
    return; // 提前返回，没有发送 LOAD_PACKAGES
}
```

**问题**：
- `getMissingLibraries()` 检查的是**用户设置中的启用状态**
- 用户启用了 seaborn → `missingLibraries` 为空
- 函数提前返回，**未发送 LOAD_PACKAGES 消息**
- Pyodide Worker 实际未安装 seaborn
- 运行时报 `ModuleNotFoundError`

**修复方案**：
```typescript
// ✅ 正确逻辑
// 仅在 FILTER_SUGGESTIONS 模式下检查用户是否启用
if (strategy === LibraryMissingStrategy.FILTER_SUGGESTIONS && missingLibraries.length > 0) {
    throw new Error(...);
}

// 无条件发送所有 requiredPackages，让 Worker 的 micropip 自己判断
await this.sendMessage('LOAD_PACKAGES', { packages: requiredPackages });
```

**验证结果**：
- ✅ 浏览器日志显示 `Loading micropip` → `Loaded micropip`
- ✅ 5个洞察分析中，4个执行成功（1个因数据问题失败，非库问题）
- ✅ 无 `ModuleNotFoundError`

## 📊 统计数据

- **总 Prompt 数**: 34
- **有库依赖的 Prompt**: 13
- **Python 库使用分布**:
  - pandas: 13次
  - matplotlib: 12次
  - numpy: 10次
  - seaborn: 2次
  - scikit-learn: 2次
  - scipy: 1次
  - statsmodels: 1次

## 📝 后续优化建议

1. **AI 服务层过滤** (可选): 在 `aiService.ts` 和 `aiCleaningService.ts` 中集成 `filterPromptsByLibraryPolicy`，在 `FILTER_SUGGESTIONS` 模式下提前过滤 Prompt。
2. **错误提示优化**: 在 `FILTER_SUGGESTIONS` 模式下被阻止时，提供更友好的引导信息。
3. **性能监控**: 记录每个库的实际加载时间，优化预估数据。
