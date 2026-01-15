# 📊 批量洞察分析测试报告 (V2)

> **生成时间**: 1/15/2026, 1:48:39 AM
> **测试方案**: 对齐 [47-测试-批量洞察分析测试方案](docs/03-测试验证/47-测试-批量洞察分析测试方案.md)

## Part 1: 数据集测试详情 (Detail per Dataset)

### [small_sales_100.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:40:30.330 | 📥 文件上传开始 | 0s | User Action |
| 01:40:30.815 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:40:36.476 | 🤖 AI建议返回 | 6.1s | Router Prompt Response |
| 01:40:52.167 | 🔄 代码膨胀完成 | 21.8s | 4/4 |
| 01:40:52.167 | 🚀 并发执行开始 | 21.8s | Batch Execution |
| 01:40:53.501 | ⭐ 第一个洞察成功 (TTFI) | 23.2s | Prompt: worker-groupby-v1 |
| 01:40:54.683 | 🔄 代码膨胀完成 | 24.4s | 5/5 |
| 01:40:54.683 | 🚀 并发执行开始 | 24.4s | Batch Execution |
| 01:40:56.658 | 🏁 最后一个洞察成功 | 26.3s | Total 9 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"region","value_c...` | - |
| 2 | `worker-groupby-v1` | 70 | ✅ Pass | `{"group_col":"product","value_...` | - |
| 3 | `worker-groupby-v1` | 70 | ✅ Pass | `{"group_col":"product","value_...` | - |
| 4 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"region","value_c...` | - |
| 5 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 6 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 7 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"quantity","col_y":"r...` | - |
| 8 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"revenue"}` | - |
| 9 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"quantity","col_y":"r...` | - |

**C. 错误日志 (Errors)**

> 01:40:30.820 [01:40:30.820] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [small_users_200.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:41:04.828 | 📥 文件上传开始 | 0s | User Action |
| 01:41:05.274 | ✅ 数据导入完成 | 0.4s | CSV导入 |
| 01:41:07.078 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 01:41:24.072 | 🔄 代码膨胀完成 | 19.2s | 4/4 |
| 01:41:24.072 | 🚀 并发执行开始 | 19.2s | Batch Execution |
| 01:41:24.077 | 🔄 代码膨胀完成 | 19.2s | 5/5 |
| 01:41:24.077 | 🚀 并发执行开始 | 19.2s | Batch Execution |
| 01:41:25.636 | ⭐ 第一个洞察成功 (TTFI) | 20.8s | Prompt: worker-stats-v1 |
| 01:41:27.550 | 🏁 最后一个洞察成功 | 22.7s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"income"}` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"city","value_col...` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"city","value_col...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"age","col_y":"income...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"age","col_y":"income...` | - |
| 6 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"age"}` | - |
| 7 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"income"}` | - |
| 8 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"age"}` | - |

**C. 错误日志 (Errors)**

> 01:41:03.056 [01:41:03.056] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:41:05.279 [01:41:05.279] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:41:24.108 [01:41:24.108] [AI服务] [洞察-基于年龄和收入对用户进行聚类，识别不同的用户细分群体] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [medium_feedback_800.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:41:36.111 | 📥 文件上传开始 | 0s | User Action |
| 01:41:36.550 | ✅ 数据导入完成 | 0.4s | CSV导入 |
| 01:41:38.350 | 🤖 AI建议返回 | 2.2s | Router Prompt Response |
| 01:41:55.769 | 🔄 代码膨胀完成 | 19.7s | 4/5 |
| 01:41:55.769 | 🚀 并发执行开始 | 19.7s | Batch Execution |
| 01:41:55.769 | 🔄 代码膨胀完成 | 19.7s | 4/4 |
| 01:41:55.769 | 🚀 并发执行开始 | 19.7s | Batch Execution |
| 01:41:57.434 | ⭐ 第一个洞察成功 (TTFI) | 21.3s | Prompt: worker-stats-v1 |
| 01:41:59.267 | 🏁 最后一个洞察成功 | 23.2s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sentiment","valu...` | - |
| 3 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 4 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sentiment","valu...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"rating","col_y":"res...` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"rating","col_y":"res...` | - |
| 7 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"rating"}` | - |
| 8 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"rating"}` | - |

**C. 错误日志 (Errors)**

> 01:41:34.326 [01:41:34.326] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:41:36.554 [01:41:36.554] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [medium_orders_500.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:42:08.006 | 📥 文件上传开始 | 0s | User Action |
| 01:42:08.504 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:42:10.308 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 01:42:28.618 | 🔄 代码膨胀完成 | 20.6s | 4/4 |
| 01:42:28.618 | 🚀 并发执行开始 | 20.6s | Batch Execution |
| 01:42:28.618 | 🔄 代码膨胀完成 | 20.6s | 4/5 |
| 01:42:28.618 | 🚀 并发执行开始 | 20.6s | Batch Execution |
| 01:42:30.315 | ⭐ 第一个洞察成功 (TTFI) | 22.3s | Prompt: worker-groupby-v1 |
| 01:42:32.043 | 🏁 最后一个洞察成功 | 24.0s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_method",...` | - |
| 2 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"discount"}` | - |
| 3 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"total_amount"}` | - |
| 4 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_method",...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"total_amount","col_y...` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"total_amount","col_y...` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"order_date","valu...` | - |
| 8 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"order_date","valu...` | - |

