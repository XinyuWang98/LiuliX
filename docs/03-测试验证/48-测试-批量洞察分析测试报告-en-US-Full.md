# 📊 批量洞察分析测试报告 (V2)

> **生成时间**: 1/15/2026, 1:56:57 AM
> **测试方案**: 对齐 [47-测试-批量洞察分析测试方案](docs/03-测试验证/47-测试-批量洞察分析测试方案.md)

## Part 1: 数据集测试详情 (Detail per Dataset)

### [small_sales_100.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:48:50.924 | 📥 文件上传开始 | 0s | User Action |
| 01:48:51.435 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:48:56.572 | 🤖 AI建议返回 | 5.6s | Router Prompt Response |
| 01:49:12.341 | 🔄 代码膨胀完成 | 21.4s | 4/4 |
| 01:49:12.341 | 🚀 并发执行开始 | 21.4s | Batch Execution |
| 01:49:13.588 | ⭐ 第一个洞察成功 (TTFI) | 22.7s | Prompt: worker-groupby-v1 |
| 01:49:15.639 | 🔄 代码膨胀完成 | 24.7s | 4/4 |
| 01:49:15.639 | 🚀 并发执行开始 | 24.7s | Batch Execution |
| 01:49:16.855 | 🏁 最后一个洞察成功 | 25.9s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"region","value_c...` | - |
| 2 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 3 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"revenue"}` | - |
| 4 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 5 | `worker-groupby-v1` | 70 | ✅ Pass | `{"group_col":"product","value_...` | - |
| 6 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"product"}` | - |
| 7 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"quantity","col_y":"r...` | - |
| 8 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"quantity","col_y":"r...` | - |

**C. 错误日志 (Errors)**

> 01:48:51.442 [01:48:51.442] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [small_users_200.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:49:24.698 | 📥 文件上传开始 | 0s | User Action |
| 01:49:25.142 | ✅ 数据导入完成 | 0.4s | CSV导入 |
| 01:49:26.989 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 01:49:44.042 | 🔄 代码膨胀完成 | 19.3s | 5/5 |
| 01:49:44.042 | 🚀 并发执行开始 | 19.3s | Batch Execution |
| 01:49:44.429 | 🔄 代码膨胀完成 | 19.7s | 4/5 |
| 01:49:44.429 | 🚀 并发执行开始 | 19.7s | Batch Execution |
| 01:49:45.550 | ⭐ 第一个洞察成功 (TTFI) | 20.9s | Prompt: worker-groupby-v1 |
| 01:49:47.663 | 🏁 最后一个洞察成功 | 23.0s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"city","value_col...` | - |
| 2 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"income"}` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"city","value_col...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"age","col_y":"income...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"age","col_y":"income...` | - |
| 6 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"age"}` | - |
| 7 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"age"}` | - |
| 8 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"income"}` | - |

**C. 错误日志 (Errors)**

> 01:49:22.964 [01:49:22.964] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:49:25.146 [01:49:25.146] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:49:44.076 [01:49:44.076] [AI服务] [洞察-基于年龄和收入对用户进行聚类，识别细分群体] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [medium_feedback_800.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:49:55.884 | 📥 文件上传开始 | 0s | User Action |
| 01:49:56.387 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:49:58.235 | 🤖 AI建议返回 | 2.4s | Router Prompt Response |
| 01:50:14.878 | 🔄 代码膨胀完成 | 19.0s | 4/5 |
| 01:50:14.878 | 🚀 并发执行开始 | 19.0s | Batch Execution |
| 01:50:15.493 | 🔄 代码膨胀完成 | 19.6s | 4/5 |
| 01:50:15.493 | 🚀 并发执行开始 | 19.6s | Batch Execution |
| 01:50:16.691 | ⭐ 第一个洞察成功 (TTFI) | 20.8s | Prompt: worker-outlier-v1 |
| 01:50:18.640 | 🏁 最后一个洞察成功 | 22.8s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sentiment","valu...` | - |
| 3 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 4 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 5 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sentiment","valu...` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"rating","col_y":"res...` | - |
| 7 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"rating"}` | - |
| 8 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"rating"}` | - |

