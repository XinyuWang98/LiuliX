# 📊 批量洞察分析测试报告 (V2)

> **生成时间**: 1/14/2026, 11:19:02 PM
> **测试方案**: 对齐 [47-测试-批量洞察分析测试方案](docs/03-测试验证/47-测试-批量洞察分析测试方案.md)

## Part 1: 数据集测试详情 (Detail per Dataset)

### [mega_ecommerce_600k.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 23:15:41.629 | 📥 文件上传开始 | 0s | User Action |
| 23:15:43.467 | ✅ 数据导入完成 | 1.8s | CSV导入 |
| 23:16:10.389 | 🔄 代码膨胀完成 | 28.8s | 5/5 |
| 23:16:10.389 | 🚀 并发执行开始 | 28.8s | Batch Execution |
| 23:16:13.471 | 🔄 代码膨胀完成 | 31.9s | 4/4 |
| 23:16:13.471 | 🚀 并发执行开始 | 31.9s | Batch Execution |
| 23:16:48.179 | ⭐ 第一个洞察成功 (TTFI) | 66.5s | Prompt: worker-groupby-v1 |
| 23:16:51.422 | 🏁 最后一个洞察成功 | 69.8s | Total 3 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"product_category...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"product_category...` | - |
| 3 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"transaction_date"...` | - |

**C. 错误日志 (Errors)**

> 23:15:43.492 [23:15:43.492] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:16:10.504 [23:16:10.504] [AI服务] 执行批次: 分析客户忠诚度分数分布，了解客户忠诚度结构, 按产品类别汇总销售额，识别热门品类, 分析交易金额随时间的变化趋势, 探索客户年龄与最终消费金额之间的相关性, 使用决策树分析交易状态（如成功/失败）的关键影响因素

> 23:16:10.517 [23:16:10.517] [AI服务] [洞察-使用决策树分析交易状态（如成功/失败）的关键影响因素] 列名验证通过 JSHandle@object

> 23:16:10.517 [23:16:10.517] [AI服务] [洞察-使用决策树分析交易状态（如成功/失败）的关键影响因素] 内存评估准备 JSHandle@object

> 23:16:10.517 [23:16:10.517] [AI服务] [洞察-使用决策树分析交易状态（如成功/失败）的关键影响因素] 内存评估: full模式 JSHandle@object

> 23:16:13.473 [23:16:13.473] [AI服务] 执行批次: 分析不同产品类别的总销售额，识别热门和冷门品类, 探究客户忠诚度分数与单笔交易最终金额之间的相关性, 分析交易金额随时间的变化趋势，识别销售高峰期和低谷期, 使用决策树识别影响交易状态（如成功/失败）的关键因素

> 23:16:13.481 [23:16:13.481] [AI服务] [洞察-使用决策树识别影响交易状态（如成功/失败）的关键因素] 列名验证通过 JSHandle@object

> 23:16:13.482 [23:16:13.482] [AI服务] [洞察-使用决策树识别影响交易状态（如成功/失败）的关键因素] 内存评估准备 JSHandle@object

> 23:16:13.482 [23:16:13.482] [AI服务] [洞察-使用决策树识别影响交易状态（如成功/失败）的关键因素] 内存评估: full模式 JSHandle@object


---

### [trips_data_1m.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 23:17:00.674 | 📥 文件上传开始 | 0s | User Action |
| 23:17:02.327 | ✅ 数据导入完成 | 1.7s | CSV导入 |
| 23:17:25.744 | 🔄 代码膨胀完成 | 25.1s | 5/5 |
| 23:17:25.744 | 🚀 并发执行开始 | 25.1s | Batch Execution |
| 23:17:27.784 | 🔄 代码膨胀完成 | 27.1s | 4/4 |
| 23:17:27.784 | 🚀 并发执行开始 | 27.1s | Batch Execution |
| 23:17:50.088 | ⭐ 第一个洞察成功 (TTFI) | 49.4s | Prompt: worker-outlier-v1 |
| 23:17:54.520 | 🏁 最后一个洞察成功 | 53.8s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"trip_distance"...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_type","v...` | - |
| 3 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"passenger_coun...` | - |
| 4 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_type","v...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"trip_distance","col_...` | - |
| 6 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"pickup_datetime",...` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"pickup_datetime",...` | - |
| 8 | `worker-regression-v1` | 80 | ✅ Pass | `{"target_col":"total_amount","...` | - |

**C. 错误日志 (Errors)**

> 23:16:57.811 [23:16:57.811] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:17:02.344 [23:17:02.344] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:17:27.789 [23:17:27.789] [AI服务] [洞察-基于行程距离、总费用和乘客数对行程进行聚类，识别不同的行程模式或套餐类型] 列名验证失败: 列不存在 JSHandle@object


---

### [big_sales_2m.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 23:18:03.041 | 📥 文件上传开始 | 0s | User Action |
| 23:18:05.136 | ✅ 数据导入完成 | 2.1s | CSV导入 |
| 23:18:30.296 | 🔄 代码膨胀完成 | 27.3s | 5/5 |
| 23:18:30.296 | 🚀 并发执行开始 | 27.3s | Batch Execution |
| 23:18:30.297 | 🔄 代码膨胀完成 | 27.3s | 5/5 |
| 23:18:30.297 | 🚀 并发执行开始 | 27.3s | Batch Execution |
| 23:18:56.563 | ⭐ 第一个洞察成功 (TTFI) | 53.5s | Prompt: worker-groupby-v1 |
| 23:18:58.888 | 🏁 最后一个洞察成功 | 55.8s | Total 7 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"Country","value_...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"CustomerID","val...` | - |
| 3 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"UnitPrice"}` | - |
| 4 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"UnitPrice"}` | - |
| 5 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"Country","value_...` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"Quantity","col_y":"t...` | - |
| 7 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"Quantity","col_y":"t...` | - |

**C. 错误日志 (Errors)**

> 23:18:00.316 [23:18:00.316] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:18:05.155 [23:18:05.155] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

## Part 2: 汇总分析 (Summary Analysis)

#### 1. 性能分析 (Performance Types)

| 数据集量级 | 平均文件导入耗时 | 平均 TTFI (首洞察) | 平均 E2E 总耗时 |
| :--- | :--- | :--- | :--- |
| **Small (<1MB)** | - | - | - |
| **Medium (1-10MB)** | - | - | - |
| **Large (10-100MB)** | - | - | - |
| **Mega (>100MB)** | 1.86s | **56.50s** | 63.12s |

#### 2. Prompt 质量通过率 (Quality Pass Rate)

| Prompt ID | 调用次数 | 通过次数 | 通过率 (Pass Rate) | 主要失败原因 |
| :--- | :--- | :--- | :--- | :--- |
| `worker-groupby-v1` | 7 | 7 | 100% | - |
| `worker-trend-v1` | 3 | 3 | 100% | - |
| `worker-outlier-v1` | 2 | 2 | 100% | - |
| `worker-stats-v1` | 2 | 2 | 100% | - |
| `worker-correlation-v1` | 3 | 3 | 100% | - |
| `worker-regression-v1` | 1 | 1 | 100% | - |

