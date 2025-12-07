# DataPrism

Future Tech 风格的 AI 主导 EDA (探索性数据分析) 工具

## 项目简介

DataPrism 是一款纯前端的数据分析平台,基于 React + TypeScript + Pyodide 构建,实现完全本地化的数据处理和 AI 分析能力。

## 核心特性

- 🎨 **Future Tech 设计**: 新拟态风格,支持主题切换
- 🤖 **AI 主导分析**: 智能 Prompt 库,结构化假设验证
- 🔒 **数据隐私**: 100% 本地运行,数据不上传
- ⚡ **高性能**: Web Worker + Pyodide,异步计算不阻塞 UI
- 📊 **专业分析**: Pandas/Numpy 驱动,Plotly 可视化

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **数据处理**: Pyodide (Python in Browser)
- **图表库**: Plotly.js
- **数据库**: IndexedDB (Dexie)
- **表格组件**: TanStack Table

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
src/
├── types/              # TypeScript 类型定义
├── styles/             # 全局样式(CSS 变量系统)
├── themes/             # 主题配置
├── config/             # 配置文件(Prompt 库等)
├── contexts/           # React Context
├── workers/            # Web Workers
├── utils/              # 工具函数
├── components/         # React 组件
│   ├── layout/         # 布局组件
│   ├── data/           # 数据相关组件
│   ├── analysis/       # 分析相关组件
│   ├── report/         # 报告相关组件
│   └── common/         # 通用组件
├── App.tsx             # 主应用组件
└── main.tsx            # 入口文件
```

## 开发文档

详细的开发计划和任务清单请查看:
- `implementation_plan.md`: 实施计划
- `task.md`: 任务清单
- `PRD.md`: 产品需求文档

## License

MIT