**C. 错误日志 (Errors)**

> 01:42:06.151 [01:42:06.151] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:42:08.508 [01:42:08.508] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [medium_stocks_1000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:42:40.014 | 📥 文件上传开始 | 0s | User Action |
| 01:42:40.512 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:42:42.336 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 01:43:00.530 | 🔄 代码膨胀完成 | 20.5s | 5/5 |
| 01:43:00.530 | 🚀 并发执行开始 | 20.5s | Batch Execution |
| 01:43:00.531 | 🔄 代码膨胀完成 | 20.5s | 5/5 |
| 01:43:00.531 | 🚀 并发执行开始 | 20.5s | Batch Execution |
| 01:43:02.541 | ⭐ 第一个洞察成功 (TTFI) | 22.5s | Prompt: worker-groupby-v1 |
| 01:43:04.530 | 🏁 最后一个洞察成功 | 24.5s | Total 10 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 70 | ✅ Pass | `{"group_col":"symbol","value_c...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"symbol","value_c...` | - |
| 3 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"volume"}` | - |
| 4 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"high"}` | - |
| 5 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"close"}` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"volume","col_y":"clo...` | - |
| 7 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"volume","col_y":"clo...` | - |
| 8 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 9 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 10 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"volume"}` | - |

**C. 错误日志 (Errors)**

> 01:42:38.285 [01:42:38.285] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:42:40.516 [01:42:40.516] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [large_employees_1500.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:43:12.919 | 📥 文件上传开始 | 0s | User Action |
| 01:43:13.371 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:43:15.196 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 01:43:30.936 | 🔄 代码膨胀完成 | 18.0s | 5/5 |
| 01:43:30.936 | 🚀 并发执行开始 | 18.0s | Batch Execution |
| 01:43:30.936 | 🔄 代码膨胀完成 | 18.0s | 5/5 |
| 01:43:30.936 | 🚀 并发执行开始 | 18.0s | Batch Execution |
| 01:43:32.595 | ⭐ 第一个洞察成功 (TTFI) | 19.7s | Prompt: worker-groupby-v1 |
| 01:43:33.122 | 🏁 最后一个洞察成功 | 20.2s | Total 4 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"department","val...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"department","val...` | - |
| 3 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"years_experience","c...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"years_experience","c...` | - |

**C. 错误日志 (Errors)**

> 01:43:10.871 [01:43:10.871] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:43:13.375 [01:43:13.375] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:43:30.969 [01:43:30.969] [AI服务] [洞察-基于多维特征对员工进行分群，识别人才类型] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object

> 01:43:30.974 [01:43:30.974] [AI服务] [洞察-基于多维度特征对员工进行分群] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [large_sensors_2000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:43:41.308 | 📥 文件上传开始 | 0s | User Action |
| 01:43:41.999 | ✅ 数据导入完成 | 0.7s | CSV导入 |
| 01:43:43.801 | 🤖 AI建议返回 | 2.5s | Router Prompt Response |
| 01:44:00.890 | 🔄 代码膨胀完成 | 19.6s | 5/5 |
| 01:44:00.890 | 🚀 并发执行开始 | 19.6s | Batch Execution |
| 01:44:02.355 | ⭐ 第一个洞察成功 (TTFI) | 21.0s | Prompt: worker-stats-v1 |
| 01:44:02.616 | 🔄 代码膨胀完成 | 21.3s | 5/5 |
| 01:44:02.616 | 🚀 并发执行开始 | 21.3s | Batch Execution |
| 01:44:04.998 | 🏁 最后一个洞察成功 | 23.7s | Total 9 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"humidity"}` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sensor_id","valu...` | - |
| 3 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 5 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sensor_id","valu...` | - |
| 6 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"pressure"}` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 8 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 9 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"pressure"}` | - |

