# LiuliX Design Tokens Cheatsheet

> **Tips:** This is the Single Source of Truth for LiuliX Visual Language. Use these tokens instead of hardcoded values.  
> **最后更新**: 2025-12-31

## 1. Colors & Theme
| Token Name         | Value Description           | Purpose                            |
| :----------------- | :-------------------------- | :--------------------------------- |
| **Foreground**     |                             |                                    |
| `--text-primary`   | `#FFFFFF`                   | Main titles, high contrast text    |
| `--text-secondary` | `rgb(142, 142, 147)`        | Subtitles, body text (灰色)        |
| `--text-tertiary`  | `rgba(180, 200, 255, 0.6)`  | Hints, labels                      |
| `--text-dim`       | `rgba(235, 245, 255, 0.3)`  | Placeholders, disabled text        |
| **Accent Colors**  |                             |                                    |
| `--primary`        | `#0A84FF`                   | **主色** - 高亮、微型图、按钮      |
| `--primary-rgb`    | `10, 132, 255`              | 支持 rgba() 使用                   |
| `--success`        | `#30D158`                   | 成功状态                           |
| `--warning`        | `#FFD60A`                   | 警告状态                           |
| `--error`          | `#FF453A`                   | 错误状态                           |
| **Background**     |                             |                                    |
| `--liuli-bg`       | `#010305`                   | App global background (Deep Space) |
| `--bg-hover`       | `rgba(255, 255, 255, 0.05)` | Hover 状态背景                     |
| `--bg-secondary`   | `#252527`                   | Secondary areas (lists, inputs)    |

## 2. Glassmorphism & Effects (Core)
| Token Name                 | Value                     | Description                    |
| :------------------------- | :------------------------ | :----------------------------- |
| **Backgrounds**            |                           |                                |
| `--glass-surface`          | `rgba(255,255,255, 0.03)` | 标准玻璃容器背景               |
| `--glass-hover`            | `rgba(255,255,255, 0.06)` | 悬停态玻璃背景                 |
| `--glass-vignette-bg`      | `radial-gradient(...)`    | 设置弹窗（中心清晰，边缘暗淡） |
| **Blurs**                  |                           |                                |
| `--blur-medium`            | `16px`                    | 标准模糊（大多数组件）         |
| `--blur-heavy`             | `30px`                    | 重模糊（面板、底栏）           |
| `--blur-ultra`             | `60px`                    | 超重模糊（背景对象）           |
| **Borders**                |                           |                                |
| `--glass-border`           | `rgba(255,255,255, 0.15)` | 标准边框                       |
| `--glass-border-highlight` | `rgba(255,255,255, 0.4)`  | 顶部高光边框（菲涅尔效果）     |
| `--glass-border-light`     | `rgba(255,255,255, 0.08)` | 轻边框                         |

## 3. Highlight & Selection (V2 专用)
| Token/Value                | Description    |
| :------------------------- | :------------- |
| `rgba(10, 132, 255, 0.08)` | 行高亮背景     |
| `rgba(10, 132, 255, 0.15)` | 单元格高亮背景 |
| `rgba(10, 132, 255, 0.06)` | 列高亮背景     |
| `rgba(10, 132, 255, 0.3)`  | 高亮边框       |

## 4. Layout Dimensions
| Token          | Value       | 用途             |
| :------------- | :---------- | :--------------- |
| `--gap-xs`     | 4px         | 极小间距         |
| `--gap-s`      | 8px         | 小间距           |
| `--gap-m`      | 16px        | 中间距           |
| `--gap-l`      | 24px        | 大间距           |
| `--radius-s`   | 6px         | 小圆角           |
| `--radius-m`   | 8px         | 中圆角           |
| `--radius-l`   | 12px        | 大圆角（卡片）   |
| `--radius-xl`  | 16px / 20px | 超大圆角（弹窗） |
| `--nav-height` | 64px        | 导航栏高度       |

## 5. Typography
| Token           | Value                          | 用途                 |
| :-------------- | :----------------------------- | :------------------- |
| `--font-family` | `Inter, system-ui, sans-serif` | 默认字体             |
| `--font-mono`   | `SF Mono, Consolas, monospace` | 代码/数字字体        |
| `--fs-xxs`      | 10px                           | 极小文字             |
| `--fs-xs`       | 11px                           | 超小文字             |
| `--fs-sm`       | 13px                           | 小文字（表格单元格） |
| `--fs-md`       | 15px                           | 中文字               |
| `--fs-lg`       | 18px                           | 大文字               |
| `--fw-medium`   | 500                            | 中等粗细             |
| `--fw-bold`     | 600 / 700                      | 粗体                 |

## 6. 快速复制代码片段

### 玻璃态容器
```css
.my-glass-container {
    background: var(--glass-surface);
    backdrop-filter: blur(var(--blur-medium));
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-l);
}
```

### 蓝色高亮
```css
.highlight-cell {
    background-color: rgba(10, 132, 255, 0.15) !important;
    border: 1px solid rgba(10, 132, 255, 0.3);
}
```

### 微型图柱状图
```css
.bar-inline {
    background: var(--primary);
    opacity: 0.8;
}
```

## 7. 图片规范系统 (Image Spec)
| Token                           | Value             | 场景                         |
| :------------------------------ | :---------------- | :--------------------------- |
| `--img-chart-min-height`        | `120px`           | 最小显示高度（防止内容挤压） |
| `--img-chart-max-height-card`   | `400px`           | **卡片场景**最大高度         |
| `--img-chart-max-height-report` | `600px`           | **报告场景**最大高度         |
| `--img-chart-radius`            | `var(--radius-m)` | 默认圆角                     |
| `--img-chart-bg`                | `#FFFFFF`         | 图片容器背景（通常为白色底） |
| `--img-chart-hover-scale`       | `1.02`            | 悬停时的轻微缩放             |
| `--img-chart-transition`        | `0.2s ease`       | 统一的过渡动画时长           |
| **交互游标**                    |                   |                              |
| `--img-chart-cursor`            | `zoom-in`         | 指示可点击全屏               |

### 快速引用
```css
.my-insight-img {
    width: var(--img-chart-width); /* 100% */
    max-height: var(--img-chart-max-height-card);
    object-fit: var(--img-chart-object-fit); /* contain */
    border-radius: var(--img-chart-radius);
    transition: var(--img-chart-transition);
}
```


