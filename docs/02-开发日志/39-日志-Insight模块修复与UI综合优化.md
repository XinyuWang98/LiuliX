# 2026-01-04 开发日志：Insight 模块深度修复与 UI 优化

> [!NOTE]
> 本日重点攻克了 Live Notebook 和 Insight Card 展示的一系列核心交互与视觉问题，对标 Design 设计，强化了用户体验。

## 1. 核心修复与优化内容

### 1.1 Live Notebook 交互重构
- **默认隐藏**：实现了 Notebook 面板的默认折叠逻辑，避免页面初次加载时视觉杂乱。
- **自动展开**：点击 Insight Card 时能够自动唤起 Notebook 并滚动到对应的代码块位置，实现了"所见即所得"的关联体验。
- **代码块折叠**：
    - 引入了代码块的折叠/展开功能。
    - **智能联动**：当点击某个洞察卡片时，Notebook 中会自动**展开**对应的目标代码块，并**收起**其他非相关代码块，让用户聚焦于当前逻辑，减少干扰。

### 1.2 Insight Card 图片显示与布局修复
- **Base64 重复前缀修复**：移除了前端代码中重复添加的 `data:image/png;base64,` 前缀，解决了图片无法加载 (`net::ERR_INVALID_URL`) 的问题。
- **布局适配优化**：
    - 针对 Flex 布局在不同尺寸下的兼容性问题，重构为稳健的 `block` + `text-align: center` 布局。
    - **移除 Padding**：彻底移除了图片容器的内边距，配合白色背景，最大化了图片内容的展示区域，消除了"被框住"的割裂感。
    - **尺寸约束**：实施了严格的 `max-width: 100%` 和动态 `max-height` (500px) 策略，确保各类长宽比图片均能完美自适应，不再溢出或被裁剪。

### 1.3 "采纳"按钮功能闭环
- **逻辑实现**：打通了 `handleAdopt` 链路，现在点击"采纳"按钮可正确将洞察写入 `EvidenceContext` 证据池。
- **状态管理**：添加了 `isAdopted` / `isIgnored` 本地状态，实现了按钮点击后的即时视觉反馈（变色、禁用），无需等待后端。
- **回调机制**：为 `InsightCardV2` 添加了 `onAdopt` 回调，便于父组件感知采纳动作。

### 1.4 清洗建议 (Cleaning Suggestion) UI 优化
- **图标语义化**：重构了 `SuggestionCard` 的图标显示逻辑。
    - **优先级调整**：将内容关键词匹配（如"删除"、"填充"）优先级提升至来源判断之前。
    - **语义映射**：
        - "删除/Drop" -> 🗑️ 垃圾桶 (Trash2) + 🔴 红色背景 (Bg-Danger)
        - "去重/Duplicate" -> ❌ 文件去重 (FileX) + 🟠 黄色背景 (Bg-Warning)
        - "填充/Fill" -> 🧹 橡皮擦 (Eraser) + 🔵 蓝色背景 (Bg-Info)
        - "标准化/Normalize" -> 🧮 计算器 (Calculator) + 🟣 紫色背景 (Bg-Accent)
- **视觉去噪**：移除了图标内部的默认填充 (`fill: none`)，解决了红图标配绿背景的视觉冲突，使界面更加清爽专业。
- **合规性修复**：自检发现并修复了 `SuggestionCard.css` 中的硬编码颜色，全部替换为 `var(--color-quality-*)` 变量与 `color-mix` 函数。

## 2. 涉及文件变更

### 修改
- `src/components/insights/InsightCardV2.tsx` (交互逻辑, 采纳功能)
- `src/components/insights/InsightCardV2.css` (图片布局, 样式适配)
- `src/components/insights/LiveNotebookPanel.tsx` (代码块折叠逻辑)
- `src/components/insights/LiveNotebookPanel.css` (折叠样式)
- `src/components/cleaning/components/SuggestionCard.tsx` (图标逻辑)
- `src/components/cleaning/components/SuggestionCard.css` (背景色变量)
- `src/components/insights/InsightChainFlow.tsx` (交互联动)
- `src/components/exploration/ContentPanel.tsx` (Notebook 状态管理)

### 下一步计划
- [ ] 持续观察大图在不同屏幕分辨率下的表现。
- [ ] 验证 ReportGenerator 模块对新证据格式的兼容性。
