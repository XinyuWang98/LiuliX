# LiuliX Design Tokens Cheatsheet

> **Tips:** This is the Single Source of Truth for LiuliX Visual Language. Use these tokens instead of hardcoded values.

## 1. Colors & Theme
| Token Name | Value Description | Purpose |
| :--- | :--- | :--- |
| **Foreground** | | |
| `--text-primary` | `#FFFFFF` | Main titles, high contrast text |
| `--text-secondary` | `rgba(235, 245, 255, 0.6)` | Subtitles, body text |
| `--text-dim` | `rgba(235, 245, 255, 0.3)` | Placeholders, disabled text |
| `--text-accent` | `#00f2fe` | **Neon Cyan** - Highlights, active states |
| **Background** | | |
| `--liuli-bg` | `#010305` | App global background (Deep Space) |
| `--bg-panel` | `rgba(44, 44, 46, 0.75)` | Legacy Solid Panel |
| `--bg-secondary` | `#252527` | Secondary areas (lists, inputs) |

## 2. Glassmorphism & Effects (Core)
| Token Name | Description | Visualization |
| :--- | :--- | :--- |
| **Backgrounds** | | |
| `--glass-surface` | `rgba(255,255,255, 0.03)` | Standard glass Card |
| `--glass-vignette-bg` | `radial-gradient(...)` | **Settings Modal** (Clear center, dark edges) |
| `--glass-ultra-clear-bg` | `linear-gradient(...)` | Transparent top layer |
| **Blurs** | | |
| `--blur-medium` | `12px` | Standard Components |
| `--blur-heavy-80` | `80px` | Deep Depth |
| `--blur-ultra` | `200px` | Background Object |
| **Borders** | | |
| `--glass-border` | `rgba(255,255,255, 0.15)` | Standard Border |
| `--glass-border-highlight`| `rgba(255,255,255, 0.4)` | Top Border (Fresnel) |

## 3. Layout Dimensions
| Token | Value |
| :--- | :--- |
| `--gap-s` / `m` / `l` | 8px / 16px / 24px |
| `--radius-m` | 8px (Standard) |
| `--radius-l` | 12px (Cards) |
| `--radius-xl` | 16px (Modals) |
| `--nav-height` | 64px |

## 4. Typography
- **Font**: `Inter` (Sans), `JetBrains Mono` (Code)
- **Sizes**: `--fs-sm` (14px), `--fs-base` (16px), `--fs-xl` (24px)
