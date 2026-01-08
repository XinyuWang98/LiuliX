# 📖 Ollama 本地部署指南

本教程说明如何安装和配置 Ollama，以支持 LiuliX 的本地 AI 功能。

---

## ✅ 核心特性

- **数据隐私**：数据保留在本地设备
- **无额外费用**：无需支付 API 调用费
- **本地运行**：无需持续的网络连接

---

## 📥 第一步：安装 Ollama

### macOS / Linux
打开终端，运行以下命令：
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows
访问官网下载安装程序：[Download Ollama for Windows](https://ollama.com/download)

### 验证安装
安装完成后，在终端输入：
```bash
ollama --version
```

---

## 🚀 第二步：下载推荐模型

LiuliX 已针对以下模型进行了深度优化：

### 1. Qwen2.5:7B (推荐 ⭐)
平衡性能与速度的最佳选择，中文能力出色。
```bash
ollama pull qwen2.5:7b
```
- **显存需求**：约 8 GB
- **适用设备**：M1/M2/M3 Mac (16GB+ RAM), NVIDIA RTX 3060+

### 2. DeepSeek R1 (深度思考)
擅长复杂逻辑推理和代码生成。
```bash
ollama pull deepseek-r1:7b
```

### 3. Qwen2.5:3B (轻量级)
老旧设备或低配电脑的首选。
```bash
ollama pull qwen2.5:3b
```
- **显存需求**：约 4 GB

---

## 🎯 第三步：在 LiuliX 中配置

1. 启动 **LiuliX**，进入 **Settings** (设置)。
2. 找到 **AI Configuration** (AI 配置)。
3. 打开 **"Use Local Model"** (使用本地模型) 开关。
4. 在下拉菜单中选择你刚才下载的模型 (如 `qwen2.5:7b`)。
5. 当状态显示 **"Ollama Connected"** 时，配置即完成。

---

## 🔧 常见问题 (FAQ)

### Q: Ollama 未运行？
**A**: 请在终端执行 `ollama serve` 启动服务。

### Q: 下拉列表找不到模型？
**A**: 请先确认模型已下载成功，运行 `ollama list` 查看。然后刷新 LiuliX 页面。

### Q: 分析速度很慢？
**A**: 本地推理依赖硬件性能。
- **推荐**：M1/M2/M3 Mac, 或配备独立显卡的 PC。
- **优化**：尝试使用更小的模型参数版本 (如 3B)。

---

## 📊 模式对比

| 特性       | **Local Mode (Ollama)** | **Cloud Mode (Built-in)** |
| :--------- | :---------------------- | :------------------------ |
| **隐私性** | 🟢 **完全离线**          | 🟡 **数据上传** (即使脱敏) |
| **成本**   | 🟢 **免费**              | 🟡 **消耗额度**            |
| **速度**   | 依赖硬件                | 稳定快速                  |
| **适用性** | **生产环境首选**        | 仅供快速试用              |

---

** LiuliX Team **