**C. 错误日志 (Errors)**

> 01:49:54.141 [01:49:54.141] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:49:56.392 [01:49:56.392] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [medium_orders_500.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:50:27.249 | 📥 文件上传开始 | 0s | User Action |
| 01:50:27.760 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:50:29.719 | 🤖 AI建议返回 | 2.5s | Router Prompt Response |
| 01:50:46.474 | 🔄 代码膨胀完成 | 19.2s | 3/5 |
| 01:50:46.474 | 🚀 并发执行开始 | 19.2s | Batch Execution |
| 01:50:47.729 | ⭐ 第一个洞察成功 (TTFI) | 20.5s | Prompt: worker-groupby-v1 |
| 01:50:48.117 | 🔄 代码膨胀完成 | 20.9s | 3/3 |
| 01:50:48.117 | 🚀 并发执行开始 | 20.9s | Batch Execution |
| 01:50:49.654 | 🏁 最后一个洞察成功 | 22.4s | Total 6 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_method",...` | - |
| 2 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"total_amount","col_y...` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_method",...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"total_amount","col_y...` | - |
| 5 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"order_date","valu...` | - |
| 6 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"order_date","valu...` | - |

**C. 错误日志 (Errors)**

> 01:50:25.450 [01:50:25.450] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:50:27.766 [01:50:27.766] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [medium_stocks_1000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:50:57.564 | 📥 文件上传开始 | 0s | User Action |
| 01:50:58.085 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:50:59.942 | 🤖 AI建议返回 | 2.4s | Router Prompt Response |
| 01:51:18.285 | 🔄 代码膨胀完成 | 20.7s | 5/5 |
| 01:51:18.285 | 🚀 并发执行开始 | 20.7s | Batch Execution |
| 01:51:18.285 | 🔄 代码膨胀完成 | 20.7s | 5/5 |
| 01:51:18.285 | 🚀 并发执行开始 | 20.7s | Batch Execution |
| 01:51:20.219 | ⭐ 第一个洞察成功 (TTFI) | 22.7s | Prompt: worker-stats-v1 |
| 01:51:22.237 | 🏁 最后一个洞察成功 | 24.7s | Total 10 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"high"}` | - |
| 2 | `worker-groupby-v1` | 70 | ✅ Pass | `{"group_col":"symbol","value_c...` | - |
| 3 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"volume"}` | - |
| 4 | `worker-groupby-v1` | 70 | ✅ Pass | `{"group_col":"symbol","value_c...` | - |
| 5 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"high"}` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"volume","col_y":"clo...` | - |
| 7 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"volume","col_y":"clo...` | - |
| 8 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 9 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 10 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"volume"}` | - |

**C. 错误日志 (Errors)**

> 01:50:55.824 [01:50:55.824] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:50:58.090 [01:50:58.090] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [large_employees_1500.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:51:30.658 | 📥 文件上传开始 | 0s | User Action |
| 01:51:31.107 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:51:32.932 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 01:51:50.359 | 🔄 代码膨胀完成 | 19.7s | 5/5 |
| 01:51:50.359 | 🚀 并发执行开始 | 19.7s | Batch Execution |
| 01:51:51.802 | ⭐ 第一个洞察成功 (TTFI) | 21.1s | Prompt: worker-stats-v1 |
| 01:51:51.970 | 🔄 代码膨胀完成 | 21.3s | 5/5 |
| 01:51:51.970 | 🚀 并发执行开始 | 21.3s | Batch Execution |
| 01:51:55.818 | 🏁 最后一个洞察成功 | 25.2s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"training_hours...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"department","val...` | - |
| 3 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"years_experience","c...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"years_experience","c...` | - |
| 5 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"department","val...` | - |
| 6 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"salary"}` | - |
| 7 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"salary"}` | - |
| 8 | `worker-regression-v1` | 70 | ✅ Pass | `{"target_col":"performance_sco...` | - |

**C. 错误日志 (Errors)**

> 01:51:28.846 [01:51:28.846] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:51:31.111 [01:51:31.111] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:51:50.391 [01:51:50.391] [AI服务] [洞察-基于薪资、经验和绩效对员工进行分群] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object

