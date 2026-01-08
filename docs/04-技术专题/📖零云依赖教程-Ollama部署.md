# 📖 零云依赖教程 - Ollama 本地部署指南

本教程将指导你如何安装和配置 Ollama，实现完全离线的 AI 数据分析。

---

## ✅ 为什么选择 Ollama？

- **🔒 数据隐私**：数据完全不出本机，无需上传云端
- **💰 零成本**：完全免费，无 API 调用费用
- **⚡ 高性能**：支持本地 GPU 加速（如有）
- **🌐 离线可用**：无需网络连接即可运行

---

## 📥 安装 Ollama

### macOS / Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows
下载安装器：[https://ollama.com/download](https://ollama.com/download)

### 验证安装
```bash
ollama --version
```

---

## 🚀 下载推荐模型

LiuliX 推荐使用以下模型（按性能排序）：

### 1. **Qwen2.5:7B**（推荐，平衡性能）
```bash
ollama pull qwen2.5:7b
```
- **大小**：~4.4 GB
- **内存需求**：≥8 GB RAM
- **特点**：中文友好，推理速度快

### 2. **DeepSeek V3.1 Cloud**（云端模型，无需下载）
```bash
# 无需 pull，直接在 LiuliX 中选择即可
```
- **大小**：0 MB（云端）
- **特点**：由 Ollama 官方提供云端推理服务

### 3. **Qwen2.5-Coder:14B**（专业级）
```bash
ollama pull qwen2.5-coder:14b
```
- **大小**：~8.9 GB
- **内存需求**：≥16 GB RAM
- **特点**：代码生成能力强

---

## 🎯 在 LiuliX 中配置

1. 打开 **Settings** → **AI Configuration**
2. 开启 **"使用本地模型"** 开关
3. 在模型列表中选择已下载的模型
4. 状态显示 **"Ollama Connected"** 即可使用

---

## 🔧 常见问题

### Ollama 未运行？
```bash
# 启动 Ollama 服务
ollama serve
```

### 模型列表为空？
确保已下载模型：
```bash
ollama list
```

### 推理速度慢？
- 检查硬件配置（推荐 ≥8 GB RAM）
- 使用小一点的模型（如 `qwen2.5:3b`）
- 如有 GPU，Ollama 会自动启用加速

---

## 📊 硬件推荐

| 模型              | 最低内存 | 推荐内存 | GPU  |
| ----------------- | -------- | -------- | ---- |
| Qwen2.5:3B        | 4 GB     | 8 GB     | 可选 |
| Qwen2.5:7B        | 8 GB     | 16 GB    | 推荐 |
| Qwen2.5-Coder:14B | 16 GB    | 32 GB    | 推荐 |

---

## 🌐 云端模式对比

| 特性         | Ollama 本地  | DeepSeek Cloud (内置 Key)   |
| ------------ | ------------ | --------------------------- |
| **隐私**     | ✅ 完全离线   | ⚠️ 数据上传云端              |
| **成本**     | ✅ 免费       | ⚠️ 消耗邀请码额度（20次/码） |
| **速度**     | 🟡 取决于硬件 | ✅ 快速                      |
| **生产环境** | ✅ 推荐       | ❌ 仅供试用                  |

---

## 📚 相关文档

- [API Key 使用说明与限制](./⚠️API-Key说明与限制.md)
- [数据脱敏策略说明](./🔒数据脱敏策略说明.md)
- [LiuliX 官方文档](https://github.com/your-repo)
- [Ollama 官网](https://ollama.com)

---

**🔥 提示**：如果你的硬件不支持本地运行，可以临时使用云端模式，但生产环境强烈推荐自备 API Key 或使用 Ollama。
