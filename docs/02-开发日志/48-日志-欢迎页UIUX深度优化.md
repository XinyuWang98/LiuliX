# 2026-01-06 欢迎页升级与反馈功能开发

## 📅 工作摘要
本日完成了欢迎页（Landing Page）的全面升级，重点实现了产品路线图展示、用户反馈收集功能，并引入了PowerPoint风格的全屏滚动动画体验。

## ✨ 新增功能与组件

### 1. 产品路线图 (Roadmap)
- **位置**: Feature Highlights 下方
- **功能**: 展示 V1.0 (Current), V1.5 (Next), V2.0 (Future) 三个阶段的演进计划
- **视觉**:
  - 横向时间轴布局，带有渐变连接线（绿->橙->紫）
  - 玻璃态卡片，高度自动对齐
  - 节点悬停放大效果
  - 移动端自动切换为垂直时间轴
- **i18n**: 全面支持中英文切换

### 2. 用户反馈区域 (Feedback Section)
- **位置**: 页面底部
- **功能**: 收集用户反馈、Bug报告和功能建议
- **包含字段**: 邮箱（可选）、反馈类型、详细内容
- **交互**: 
  - 前端表单验证
  - 提交成功/失败的动画提示
  - 按钮悬停光效
- **设计**: 纯净玻璃态风格，无底部投影，融入背景

### 3. 滚动动画系统
- **核心**: `useScrollAnimation` Hook (基于 Intersection Observer)
- **效果**: 
  - 页面滚动时，各模块依次向上淡入 (`scroll-fade-up`)
  - 支持延迟触发和多种动画曲线
- **覆盖**: Hero, Trust Cards, Highlights, Roadmap, Feedback 全局应用

### 4. PowerPoint 风格布局
- **特性**: 每个核心模块占据至少 `100vh` 高度
- **对齐**: 内容垂直居中，提供沉浸式阅读体验
- **响应**: 小屏幕下自动回退到自然高度

## 🛠️ 代码与样式优化
- **Bug修复**:
  - 修复 `features-grid` 的 flex/grid 布局冲突已修复
  - 修复 Hero 上传按钮未水平居中问题
  - 修复 Feedback 提交按钮未水平居中问题
  - 移除 Feedback 区域底部的多余阴影
- **重构**:
  - 统一了所有 Section 的包裹容器类 `.section-wrapper`
  - 优化了 CSS 变量的使用

## 📝 待办事项 (To-Do)
- [ ] **DOM结构优化**: 将 `features-grid` (Trust Cards) 移入 `hero-section` 内部，使其在逻辑和视觉上成为一个整体单元。
- [ ] **后端接入**: 反馈表单目前仅为前端 Mock，需接入真实 API 或 Formspree。

## 📄 涉及文件
- `src/components/landing/Roadmap.tsx` (New)
- `src/components/landing/FeedbackSection.tsx` (New)
- `src/hooks/useScrollAnimation.ts` (New)
- `src/styles/scrollAnimations.css` (New)
- `src/components/landing/LandingPage.tsx`
- `src/components/landing/LandingPage.css`
- `src/locales/en-US/welcome.ts`

## 5. 晚间专项修复 (Emergency Fixes)

### 🚨 Hero Section 垂直居中 (Vertical Centering)
- **问题**: 用户反馈 Hero 内容位置偏上，未在首屏正中。
- **原因**: 开发环境热更新 (HMR) 滞后，且 CSS 优先级问题导致 min-height 未生效。
- **修复**:
  - 在 `LandingPage.tsx` 中使用内联样式强制设置 `minHeight: '85vh'` 和 `justifyContent: 'center'`。
  - 添加 `data-layout-fix="true"` 属性强制触发 React 重渲染。
  - 验证：通过浏览器控制台注入确认效果完美。

### 🚨 Hero 内容可见性 (Visibility)
- **问题**: 用户反馈页面"单薄/无内容" (Opacity 0)。
- **原因**: `useScrollAnimation` 初始透明度为 0，作为 LCP 元素不应依赖滚动触发显示。
- **修复**:
  - 移除 `.hero-section` 上的 `scroll-fade-up` 类。
  - 移除相关 Hook `heroRef` 和 `heroVisible`。
  - 效果：Hero 内容加载即显示，无延迟。

### 🧹 代码清理
- 移除未使用的 `heroRef` 引用。
- 清理 `LandingPage.tsx` 中的 lint 警告。

