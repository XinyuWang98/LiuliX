# 1. Ollama Local Deployment Guide

> **Last Updated**: 2026-01-13

This tutorial explains how to install and configure Ollama to support LiuliX's local AI capabilities.

---

## Core Features

> [!IMPORTANT]
> **Scope Note**:
> The Local Model (Ollama) connection functionality currently supports only **LiuliX Desktop** or **Local Development Environment**.
> **Web Online Version** cannot directly connect to the local Ollama service due to browser security policies.

- **Data Privacy**: Data remains on the local device
- **No Extra Cost**: No API call fees
- **Local Execution**: No continuous internet connection required

---

## Step 1: Install Ollama

### macOS / Linux
Open terminal and run:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows
Download the installer from the official website: [Download Ollama for Windows](https://ollama.com/download)

### Verify Installation
After installation, type in the terminal:
```bash
ollama --version
```

---

## Step 2: Download Recommended Models

LiuliX has been deeply optimized for the following models:

### 1. Qwen2.5:7B (Recommended)
The best balance between performance and speed, with excellent Chinese capability.
```bash
ollama pull qwen2.5:7b
```
- **VRAM Requirement**: About 8 GB
- **Suitable Devices**: M1/M2/M3 Mac (16GB+ RAM), NVIDIA RTX 3060+

### 2. DeepSeek R1 (Deep Think)
Excels at complex logical reasoning and code generation.
```bash
ollama pull deepseek-r1:7b
```

### 3. Qwen2.5:3B (Lightweight)
The first choice for older devices or low-spec computers.
```bash
ollama pull qwen2.5:3b
```
- **VRAM Requirement**: About 4 GB

---

## Step 3: Configure in LiuliX

1. Launch **LiuliX Desktop**, go to **Settings**.
2. Find **AI Configuration**.
3. Toggle on **"Use Local Model"**.
   > *(Note: This option is hidden by default in the Web Online Version settings)*
4. Select the model you just downloaded (e.g., `qwen2.5:7b`) from the dropdown menu.
5. When the status shows **"Ollama Connected"**, the configuration is complete.

---

## FAQ

### Q: Ollama is not running?
**A**: Please run `ollama serve` in the terminal to start the service.

### Q: Model not found in the dropdown list?
**A**: Please ensure the model has been downloaded successfully by running `ollama list`. Then refresh the LiuliX page.

### Q: Analysis speed is slow?
**A**: Local inference relies on hardware performance.
- **Recommended**: M1/M2/M3 Mac, or PC with a dedicated GPU.
- **Optimization**: Try using a version with fewer parameters (e.g., 3B).

---

## Mode Comparison

| Feature         | **Local Mode (Ollama)** | **Cloud Mode (Built-in)**        |
| :-------------- | :---------------------- | :------------------------------- |
| **Scope**       | **Desktop Only**        | **Web / Desktop**                |
| **Privacy**     | **Fully Offline**       | **Data Upload** (Even Sanitized) |
| **Cost**        | **Free**                | **Quota Consumed**               |
| **Speed**       | Hardware Dependent      | Stable & Fast                    |
| **Suitability** | **Production Choice**   | Quick Trial Only                 |

---

**LiuliX Team**