> 01:51:51.974 [01:51:51.974] [AI服务] [洞察-基于薪资、经验、绩效对员工进行分群，识别人才类型] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [large_sensors_2000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:52:04.377 | 📥 文件上传开始 | 0s | User Action |
| 01:52:05.095 | ✅ 数据导入完成 | 0.7s | CSV导入 |
| 01:52:06.941 | 🤖 AI建议返回 | 2.6s | Router Prompt Response |
| 01:52:21.480 | 🔄 代码膨胀完成 | 17.1s | 4/4 |
| 01:52:21.480 | 🚀 并发执行开始 | 17.1s | Batch Execution |
| 01:52:22.922 | ⭐ 第一个洞察成功 (TTFI) | 18.5s | Prompt: worker-groupby-v1 |
| 01:52:24.231 | 🔄 代码膨胀完成 | 19.9s | 5/5 |
| 01:52:24.231 | 🚀 并发执行开始 | 19.9s | Batch Execution |
| 01:52:25.729 | 🏁 最后一个洞察成功 | 21.4s | Total 9 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sensor_id","valu...` | - |
| 2 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 3 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 4 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"status"}` | - |
| 5 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"humidity"}` | - |
| 6 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 7 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sensor_id","valu...` | - |
| 8 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 9 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"pressure"}` | - |

**C. 错误日志 (Errors)**

> 01:52:02.650 [01:52:02.650] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:52:05.100 [01:52:05.100] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [large_webtraffic_3000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:52:34.207 | 📥 文件上传开始 | 0s | User Action |
| 01:52:34.695 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:52:36.592 | 🤖 AI建议返回 | 2.4s | Router Prompt Response |
| 01:52:53.109 | 🔄 代码膨胀完成 | 18.9s | 4/4 |
| 01:52:53.109 | 🚀 并发执行开始 | 18.9s | Batch Execution |
| 01:52:54.813 | ⭐ 第一个洞察成功 (TTFI) | 20.6s | Prompt: worker-groupby-v1 |
| 01:52:55.361 | 🔄 代码膨胀完成 | 21.2s | 5/5 |
| 01:52:55.361 | 🚀 并发执行开始 | 21.2s | Batch Execution |
| 01:52:58.879 | 🏁 最后一个洞察成功 | 24.7s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"device","value_c...` | - |
| 2 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"page_views","col_y":...` | - |
| 3 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"conversion"}` | - |
| 4 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"device","value_c...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"page_views","col_y":...` | - |
| 6 | `worker-decision-tree-v1` | 70 | ✅ Pass | `{"target_col":"conversion","fe...` | - |
| 7 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"conversion"}` | - |
| 8 | `worker-decision-tree-v1` | 70 | ✅ Pass | `{"target_col":"conversion","fe...` | - |

**C. 错误日志 (Errors)**

> 01:52:32.293 [01:52:32.293] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:52:34.700 [01:52:34.700] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:52:55.366 [01:52:55.366] [AI服务] [洞察-基于页面浏览、会话时长和跳出率对用户进行聚类，识别不同行为模式的用户群组。] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [xlarge_iot_20k.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:53:08.040 | 📥 文件上传开始 | 0s | User Action |
| 01:53:08.587 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:53:10.477 | 🤖 AI建议返回 | 2.4s | Router Prompt Response |
| 01:53:29.427 | 🔄 代码膨胀完成 | 21.4s | 5/5 |
| 01:53:29.427 | 🚀 并发执行开始 | 21.4s | Batch Execution |
| 01:53:30.315 | 🔄 代码膨胀完成 | 22.3s | 5/5 |
| 01:53:30.315 | 🚀 并发执行开始 | 22.3s | Batch Execution |
| 01:53:33.461 | ⭐ 第一个洞察成功 (TTFI) | 25.4s | Prompt: worker-groupby-v1 |
| 01:53:36.871 | 🏁 最后一个洞察成功 | 28.8s | Total 7 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"status","value_c...` | - |
| 2 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"temperature"}` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"status","value_c...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 6 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |

**C. 错误日志 (Errors)**

> 01:53:05.720 [01:53:05.720] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:53:08.599 [01:53:08.599] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:53:29.464 [01:53:29.464] [AI服务] [洞察-基于温度、湿度、气压进行聚类，识别不同的环境模式或设备运行场景。] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object

> 01:53:30.320 [01:53:30.320] [AI服务] [洞察-基于温湿压特征对设备或环境状态进行聚类，发现潜在模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [xlarge_logs_8000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:53:45.298 | 📥 文件上传开始 | 0s | User Action |
| 01:53:45.773 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 01:53:47.644 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 01:54:06.894 | 🔄 代码膨胀完成 | 21.6s | 5/5 |
| 01:54:06.894 | 🚀 并发执行开始 | 21.6s | Batch Execution |
| 01:54:06.895 | 🔄 代码膨胀完成 | 21.6s | 5/5 |
| 01:54:06.895 | 🚀 并发执行开始 | 21.6s | Batch Execution |
| 01:54:09.973 | ⭐ 第一个洞察成功 (TTFI) | 24.7s | Prompt: worker-groupby-v1 |
| 01:54:12.345 | 🏁 最后一个洞察成功 | 27.0s | Total 10 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"source","value_c...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"source","value_c...` | - |
| 3 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"user_count"}` | - |
| 4 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 5 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"response_time_ms","c...` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 8 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 9 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"level"}` | - |
| 10 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"level"}` | - |