**C. 错误日志 (Errors)**

> 01:43:39.611 [01:43:39.611] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:43:42.004 [01:43:42.004] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:44:02.620 [01:44:02.620] [AI服务] [洞察-基于温湿压多维度对传感器读数进行聚类，发现不同的环境模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [large_webtraffic_3000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:44:13.538 | 📥 文件上传开始 | 0s | User Action |
| 01:44:13.989 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:44:15.812 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 01:44:31.872 | 🔄 代码膨胀完成 | 18.3s | 5/5 |
| 01:44:31.872 | 🚀 并发执行开始 | 18.3s | Batch Execution |
| 01:44:33.027 | 🔄 代码膨胀完成 | 19.5s | 5/5 |
| 01:44:33.027 | 🚀 并发执行开始 | 19.5s | Batch Execution |
| 01:44:33.656 | ⭐ 第一个洞察成功 (TTFI) | 20.1s | Prompt: worker-groupby-v1 |
| 01:44:37.484 | 🏁 最后一个洞察成功 | 23.9s | Total 9 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"device","value_c...` | - |
| 2 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"bounce_rate"}` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"device","value_c...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"page_views","col_y":...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"page_views","col_y":...` | - |
| 6 | `worker-decision-tree-v1` | 70 | ✅ Pass | `{"target_col":"conversion","fe...` | - |
| 7 | `worker-regression-v1` | 70 | ✅ Pass | `{"target_col":"conversion","fe...` | - |
| 8 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"conversion"}` | - |
| 9 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"conversion"}` | - |

**C. 错误日志 (Errors)**

> 01:44:11.532 [01:44:11.532] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:44:13.993 [01:44:13.993] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:44:33.032 [01:44:33.032] [AI服务] [洞察-基于用户行为特征（浏览、时长、跳出）进行聚类，识别不同类型的用户群体。] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [xlarge_iot_20k.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:44:45.589 | 📥 文件上传开始 | 0s | User Action |
| 01:44:46.144 | ✅ 数据导入完成 | 0.6s | CSV导入 |
| 01:44:47.981 | 🤖 AI建议返回 | 2.4s | Router Prompt Response |
| 01:45:07.135 | 🔄 代码膨胀完成 | 21.5s | 5/5 |
| 01:45:07.135 | 🚀 并发执行开始 | 21.5s | Batch Execution |
| 01:45:08.567 | 🔄 代码膨胀完成 | 23.0s | 5/5 |
| 01:45:08.567 | 🚀 并发执行开始 | 23.0s | Batch Execution |
| 01:45:11.470 | ⭐ 第一个洞察成功 (TTFI) | 25.9s | Prompt: worker-outlier-v1 |
| 01:45:13.400 | 🏁 最后一个洞察成功 | 27.8s | Total 6 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"pressure"}` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"device_id","valu...` | - |
| 3 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"battery"}` | - |
| 4 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"status","value_c...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |

**C. 错误日志 (Errors)**

> 01:44:43.803 [01:44:43.803] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:44:46.149 [01:44:46.149] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:45:07.169 [01:45:07.169] [AI服务] [洞察-基于环境指标（温度、湿度、气压）对设备进行聚类，识别不同环境模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object

> 01:45:08.570 [01:45:08.570] [AI服务] [洞察-基于温湿压三个核心环境指标对设备进行聚类，识别不同的环境模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [xlarge_logs_8000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:45:21.598 | 📥 文件上传开始 | 0s | User Action |
| 01:45:22.100 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:45:23.915 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 01:45:42.121 | 🔄 代码膨胀完成 | 20.5s | 5/5 |
| 01:45:42.121 | 🚀 并发执行开始 | 20.5s | Batch Execution |
| 01:45:42.121 | 🔄 代码膨胀完成 | 20.5s | 5/5 |
| 01:45:42.121 | 🚀 并发执行开始 | 20.5s | Batch Execution |
| 01:45:45.063 | ⭐ 第一个洞察成功 (TTFI) | 23.5s | Prompt: worker-stats-v1 |
| 01:45:47.324 | 🏁 最后一个洞察成功 | 25.7s | Total 10 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"user_count"}` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"level","value_co...` | - |
| 3 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 4 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 5 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"level","value_co...` | - |
| 6 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 7 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"user_count","col_y":...` | - |
| 8 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"response_time_ms","c...` | - |
| 9 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 10 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |

