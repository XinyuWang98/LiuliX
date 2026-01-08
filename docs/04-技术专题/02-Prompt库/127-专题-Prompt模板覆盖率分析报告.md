# 专题 - L2 Prompt 模板覆盖率分析报告

**文档信息**
- **创建时间**: 2026-01-08
- **状态**: 归档
- **标签**: #Prompt #L2 #模板化 #分析报告

---

## 1. 总体概览

本报告旨在盘点当前 Layer 2 (L2) 级别分析方法 Prompt 的模板化实施情况。L2 Prompt 位于 `src/services/prompts/library/l2/` 目录下，负责执行具体的数据分析任务（如聚类、回归、分布分析等）。

从 "AI 自由生成代码" 过渡到 "基于固定模板的代码生成" (Template-Based) 是 Prompt 库工程化的核心目标，旨在提升代码执行的稳定性、安全性和输出图表的一致性。

## 2. 覆盖率统计

通过对 codebase 的全量扫描，针对 12 个核心分析类 Prompt (`worker_*`) 的分析结果如下：

*   **L2 分析类 Prompt 总数**: 15 个 (新增 `worker_granger`, `worker_time_decomposition`, `worker_dbscan`)
*   **已模板化 (Template-Based)**: **15 个 (100%)**
*   **纯 AI 生成 (AI-Based)**: **0 个 (0%)**

所有分析能力（含新增的因果分析）均已完成工程化重构，具备稳定的 JSON 输出和标准化的图表风格。

## 3. 详细覆盖清单

以下是 L2 分析类 Prompt 的详细覆盖状态：

| ID | 模块名称 | 中文标题 | 执行模式 | 核心技术栈 | 覆盖状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `worker_cluster` | 聚类分析 | K-Means 聚类分析 | **Template** | sklearn, PCA | ✅ **已覆盖** |
| `worker_regression` | 回归分析 | OLS 多元线性回归 | **Template** | statsmodels | ✅ **已覆盖** |
| `worker_trend` | 时序分析 | 时序趋势分析 | **Template** | scipy, rolling | ✅ **已覆盖** |
| `worker_decision_tree`| 决策树 | 决策树分析 | **Template** | sklearn tree | ✅ **已覆盖** |
| `worker_correlation` | 相关性 | 双变量相关性分析 | **Template** | seaborn | ✅ **已覆盖** |
| `worker_distribution` | 分布分析 | 单变量分布分析 | **Template** | histogram, kde | ✅ **已覆盖** |
| `worker_crosstab` | 交叉分析 | 交叉表分析 | **Template** | crosstab, heatmap| ✅ **已覆盖** |
| `worker_groupby` | 分组聚合 | 分组聚合分析 | **Template** | groupby | ✅ **已覆盖** |
| `worker_topn` | 排名分析 | Top N 排名 | **Template** | sort_values | ✅ **已覆盖** |
| `worker_stats` | 描述统计 | 描述性统计 | **Template** | describe | ✅ **已覆盖** |
| `worker_outlier` | 异常检测 | 异常值检测 | **Template** | IQR Boxplot | ✅ **已覆盖** |
| `worker_missing` | 缺失分析 | 缺失值分析 | **Template** | isnull sum | ✅ **已覆盖** |
| `worker_granger` | 因果分析 | 格兰杰因果检验 | **Template** | statsmodels | ✅ **已覆盖** |
| `worker_time_decomposition` | 时序分解 | 季节性/趋势分解 | **Template** | seasonal_decompose | ✅ **已覆盖** |
| `worker_dbscan` | 密度聚类 | DBSCAN 聚类 | **Template** | sklearn.cluster | ✅ **已覆盖** |

> **注**: 清洗类 Prompt (`worker_clean_*`) 不包含在此次分析范围内。

## 4. 差距分析 (GAP Analysis) - 基于 EDA 方法论

基于 [Exploratory Data Analysis (EDA) 方法论](../04-技术专题/02-Prompt库/114-专题-因果分析与代码库.md) 和业界标准 (Wikipedia/NIST)，对当前 L2 Prompt 库进行全景对标分析，发现以下关键缺失：

