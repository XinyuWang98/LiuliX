# LiuliX

[![Official Website](https://img.shields.io/badge/Website-www.liulix.com-blue?style=flat&logo=google-chrome)](https://www.liulix.com/)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.gg/Pr5nS9K7NT)

> **Private, Powerful, Pure Browser-Based.**
> Next-Generation Privacy-First AI Exploratory Data Analysis (EDA) Platform.

[**English**](./README.md) | [中文](./README.zh-CN.md)

## Introduction

**LiuliX** is a modern data analysis platform built with **React + TypeScript + Pyodide**. It breaks the limitations of traditional web analysis tools by porting the complete Python data science stack (Pandas/Scikit-learn/DuckDB) to the browser via **WASM**. This architecture delivers on the promise of **"Data Never Leaves Your Device"**, offering privacy-first, AI-driven automated exploration capabilities.

## 🌟 Key Features

- **🎨 Future Tech Design**: A composite design style featuring Neuomorphism and Glassmorphism for an immersive data exploration experience.
- **🤖 Intelligent Analysis Loop**:
    - **Router Prompt**: Schema-based intelligent intent routing (Router -> Analyzer -> Visualizer).
    - **Context Awareness**: EDA closed-loop design that automatically injects historical insights as context to reduce AI hallucinations.
- **🔒 Privacy-First Architecture**: Adopts a "Local-First" strategy where all data processing (DuckDB/Pandas) is performed locally in the browser. Raw data is never uploaded to the cloud.

## 🏗 Technical Architecture

This project adopts a **Browser-Native** architecture, fully utilizing modern browser computing power:

### 1. Compute Layer
- **Pyodide (Python on WASM)**: Complete implementation of Pandas/Numpy/Scikit-learn in the browser environment.
- **DuckDB-WASM**: High-performance SQL pre-aggregation and filtering for million-row datasets.
- **Dynamic Worker Pool**:
    - Adaptive Web Worker pool (1-5 workers) dynamically scheduled based on device memory.
    - **Progressive Warm-up**: The first worker responds immediately, while subsequent workers load silently in the background to eliminate cold start latency.

### 2. Memory Strategy
- **Dynamic Assessment Algorithm**: Intelligently calculates the maximum safe row count based on `UserAgent` device fingerprinting and available memory (`navigator.deviceMemory`).
- **Auto-Sampling**: Large files automatically degrade to sampling mode to prevent OOM (Out of Memory) crashes.

### 3. Visualization
- **Plotly.js**: Interactive chart rendering.
- **Virtual Scrolling**: High-performance tables based on `TanStack Virtual`, supporting smooth scrolling for 100k+ rows.

## 🛠 Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Data Engine**: Pyodide + DuckDB-WASM
- **State Management**: React Context + IndexedDB (Dexie)
- **UI System**: LiuliX Design System (CSS Variables + Glassmorphism)

## 🚀 Quick Start

### Development

Start frontend and backend services:

```bash
npm run dev:all
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## 📂 Project Structure

```text
src/
├── adapters/           # Adapter implementations (Pyodide, etc.)
├── components/         # React Component Library
│   ├── analysis/       # Analysis components (InsightCard, Notebook)
│   ├── cleaning/       # Data cleaning components
│   ├── common/         # Common UI components (LiuliX Design System)
│   ├── data/           # Data loading and preview
│   ├── datagrid/       # Virtualized table components
│   ├── evidence/       # Evidence chain management
│   ├── exploration/    # Exploratory analysis components
│   ├── insights/       # Insight generation and rendering
│   ├── layout/         # Global layout (Sidebar, Navbar)
│   └── whitepaper/     # Whitepaper rendering components
├── config/             # Global configuration (Prompt IDs, Charts, etc.)
├── contexts/           # React Context (State Management)
├── db/                 # IndexedDB database layer
├── hooks/              # Custom React Hooks
├── locales/            # i18n Resources (zh-CN/en-US)
├── pages/              # Page route components
├── platforms/          # Cross-platform layer (Browser/Server)
│   └── browser/        # Browser-side implementation (WorkerPool)
├── services/           # Core Business Services
│   ├── ai/             # AI Services (DeepSeek/Ollama)
│   ├── prompts/        # Prompt Engineering Library (Router/Executor)
│   ├── codeQuality/    # Code Quality Monitoring
│   └── skills/         # Skill Registry
├── styles/             # Global CSS Variable System
├── types/              # TypeScript Type Definitions
├── utils/              # Utility Functions (Logger, Sanitizer)
├── workers/            # Web Workers (Pyodide)
└── App.tsx             # Application Entry
```

## 📄 License

Apache-2.0