**C. 错误日志 (Errors)**

> 01:45:19.810 [01:45:19.810] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:45:22.105 [01:45:22.105] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [mega_ecommerce_600k.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:45:55.866 | 📥 文件上传开始 | 0s | User Action |
| 01:45:56.899 | ✅ 数据导入完成 | 1.0s | CSV导入 |
| 01:45:58.819 | 🤖 AI建议返回 | 3.0s | Router Prompt Response |
| 01:46:16.909 | 🔄 代码膨胀完成 | 21.0s | 4/5 |
| 01:46:16.909 | 🚀 并发执行开始 | 21.0s | Batch Execution |
| 01:46:17.004 | 🔄 代码膨胀完成 | 21.1s | 4/4 |
| 01:46:17.004 | 🚀 并发执行开始 | 21.1s | Batch Execution |
| 01:46:39.699 | ⭐ 第一个洞察成功 (TTFI) | 43.8s | Prompt: worker-groupby-v1 |
| 01:46:44.342 | 🏁 最后一个洞察成功 | 48.5s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"region","value_c...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"region","value_c...` | - |
| 3 | `worker-correlation-v1` | 90 | ✅ Pass | `{"col_x":"customer_loyalty_sco...` | - |
| 4 | `worker-correlation-v1` | 90 | ✅ Pass | `{"col_x":"customer_loyalty_sco...` | - |
| 5 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"transaction_date"...` | - |
| 6 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"transaction_date"...` | - |
| 7 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"product_catego...` | - |
| 8 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"product_catego...` | - |

**C. 错误日志 (Errors)**

> 01:45:53.993 [01:45:53.993] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:45:56.912 [01:45:56.912] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [trips_data_1m.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:46:52.826 | 📥 文件上传开始 | 0s | User Action |
| 01:46:54.021 | ✅ 数据导入完成 | 1.2s | CSV导入 |
| 01:46:55.951 | 🤖 AI建议返回 | 3.1s | Router Prompt Response |
| 01:47:13.853 | 🔄 代码膨胀完成 | 21.0s | 5/5 |
| 01:47:13.853 | 🚀 并发执行开始 | 21.0s | Batch Execution |
| 01:47:15.945 | 🔄 代码膨胀完成 | 23.1s | 5/5 |
| 01:47:15.945 | 🚀 并发执行开始 | 23.1s | Batch Execution |
| 01:47:36.630 | ⭐ 第一个洞察成功 (TTFI) | 43.8s | Prompt: worker-stats-v1 |
| 01:47:41.786 | 🏁 最后一个洞察成功 | 49.0s | Total 10 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"passenger_coun...` | - |
| 2 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"trip_distance","col_...` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_type","v...` | - |
| 4 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"passenger_count"...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"trip_distance","col_...` | - |
| 6 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"trip_distance"...` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"pickup_datetime",...` | - |
| 8 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"trip_distance"...` | - |
| 9 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"pickup_datetime",...` | - |
| 10 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"payment_type"}` | - |

**C. 错误日志 (Errors)**

> 01:46:51.037 [01:46:51.037] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:46:54.029 [01:46:54.029] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [big_sales_2m.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:47:50.779 | 📥 文件上传开始 | 0s | User Action |
| 01:47:52.521 | ✅ 数据导入完成 | 1.7s | CSV导入 |
| 01:47:54.487 | 🤖 AI建议返回 | 3.7s | Router Prompt Response |
| 01:48:11.879 | 🔄 代码膨胀完成 | 21.1s | 5/5 |
| 01:48:11.879 | 🚀 并发执行开始 | 21.1s | Batch Execution |
| 01:48:13.256 | 🔄 代码膨胀完成 | 22.5s | 5/5 |
| 01:48:13.256 | 🚀 并发执行开始 | 22.5s | Batch Execution |
| 01:48:32.764 | ⭐ 第一个洞察成功 (TTFI) | 42.0s | Prompt: worker-groupby-v1 |
| 01:48:35.576 | 🏁 最后一个洞察成功 | 44.8s | Total 5 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"Country","value_...` | - |
| 2 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"UnitPrice"}` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"Country","value_...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"Quantity","col_y":"t...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"Quantity","col_y":"t...` | - |

**C. 错误日志 (Errors)**

> 01:47:48.893 [01:47:48.893] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:47:52.529 [01:47:52.529] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

## Part 2: 汇总分析 (Summary Analysis)

#### 1. 性能分析 (Performance Detail)

| 数据集量级 | 指标 | Avg (平均) | Min (最小) | Max (最大) | 样本数 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Small (<1MB)** | Import Time | 0.47s | 0.45s | 0.49s | 2 |
| | TTFI | 21.99s | 20.81s | 23.17s | 2 |
| | E2E Total | 27.81s | 26.05s | 29.56s | 2 |
| | Column Count | 5 | 5 | 5 | 2 |
| | AI Suggestion | 9.77s | 9.27s | 10.27s | 2 |
| | Prompt Length | 2037 | 2035 | 2039 | 2 |
| **Medium (1-10MB)** | Import Time | 0.48s | 0.44s | 0.50s | 3 |
| | TTFI | 22.05s | 21.32s | 22.53s | 3 |
| | E2E Total | 27.06s | 26.56s | 27.55s | 3 |
| | Column Count | 7 | 6 | 7 | 3 |
| | AI Suggestion | 9.99s | 8.33s | 11.77s | 3 |
| | Prompt Length | 2102 | 2084 | 2127 | 3 |
| **Large (10-100MB)** | Import Time | 0.53s | 0.45s | 0.69s | 5 |
| | TTFI | 22.04s | 19.68s | 25.88s | 5 |
| | E2E Total | 27.56s | 23.55s | 31.06s | 5 |
| | Column Count | 7 | 6 | 10 | 5 |
| | AI Suggestion | 8.23s | 7.62s | 9.61s | 5 |
| | Prompt Length | 2131 | 2086 | 2217 | 5 |
| **Mega (>100MB)** | Import Time | 1.32s | 1.03s | 1.74s | 3 |
| | TTFI | 43.21s | 41.98s | 43.83s | 3 |
| | E2E Total | 50.60s | 48.10s | 52.10s | 3 |
| | Column Count | 13 | 10 | 15 | 3 |
| | AI Suggestion | 10.52s | 8.03s | 11.97s | 3 |
| | Prompt Length | 2236 | 2221 | 2246 | 3 |

#### 2. Prompt 质量通过率 (Quality Pass Rate)

> **注**: "AI对应推荐总数" = 执行总数 + 验证拦截数(Blocked)。拦截数 (**7**) 来自 AI 引用了不存在列名被门控拦截。 

| Prompt ID | 执行总数 (Executed) | 通过次数 (Pass) | 拦截数 (Blocked) | 通过率 (Exec Rate) | 失败原因 (Fail/Block Reasons) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `worker-groupby-v1` | 28 | 28 | **0** | 100% | - |
| `worker-trend-v1` | 14 | 14 | **0** | 100% | - |
| `worker-correlation-v1` | 26 | 26 | **0** | 100% | - |
| `worker-distribution-v1` | 15 | 15 | **0** | 100% | - |
| `worker-stats-v1` | 13 | 13 | **0** | 100% | - |
| `洞察-基于年龄和收入对用户进行聚类，识别不同的用户细分群体] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `worker-outlier-v1` | 6 | 6 | **0** | 100% | - |
| `洞察-基于多维特征对员工进行分群，识别人才类型] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于多维度特征对员工进行分群] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于温湿压多维度对传感器读数进行聚类，发现不同的环境模式] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `worker-decision-tree-v1` | 1 | 1 | **0** | 100% | - |
| `worker-regression-v1` | 1 | 1 | **0** | 100% | - |
| `洞察-基于用户行为特征（浏览、时长、跳出）进行聚类，识别不同类型的用户群体。] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于环境指标（温度、湿度、气压）对设备进行聚类，识别不同环境模式] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于温湿压三个核心环境指标对设备进行聚类，识别不同的环境模式] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |

**验证拦截统计 (Validation Blocked)**: 共 **7** 次

> **拦截日志详情**:
> - [AI服务] [洞察-基于年龄和收入对用户进行聚类，识别不同的用户细分群体] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于多维特征对员工进行分群，识别人才类型] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于多维度特征对员工进行分群] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于温湿压多维度对传感器读数进行聚类，发现不同的环境模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于用户行为特征（浏览、时长、跳出）进行聚类，识别不同类型的用户群体。] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于环境指标（温度、湿度、气压）对设备进行聚类，识别不同环境模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于温湿压三个核心环境指标对设备进行聚类，识别不同的环境模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