### 4.1 因果分析 (Causal Analysis) - **Core Gap**
目前 L2 库仅支持基础的回归分析 (`worker_regression`) 和决策树 (`worker_decision_tree`)，但这属于关联分析范畴，无法进行严谨的因果推断。**因果分析能力的缺失是目前最大的 GAP。**

| 缺失方法 | 场景描述 | 优先级 | 建议方案 |
| :--- | :--- | :--- | :--- |
| **Granger Causality** | 时序因果检验 | **Done** | 已引入 `worker_granger` |
| **DoWhy / CausalML** | 通用因果推断 | **P2 (Med)** | 引入 `worker_causal_inference` (dowhy, 需依赖管理) |
| **PSM (倾向得分匹配)** | 消除混淆偏差 | **P2 (Med)** | 引入 `worker_psm` (sklearn + causalml) |
| **RDD (断点回归)** | 准实验设计 | **P3 (Low)** | 引入 `worker_rdd` (statsmodels) |

> **注**: 因果分析通常需要更复杂的依赖包 (DoWhy, CausalML)，需评估 Pyodide 环境支持情况。

### 4.2 高级时序分析 (Advanced Time Series)
目前仅支持基础趋势线 (`worker_trend`)，缺失深度时序挖掘能力。

| 缺失方法 | 场景描述 | 优先级 | 建议方案 |
| :--- | :--- | :--- | :--- |
| **Seasonal Decompose** | 季节性/趋势分解 | **Done** | 已引入 `worker_time_decomposition` |
| **Autocorrelation (ACF/PACF)** | 自相关性分析 | **P2 (Med)** | 引入 `worker_autocorrelation` (statsmodels) |
| **Stationarity Test** | 平稳性检验(ADF) | **P3 (Low)** | 引入 `worker_stationarity` (statsmodels) |

### 4.3 高级聚类与降维 (Advanced Clustering & DR)
目前仅支持 K-Means (`worker_cluster`) 和 DBSCAN (`worker_dbscan`)。

| 缺失方法 | 场景描述 | 优先级 | 建议方案 |
| :--- | :--- | :--- | :--- |
| **DBSCAN** | 密度聚类(发现任意形状) | **Done** | 已引入 `worker_dbscan` |
| **Hierarchical Clustering** | 层次聚类(树状图) | **P3 (Low)** | 引入 `worker_hierarchical` (scipy) |
| **t-SNE / UMAP** | 高维数据可视化 | **P3 (Low)** | 引入 `worker_manifold` (scikit-learn) |

## 5. 关键发现与建议

### 5.1 模板化成就
L2 分析库已达成 **100% 模板化覆盖**。
*   **`worker_missing`**: 已重构为标准 Python 模板，提供红黄绿三色缺失预警。
*   **`worker_granger`**: 已新增，填补了时序因果分析的空白。
*   **`worker_time_decomposition`**: 已新增，支持时序数据周期性/季节性拆解。
*   **`worker_dbscan`**: 已新增，支持基于密度的非凸数据聚类。

### 5.2 视觉统一性

### 5.2 视觉统一性
目前所有模板中的图表颜色（如 `#3498db`）多为硬编码。
*   **建议**: 建立 Python 侧的绘图样式配置注入机制，根据前端主题（亮色/暗色）动态传递颜色变量，确保图表与 UI 风格深度融合。

### 5.3 战略建议
1.  **短期 (v1.1)**: 优先补齐 **Granger Causality** (时序因果) 和 **Seasonal Decomposition** (时序分解)，这两个是 EDA 中高频且 Pyodide 支持良好的场景。
2.  **中期 (v1.2)**: 解决 `worker_missing` 的模板化遗留问题。
3.  **长期 (v2.0)**: 探索引入 `DoWhy` 等重型因果推断库在 WASM 环境下的可行性，构建真正的“因果分析”能力包。

## 6. 结论

L2 分析库的模板化改造已接近完成 (91.6%)，基础夯实。但从 EDA 方法论完备性角度看，**因果分析**和**高级时序分析**存在明显短板。

**下一步行动计划**:
1.  攻克最后一个模板化遗雷 (`worker_missing`)。
2.  启动 **P1 级 GAP (Granger Causality)** 的 Prompt 设计与实施。
3.  提升图表的美观度和对 LiuliX 视觉风格的适配度。
