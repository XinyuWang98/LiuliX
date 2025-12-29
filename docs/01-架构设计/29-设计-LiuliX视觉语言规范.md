# 29-设计-LiuliX视觉语言规范 (LiuliX Visual Design System)

> **版本**: 1.0.0 (Final "Ascension" Release)
> **状态**: 已定稿 (Approved)
> **最后更新**: 2025-12-30

## 1. 核心理念 (Core Philosophy)

**LiuliX (琉璃X)** 视觉语言旨在传达“在黑暗中寻找光明，在混沌中梳理秩序”的工具精神。我们拒绝黑盒，通过“透明、可溯”的视觉隐喻，建立用户对AI分析的深度信任。

### 三大设计支柱 (Design Pillars)
1.  **数字飞升 (Ascension)**: 
    *   **通天光柱 (The Beam)**: 象征智慧与连接的垂直光束，贯穿天地。
    *   **向上趋势**: UI 布局引导视线向上，传递积极、进化的情绪。
2.  **琉璃通透 (Liuli Translucency)**:
    *   **光学质感**: 界面元素通过高模糊 (Blur)、低透明度 (Low Opacity) 和 菲涅尔边缘 (Fresnel Edge) 模拟厚重的光学玻璃。
    *   **光破黑暗 (Light in Darkness)**: 深邃背景中的光影折射，寓意洞察力穿透数据迷雾。
3.  **精密工业 (Precision)**:
    *   **无缝融合**: 导航栏与页面融为一体，没有割裂的边界。
    *   **极致排版**: 严谨的字间距与行高，确保每一个字符（即使是下行部）都清晰可见。

---

## 2. 视觉风格定义 (Visual Style: Ascension)

### 2.1 环境 (Environment)
*   **深邃苍穹**: 极致的深蓝黑渐变，模拟无限的数字空间。
*   **数字光雨**: 背景带有细腻下落的二进制代码 (0/1) 纹理，增加赛博朋克氛围与数据流动感。

### 2.2 材质 (Material: Optical Glass)
*   **主体**: 高透明度的磨砂玻璃 (Frosted Glass)。
*   **边缘**: 锐利的高光边框 (1px Solid)，模拟光线在玻璃边缘的积聚。
*   **厚度**: 通过内阴影 (Inset Shadow) 和 背景模糊 (Backdrop Blur) 共同营造。

---

## 3. CSS 变量设计 (Design Tokens)

以下变量已在 `src/components/landing/LandingPage.css` 中定义并实装，为后续页面的 UI 重构提供基准。

### 3.1 核心色彩 (Color System)
```css
:root {
    /* 1. 环境 - 深邃苍穹 */
    --liuli-bg: #010305; /* 极致深蓝黑，接近纯黑 */

    /* 2. 光源 - 垂直光柱 */
    --beam-core: rgba(200, 230, 255, 0.15); /* 核心光柱，冷白 */
    --beam-glow: rgba(50, 100, 255, 0.2);   /* 外围晕光，深蓝 */
    --beam-highlight: rgba(255, 255, 255, 0.8); /* 高光点 */

    /* 3. 材质 - 琉璃结晶 */
    --glass-surface: rgba(255, 255, 255, 0.03); /* 极低不透明度，最大化通透感 */
    --glass-border: rgba(255, 255, 255, 0.15);  /* 基础边框 */
    --glass-border-highlight: rgba(255, 255, 255, 0.4); /* 高光边框 */
    --glass-panel-blur: 16px; /* 标准磨砂模糊度 */

    /* 4. 文本 */
    --text-main: #ffffff;
    --text-dim: rgba(180, 200, 255, 0.6); /* 蓝调灰白，比纯灰更高级 */
}
```

### 3.2 字体排版 (Typography)
*   **Hero Title**:
    *   `font-size: 72px`
    *   `font-weight: 800`
    *   `line-height: 1.3` (关键：防止下行部被遮挡)
    *   `letter-spacing: -2px`
*   **Logo Text**: `font-size: 24px` (Size L)

---

## 4. 关键组件规范 (Component Specs)

### 4.1 沉浸式导航栏 (Seamless Navbar)
**设计要点**: 导航栏必须是**完全透明**或**半透明**的，且页面内容必须**延伸至导航栏下方**，消除视觉割裂。

*   **实现技术**:
    ```css
    .landing-page-container {
        height: 100vh;
        margin-top: -54px; /* 负边距上拉 */
        padding-top: 54px; /* 内容下推 */
    }
    .navigation-bar {
        background: rgba(255, 255, 255, 0.02);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    ```

### 4.2 特性卡片 (Feature Card - The "Liuli" Block)
**设计要点**: 极高的透明度，依靠边缘高光和模糊来界定边界。

*   **样式代码**:
    ```css
    .card {
        /* 背景：极淡的渐变，几乎透明 */
        background: linear-gradient(165deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.005) 100%);
        
        /* 模糊：强磨砂 */
        backdrop-filter: blur(16px);
        
        /* 菲涅尔边缘：顶部和左侧模拟受光，更亮 */
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-top: 1px solid rgba(255, 255, 255, 0.4);
        border-left: 1px solid rgba(255, 255, 255, 0.15);
        
        /* 圆角 */
        border-radius: 20px;
    }
    ```

### 4.3 核心行为按钮 (Hero Action Button)
**设计要点**: 发光的胶囊，材质比卡片更通透，如同一枚聚焦的水晶。

*   **形态**: `border-radius: 9999px` (Pill Shape)
*   **交互**: 悬停时整体上浮，辉光增强。

---

## 5. 后续实施指南
在进行交互页（Dashboard, Prompt Library）重构时，请严格遵循本规范：

1.  **拒绝纯黑背景**: 使用 `--liuli-bg` 作为基底，尽可能保留光柱或光晕的暗示。
2.  **拒绝实色卡片**: 内容容器一律使用玻璃态 (`-glass-surface` + `blur`)。
3.  **保持通透**: 确保底层的纹理（如数字光雨）能透过上层 UI 隐约可见。
4.  **排版呼吸感**: 检查所有大标题的行高，确保 `g`, `j`, `p`, `q`, `y` 不被切断。

(End of Standard)
