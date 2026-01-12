# 端到端测试报告 - MacBook + Chrome (MVP-V1)

**测试日期**: 2026-01-11
**测试环境**: MacBook Pro (M系列) + Chrome Browser
**测试结论**: ✅ **Passed (Green)** - 核心功能在百万行级表现优异，两百万行级稳定不崩溃。

---

## 1. 测试概览 (Overview)

本轮测试覆盖了两种不同规模的数据集，以验证系统在标准高负载与极限压力下的表现：

1.  **Standard Stress (标准压测)**: `trips_data_1m.csv` (100万行, 10列, ~100MB)
    *   *目标*: 验证流畅体验 (Green)，追求秒级响应。
2.  **Extreme Stress (极限压测)**: `big_sales_2m.csv` (200万行, 10列, ~220MB)
    *   *目标*: 验证系统稳定性 (Stability)，确保不崩溃 (OOM)、不假死。

---

## 2. 数据集 A: 100万行 (Standard Stress)

**文件名**: `trips_data_1m.csv`
**测试重点**: 速度、交互流畅度、AI 响应时效。

### 2.1 性能红绿灯 (Metrics)

| Metric               | Target (Green) | Limit (Yellow) | Actual     | Status |
| :------------------- | :------------- | :------------- | :--------- | :----- |
| **Load Time**        | < 12s          | < 20s          | **2.1s**   | 🟢 极佳 |
| **AI Suggestion**    | < 12s          | < 20s          | **5.2s**   | 🟢 优秀 |
| **Memory Peak**      | < 1.5GB        | < 2.5GB        | **1.32GB** | 🟢 正常 |
| **L1 Insight (1st)** | < 18s          | < 30s          | **12.4s**  | 🟢 达标 |

### 2.2 Prompt 质量详情
| Prompt ID             | Type     | Hit/Total | Score | Hullucination |
| :-------------------- | :------- | :-------- | :---- | :------------ |
| `cleaning_master`     | Router   | 1/1       | 5     | 0%            |
| `explorer-general-v1` | Router   | 1/1       | 5     | 0%            |
| `worker-trend-v1`     | Analysis | 1/1       | 5     | 0%            |

### 2.3 关键观察
*   **极速体验**: DuckDB-WASM 在 2秒左右完成加载，用户感知几乎无等待。
*   **交互丝滑**: 滚动、分页、列排序均为 60FPS，无掉帧。
*   **AI 准确**: 准确判断数据质量良好，生成的时序趋势图完全符合业务逻辑。

---

## 3. 数据集 B: 200万行 (Extreme Stress)

**文件名**: `big_sales_2m.csv`
**测试重点**: 内存边界、计算稳定性、超时处理。

### 3.1 性能红绿灯 (Metrics)

| Metric            | Target (Green) | Limit (Yellow) | Actual       | Status |
| :---------------- | :------------- | :------------- | :----------- | :----- |
| **Load Time**     | < 25s          | < 40s          | **25.8s**    | 🟡 尚可 |
| **AI Suggestion** | < 20s          | < 40s          | **48.9s**    | 🔴 超时 |
| **Memory Peak**   | < 2.5GB        | < 4.0GB        | **1.32GB**   | 🟢 极佳 |
| **Crash/OOM**     | No Crash       | -              | **No Crash** | 🟢 稳定 |

### 3.2 Prompt 质量详情
| Prompt ID         | Type   | Hit/Total | Score | Hullucination | 备注                                                     |
| :---------------- | :----- | :-------- | :---- | :------------ | :------------------------------------------------------- |
| `cleaning_master` | Router | 1/1       | 5     | 0%            | 准确判断数据质量 (耗时较长)                              |
| *L1/L2 Prompts*   | -      | -         | -     | -             | *Stress Test 阶段仅验证导入与清洗稳定性，未执行深度交互* |

### 3.3 关键观察
*   **加载瓶颈**: 耗时从 2s 激增至 25s，主要消耗在 CSV 文本解析与传输上，而非数据库插入。
*   **AI 瓶颈 (Core Issue)**: AI 清洗建议耗时近 **50s**。虽然未报错，但用户体验较差。
    *   *原因推测*: Prompt 构建时可能尝试读取了过多采样数据或 Schema 提取步骤在 JS 侧变慢。
*   **内存惊喜**: 内存占用并未随数据量线性翻倍（仍维持在 1.3GB 左右），证明 DuckDB 的列式存储压缩效率极高。

---

## 4. 总体结论与建议 (Summary)

### ✅ Passed (可发布)
MacBook + Chrome 环境下，MVP 版本已具备处理 **百万行级** 数据的商业交付能力。

### ⚠️ 已知风险与优化项
1.  **大文件 AI 优化 (P1)**: 针对 >100万行 的数据，AI 清洗流程必须引入 **Sampling (采样)** 机制，避免全量扫描导致的 50s+ 等待。
2.  **加载 Loading 态**: 2M 行加载需 25s，当前 Loading 动画需确保不会让用户误以为“死机”。

---
*附件: [端到端测试方案](44-测试-端到端测试方案.md)*
