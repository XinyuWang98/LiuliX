# 2026-01-06 Python库细粒度配置功能开发

## 📅 开发概览

- **功能目标**：允许用户在设置页面细粒度控制 Python 库的加载（如 seaborn, matplotlib, scikit-learn 等），以优化启动速度。
- **当前阶段**：Phase 1 (核心功能) - 阶段 2 (UI 改造)
- **完成度**：80% (功能开发完成，调试中)

## ✅ 已完成工作

### 1. 数据结构扩展
- 新增 `PyodideLibraryConfig` 接口，支持库的大小预估、加载时间、是否必需等元数据。
- 新增 `LibraryMissingStrategy` 枚举（自动加载 vs 过滤建议）。
- **文件**: `src/types/analysisPackage.ts`

### 2. 核心逻辑实现
- 创建 `libraryConfig.ts`: 负责从 PromptRegistry 自动汇总所需的 Python 库。
- 创建 `libraryStorage.ts`: 负责 LocalStorage 持久化存储用户配置，集成 Logger。
- **扁平化设计**: 废弃了原有的 "能力包" (AnalysisPackage) 概念，改为扁平化的库列表管理。

### 3. 设置面 UI 重构 (V4)
- 全面重构 `AnalysisPackagesSettings.tsx`。
- **全局策略**: 新增 Radio 按钮组，支持选择 "自动加载" (推荐) 或 "仅展示已配置"。
- **列表展示**: 实现了库列表的渲染，包含 Checkbox、库名称、必需标记、大小预估及被多少个 Prompt 使用的引用计数。
- **SimHei 支持**: 保留了中文字体配置开关。
- **i18n**: 完成了所有相关文案的中英文翻译 (`src/locales/*/settings.ts`, `packages.ts`)。

### 4. 侧边栏导航
- 确认 `SettingsSidebar.tsx` 已正确配置 `analysis-packages` 导航项。
- 解决导航项不显示问题（确认为浏览器缓存或 HMR 延迟）。

## ⚠️ 遇到问题：可用库列表为空

**现象**：
设置页面已成功显示 "分析能力" 面板，但 "可用库列表" 区域为空，没有任何库显示。

**排查过程**：
1. **代码检查**: `SettingsContent.tsx` 正确调用了 `AnalysisPackagesSettings`。
2. **数据源检查**: `libraryConfig.ts` 负责生成列表。
   - 发现曾有导入路径错误 (`@/services/promptRegistry` vs `@/services/prompts/promptRegistry`)，但已修正为正确路径 `@/services/promptRegistry`。
   - 添加调试日志后，需进一步确认 `promptRegistry.listPrompts()` 是否返回了有效数据。

**初步结论**：
可能是 `promptRegistry` 初始化时机问题，或者 `requiredPackages` 字段在运行时为空。该问题已记录到错误日志，待下一步修复。

## 📝 下一步计划

1. **修复库列表为空问题**:
   - 检查 `main.tsx` 初始化流程，确保 `promptRegistry` 单例被正确填充。
   - 确认 `seedPrompts` 是否在 `generateLibraryConfigs` 调用前已加载。
2. **浏览器验证**:
   - 上传文件，实际触发库加载逻辑。
   - 验证 "自动加载" 策略是否生效（在缺少库时自动加载）。
3. **Phase 2 功能**:
   - 改造 InsightCard，根据策略过滤或提示缺失库。