**C. 错误日志 (Errors)**

> 01:53:43.529 [01:53:43.529] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:53:45.777 [01:53:45.777] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [mega_ecommerce_600k.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:54:20.504 | 📥 文件上传开始 | 0s | User Action |
| 01:54:21.543 | ✅ 数据导入完成 | 1.0s | CSV导入 |
| 01:54:23.496 | 🤖 AI建议返回 | 3.0s | Router Prompt Response |
| 01:54:42.468 | 🔄 代码膨胀完成 | 22.0s | 4/5 |
| 01:54:42.468 | 🚀 并发执行开始 | 22.0s | Batch Execution |
| 01:54:44.111 | 🔄 代码膨胀完成 | 23.6s | 4/4 |
| 01:54:44.111 | 🚀 并发执行开始 | 23.6s | Batch Execution |
| 01:55:03.313 | ⭐ 第一个洞察成功 (TTFI) | 42.8s | Prompt: worker-groupby-v1 |
| 01:55:08.321 | 🏁 最后一个洞察成功 | 47.8s | Total 7 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"product_category...` | - |
| 2 | `worker-correlation-v1` | 90 | ✅ Pass | `{"col_x":"customer_loyalty_sco...` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"product_category...` | - |
| 4 | `worker-correlation-v1` | 90 | ✅ Pass | `{"col_x":"customer_loyalty_sco...` | - |
| 5 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"transaction_date"...` | - |
| 6 | `worker-decision-tree-v1` | 70 | ✅ Pass | `{"target_col":"status","featur...` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"transaction_date"...` | - |

**C. 错误日志 (Errors)**

> 01:54:18.527 [01:54:18.527] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:54:21.554 [01:54:21.554] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:54:42.548 [01:54:42.548] [AI服务] 执行批次: 分析各产品类别的总销售额，识别热门与冷门品类, 探究客户忠诚度评分与消费金额是否存在关联, 分析销售额随时间的变化趋势，识别增长或下降周期, 构建决策树模型，识别影响交易状态（如成功/失败）的关键因素

> 01:54:42.554 [01:54:42.554] [AI服务] [洞察-构建决策树模型，识别影响交易状态（如成功/失败）的关键因素] 列名验证通过 JSHandle@object

> 01:54:42.554 [01:54:42.554] [AI服务] [洞察-构建决策树模型，识别影响交易状态（如成功/失败）的关键因素] 内存评估准备 JSHandle@object

> 01:54:42.554 [01:54:42.554] [AI服务] [洞察-构建决策树模型，识别影响交易状态（如成功/失败）的关键因素] 内存评估: full模式 JSHandle@object

> 01:54:44.115 [01:54:44.115] [AI服务] [洞察-基于年龄、忠诚度、消费金额对客户进行分群，实现精细化运营] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object

>  [TestProbe] InsightExecution {"promptId":"worker-decision-tree-v1","title":"构建决策树模型，识别影响交易状态（如成功/失败）的关键因素","score":70,"status":"Pass","params":{"target_col":"status","feature_cols":["product_category","product_price","region","payment_method","customer_loyalty_score"],"max_depth":5},"executionTime":0,"error":null}

> 01:55:08.318 [01:55:08.318] [AI服务] [洞察-构建决策树模型，识别影响交易状态（如成功/失败）的关键因素] 执行成功 JSHandle@object

> 01:55:08.318 [01:55:08.318] [AI洞察] [流式更新] 节点完成: 构建决策树模型，识别影响交易状态（如成功/失败）的关键因素 JSHandle@object


---

### [trips_data_1m.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:55:17.657 | 📥 文件上传开始 | 0s | User Action |
| 01:55:18.836 | ✅ 数据导入完成 | 1.2s | CSV导入 |
| 01:55:20.786 | 🤖 AI建议返回 | 3.1s | Router Prompt Response |
| 01:55:40.229 | 🔄 代码膨胀完成 | 22.6s | 4/4 |
| 01:55:40.229 | 🚀 并发执行开始 | 22.6s | Batch Execution |
| 01:55:40.233 | 🔄 代码膨胀完成 | 22.6s | 5/5 |
| 01:55:40.233 | 🚀 并发执行开始 | 22.6s | Batch Execution |
| 01:55:59.469 | ⭐ 第一个洞察成功 (TTFI) | 41.8s | Prompt: worker-stats-v1 |
| 01:56:03.306 | 🏁 最后一个洞察成功 | 45.6s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"passenger_coun...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_type","v...` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_type","v...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"trip_distance","col_...` | - |
| 5 | `worker-regression-v1` | 80 | ✅ Pass | `{"target_col":"total_amount","...` | - |
| 6 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"pickup_datetime",...` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"pickup_datetime",...` | - |
| 8 | `worker-regression-v1` | 80 | ✅ Pass | `{"target_col":"total_amount","...` | - |

**C. 错误日志 (Errors)**

> 01:55:15.862 [01:55:15.862] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:55:18.850 [01:55:18.850] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:55:40.305 [01:55:40.305] [AI服务] [洞察-基于行程距离、总费用和乘客数对行程进行聚类，识别不同的行程模式或套餐类型] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [big_sales_2m.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 01:56:12.176 | 📥 文件上传开始 | 0s | User Action |
| 01:56:13.899 | ✅ 数据导入完成 | 1.7s | CSV导入 |
| 01:56:15.935 | 🤖 AI建议返回 | 3.8s | Router Prompt Response |
| 01:56:34.854 | 🔄 代码膨胀完成 | 22.7s | 4/4 |
| 01:56:34.854 | 🚀 并发执行开始 | 22.7s | Batch Execution |
| 01:56:35.997 | 🔄 代码膨胀完成 | 23.8s | 4/4 |
| 01:56:35.997 | 🚀 并发执行开始 | 23.8s | Batch Execution |
| 01:56:52.125 | ⭐ 第一个洞察成功 (TTFI) | 39.9s | Prompt: worker-groupby-v1 |
| 01:56:54.680 | 🏁 最后一个洞察成功 | 42.5s | Total 4 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"Country","value_...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"Country","value_...` | - |
| 3 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"Quantity","col_y":"t...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"Quantity","col_y":"t...` | - |

**C. 错误日志 (Errors)**

> 01:56:10.403 [01:56:10.403] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 01:56:13.917 [01:56:13.917] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

## Part 2: 汇总分析 (Summary Analysis)

#### 1. 性能分析 (Performance Detail)

| 数据集量级 | 指标 | Avg (平均) | Min (最小) | Max (最大) | 样本数 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Small (<1MB)** | Import Time | 0.48s | 0.44s | 0.51s | 2 |
| | TTFI | 21.76s | 20.85s | 22.66s | 2 |
| | E2E Total | 27.56s | 26.06s | 29.06s | 2 |
| | Column Count | 5 | 5 | 5 | 2 |
| | AI Suggestion | 9.87s | 9.12s | 10.62s | 2 |
| | Prompt Length | 2037 | 2035 | 2039 | 2 |
| **Medium (1-10MB)** | Import Time | 0.51s | 0.51s | 0.52s | 3 |
| | TTFI | 21.31s | 20.48s | 22.66s | 3 |
| | E2E Total | 26.55s | 25.55s | 28.06s | 3 |
| | Column Count | 7 | 6 | 7 | 3 |
| | AI Suggestion | 10.84s | 8.08s | 12.23s | 3 |
| | Prompt Length | 2102 | 2084 | 2127 | 3 |
| **Large (10-100MB)** | Import Time | 0.54s | 0.45s | 0.72s | 5 |
| | TTFI | 22.08s | 18.55s | 25.42s | 5 |
| | E2E Total | 28.65s | 24.55s | 32.06s | 5 |
| | Column Count | 7 | 6 | 10 | 5 |
| | AI Suggestion | 8.56s | 7.71s | 10.88s | 5 |
| | Prompt Length | 2131 | 2086 | 2217 | 5 |
| **Mega (>100MB)** | Import Time | 1.31s | 1.04s | 1.72s | 3 |
| | TTFI | 41.52s | 39.95s | 42.81s | 3 |
| | E2E Total | 48.59s | 45.58s | 51.10s | 3 |
| | Column Count | 13 | 10 | 15 | 3 |
| | AI Suggestion | 9.03s | 7.90s | 9.62s | 3 |
| | Prompt Length | 2236 | 2221 | 2246 | 3 |

#### 2. Prompt 质量通过率 (Quality Pass Rate)

> **注**: "AI对应推荐总数" = 执行总数 + 验证拦截数(Blocked)。拦截数 (**8**) 来自 AI 引用了不存在列名被门控拦截。 

| Prompt ID | 执行总数 (Executed) | 通过次数 (Pass) | 拦截数 (Blocked) | 通过率 (Exec Rate) | 失败原因 (Fail/Block Reasons) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `worker-groupby-v1` | 26 | 26 | **0** | 100% | - |
| `worker-trend-v1` | 16 | 16 | **0** | 100% | - |
| `worker-stats-v1` | 11 | 11 | **0** | 100% | - |
| `worker-distribution-v1` | 14 | 14 | **0** | 100% | - |
| `worker-correlation-v1` | 23 | 23 | **0** | 100% | - |
| `洞察-基于年龄和收入对用户进行聚类，识别细分群体] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `worker-outlier-v1` | 5 | 5 | **0** | 100% | - |
| `worker-regression-v1` | 3 | 3 | **0** | 100% | - |
| `洞察-基于薪资、经验和绩效对员工进行分群] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于薪资、经验、绩效对员工进行分群，识别人才类型] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `worker-decision-tree-v1` | 3 | 3 | **0** | 100% | - |
| `洞察-基于页面浏览、会话时长和跳出率对用户进行聚类，识别不同行为模式的用户群组。] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于温度、湿度、气压进行聚类，识别不同的环境模式或设备运行场景。] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于温湿压特征对设备或环境状态进行聚类，发现潜在模式] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于年龄、忠诚度、消费金额对客户进行分群，实现精细化运营] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于行程距离、总费用和乘客数对行程进行聚类，识别不同的行程模式或套餐类型] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |

**验证拦截统计 (Validation Blocked)**: 共 **8** 次

> **拦截日志详情**:
> - [AI服务] [洞察-基于年龄和收入对用户进行聚类，识别细分群体] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于薪资、经验和绩效对员工进行分群] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于薪资、经验、绩效对员工进行分群，识别人才类型] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于页面浏览、会话时长和跳出率对用户进行聚类，识别不同行为模式的用户群组。] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于温度、湿度、气压进行聚类，识别不同的环境模式或设备运行场景。] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于温湿压特征对设备或环境状态进行聚类，发现潜在模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于年龄、忠诚度、消费金额对客户进行分群，实现精细化运营] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
> - [AI服务] [洞察-基于行程距离、总费用和乘客数对行程进行聚类，识别不同的行程模式或套餐类型] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object
