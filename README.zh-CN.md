# LiuliX (琉璃X)

[![Official Website](https://img.shields.io/badge/Website-www.liulix.com-blue?style=flat&logo=google-chrome)](https://www.liulix.com/)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-%E5%8A%A0%E5%85%A5%E7%A4%BE%E5%8C%BA-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.gg/Pr5nS9K7NT)
[![Demo Video](https://img.shields.io/badge/Demo-%E6%BC%94%E7%A4%BA%E8%A7%86%E9%A2%91-ea4335?style=flat&logo=google-drive&logoColor=white)](https://drive.google.com/file/d/1pufIsfCvH62iEBVFqk57cTyPTvPjzgby/view?usp=sharing)

> **Private, Powerful, Pure Browser-Based.**
> 下一代隐私优先的 AI 数据探索平台 (EDA)

[English](./README.md) | [**中文**](./README.zh-CN.md)

## 项目简介 (Introduction)

**LiuliX** 是一款基于 **React + TypeScript + Pyodide** 构建的现代化数据分析平台。它突破了传统 Web 分析工具的限制，通过 **WASM** 技术将完整的 Python 数据科学栈 (Pandas/Scikit-learn/DuckDB) 移植到浏览器端，实现了 **"Data Never Leaves Your Device"** (数据永不离机) 的极致隐私承诺，同时提供 AI 驱动的自动化探索能力。

## 🌟 核心特性 (Key Features)

- **🎨 Future Tech 设计**: 新拟态 (Neuomorphism) + 玻璃态 (Glassmorphism) 复合设计风格，支持沉浸式数据探索。
- **🤖 智能分析闭环**: 
    - **Router Prompt**: 基于 Schema 的智能意图路由 (Router -> Analyzer -> Visualizer)。
    - **Context Awareness**: EDA 闭环设计，自动注入历史洞察作为上下文，减少 AI 幻觉。
- **🔒 隐私优先架构**: 采用 "Local-First" 策略，所有数据处理 (DuckDB/Pandas) 均在浏览器本地完成，原始数据永不上传云端。

## 🏗 技术架构 (Technical Architecture)

本项目采用 **Browser-Native** 架构，充分利用现代浏览器算力：

### 1. 核心计算层 (Compute Layer)
- **Pyodide (Python on WASM)**: 完整移植 Pandas/Numpy/Scikit-learn 到浏览器环境。
- **DuckDB-WASM**: 用于百万级数据的高性能 SQL 预聚合与过滤。
- **Dynamic Worker Pool**: 
    - 实现自适应 Web Worker 池 (1-5个)，根据设备内存动态调度。
    - **渐进式预热**: 首个 Worker 立即响应，后续 Worker 后台静默加载，消除冷启动延迟。

### 2. 内存管理策略 (Memory Strategy)
- **动态评估算法**: 基于 `UserAgent` 设备指纹与可用内存 (`navigator.deviceMemory`)，智能计算最大安全行数。
- **Auto-Sampling**: 大文件自动降级为采样模式，防止 OOM (Out of Memory) 崩溃。

### 3. 可视化渲染 (Visualization)
- **Plotly.js**: 交互式图表渲染。
- **Virtual Scrolling**: 基于 `TanStack Virtual` 的高性能表格，支持 10w+ 行流畅滚动。

## 🛠 技术栈 (Tech Stack)

- **Framework**: React 18 + TypeScript + Vite
- **Data Engine**: Pyodide + DuckDB-WASM
- **State Management**: React Context + IndexedDB (Dexie)
- **UI System**: LiuliX Design System (CSS Variables + Glassmorphism)

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式 (Development)

启动前端与后端服务：

```bash
npm run dev:all
```

### 构建生产版本 (Build)

```bash
npm run build
```

### 预览生产版本 (Preview)

```bash
npm run preview
```

## 📂 项目结构

```text
src/
├── adapters/           # 适配器模式实现 (Pyodide等)
├── components/         # React 组件库
│   ├── analysis/       # 分析相关组件 (InsightCard, Notebook)
│   ├── cleaning/       # 数据清洗组件
│   ├── common/         # 通用 UI 组件 (LiuliX Design System)
│   ├── data/           # 数据加载与预览
│   ├── datagrid/       # 虚拟化表格组件
│   ├── evidence/       # 证据链管理
│   ├── exploration/    # 探索性分析组件
│   ├── insights/       # 洞察生成与渲染
│   ├── layout/         # 全局布局 (Sidebar, Navbar)
│   └── whitepaper/     # 白皮书渲染组件
├── config/             # 全局配置 (Prompt IDs, Charts, etc.)
├── contexts/           # React Context (State Management)
├── db/                 # IndexedDB 数据库层
├── hooks/              # 自定义 React Hooks
├── locales/            # i18n 国际化资源 (zh-CN/en-US)
├── pages/              # 页面路由组件
├── platforms/          # 跨平台层 (Browser/Server)
│   └── browser/        # 浏览器端实现 (WorkerPool)
├── services/           # 核心业务服务
│   ├── ai/             # AI 服务 (DeepSeek/Ollama)
│   ├── prompts/        # Prompt 工程库 (Router/Executor)
│   ├── codeQuality/    # 代码质量监测
│   └── skills/         # 技能注册表
├── styles/             # 全局 CSS 变量系统
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数 (Logger, Sanitizer)
├── workers/            # Web Workers (Pyodide)
└── App.tsx             # 应用入口
```

## 📄 License

Apache-2.0
