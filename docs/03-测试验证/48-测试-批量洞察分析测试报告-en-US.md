# 📊 批量洞察分析测试报告 (V2)

> **生成时间**: 1/14/2026, 11:32:34 PM
> **测试方案**: 对齐 [47-测试-批量洞察分析测试方案](docs/03-测试验证/47-测试-批量洞察分析测试方案.md)

## Part 1: 数据集测试详情 (Detail per Dataset)

### [small_sales_100.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:23:17.542 | 📥 文件上传开始          | 0s       | User Action               |
| 23:23:18.036 | ✅ 数据导入完成          | 0.5s     | CSV导入                   |
| 23:23:44.018 | 🔄 代码膨胀完成          | 26.5s    | 4/4                       |
| 23:23:44.018 | 🚀 并发执行开始          | 26.5s    | Batch Execution           |
| 23:23:45.543 | ⭐ 第一个洞察成功 (TTFI) | 28.0s    | Prompt: worker-groupby-v1 |
| 23:23:45.705 | 🔄 代码膨胀完成          | 28.2s    | 5/5                       |
| 23:23:45.705 | 🚀 并发执行开始          | 28.2s    | Batch Execution           |
| 23:23:49.161 | 🏁 最后一个洞察成功      | 31.6s    | Total 9 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID               | Score | Status | Params                              | Notes |
| :--- | :---------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"region","value_c...` | -     |
| 2    | `worker-groupby-v1`     | 70    | ✅ Pass | `{"group_col":"product","value_...` | -     |
| 3    | `worker-stats-v1`       | 70    | ✅ Pass | `{"column_name":"revenue"}`         | -     |
| 4    | `worker-groupby-v1`     | 70    | ✅ Pass | `{"group_col":"product","value_...` | -     |
| 5    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"region","value_c...` | -     |
| 6    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"quantity","col_y":"r...` | -     |
| 7    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"quantity","col_y":"r...` | -     |
| 8    | `worker-trend-v1`       | 80    | ✅ Pass | `{"date_col":"date","value_col"...` | -     |
| 9    | `worker-trend-v1`       | 80    | ✅ Pass | `{"date_col":"date","value_col"...` | -     |

**C. 错误日志 (Errors)**

> 23:23:18.041 [23:23:18.041] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [small_users_200.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:24:00.141 | 📥 文件上传开始          | 0s       | User Action               |
| 23:24:00.709 | ✅ 数据导入完成          | 0.6s     | CSV导入                   |
| 23:24:21.289 | 🔄 代码膨胀完成          | 21.1s    | 4/4                       |
| 23:24:21.289 | 🚀 并发执行开始          | 21.1s    | Batch Execution           |
| 23:24:22.084 | 🔄 代码膨胀完成          | 21.9s    | 5/5                       |
| 23:24:22.084 | 🚀 并发执行开始          | 21.9s    | Batch Execution           |
| 23:24:22.900 | ⭐ 第一个洞察成功 (TTFI) | 22.8s    | Prompt: worker-groupby-v1 |
| 23:24:25.404 | 🏁 最后一个洞察成功      | 25.3s    | Total 8 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID                | Score | Status | Params                              | Notes |
| :--- | :----------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-groupby-v1`      | 80    | ✅ Pass | `{"group_col":"city","value_col...` | -     |
| 2    | `worker-groupby-v1`      | 80    | ✅ Pass | `{"group_col":"city","value_col...` | -     |
| 3    | `worker-groupby-v1`      | 70    | ✅ Pass | `{"group_col":"gender","value_c...` | -     |
| 4    | `worker-correlation-v1`  | 80    | ✅ Pass | `{"col_x":"age","col_y":"income...` | -     |
| 5    | `worker-correlation-v1`  | 80    | ✅ Pass | `{"col_x":"age","col_y":"income...` | -     |
| 6    | `worker-distribution-v1` | 70    | ✅ Pass | `{"column_name":"age"}`             | -     |
| 7    | `worker-distribution-v1` | 70    | ✅ Pass | `{"column_name":"age"}`             | -     |
| 8    | `worker-distribution-v1` | 80    | ✅ Pass | `{"column_name":"income"}`          | -     |

**C. 错误日志 (Errors)**

> 23:23:57.927 [23:23:57.927] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:24:00.733 [23:24:00.733] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:24:21.326 [23:24:21.326] [AI服务] [洞察-基于年龄和收入对用户进行分群，识别潜在细分市场] 列名验证失败: 列不存在 JSHandle@object


---

### [medium_feedback_800.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                    |
| :----------- | :---------------------- | :------- | :---------------------- |
| 23:24:34.540 | 📥 文件上传开始          | 0s       | User Action             |
| 23:24:35.035 | ✅ 数据导入完成          | 0.5s     | CSV导入                 |
| 23:24:57.068 | 🔄 代码膨胀完成          | 22.5s    | 4/4                     |
| 23:24:57.068 | 🚀 并发执行开始          | 22.5s    | Batch Execution         |
| 23:24:57.069 | 🔄 代码膨胀完成          | 22.5s    | 4/5                     |
| 23:24:57.069 | 🚀 并发执行开始          | 22.5s    | Batch Execution         |
| 23:24:59.113 | ⭐ 第一个洞察成功 (TTFI) | 24.6s    | Prompt: worker-stats-v1 |
| 23:25:01.363 | 🏁 最后一个洞察成功      | 26.8s    | Total 8 Insights        |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID                | Score | Status | Params                              | Notes |
| :--- | :----------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-stats-v1`        | 80    | ✅ Pass | `{"column_name":"response_time_...` | -     |
| 2    | `worker-groupby-v1`      | 80    | ✅ Pass | `{"group_col":"sentiment","valu...` | -     |
| 3    | `worker-stats-v1`        | 80    | ✅ Pass | `{"column_name":"response_time_...` | -     |
| 4    | `worker-groupby-v1`      | 80    | ✅ Pass | `{"group_col":"sentiment","valu...` | -     |
| 5    | `worker-correlation-v1`  | 80    | ✅ Pass | `{"col_x":"rating","col_y":"res...` | -     |
| 6    | `worker-correlation-v1`  | 80    | ✅ Pass | `{"col_x":"rating","col_y":"res...` | -     |
| 7    | `worker-distribution-v1` | 70    | ✅ Pass | `{"column_name":"rating"}`          | -     |
| 8    | `worker-distribution-v1` | 70    | ✅ Pass | `{"column_name":"rating"}`          | -     |

**C. 错误日志 (Errors)**

> 23:24:32.464 [23:24:32.464] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:24:35.040 [23:24:35.040] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [medium_orders_500.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:25:09.882 | 📥 文件上传开始          | 0s       | User Action               |
| 23:25:10.429 | ✅ 数据导入完成          | 0.5s     | CSV导入                   |
| 23:25:31.644 | 🔄 代码膨胀完成          | 21.8s    | 3/4                       |
| 23:25:31.644 | 🚀 并发执行开始          | 21.8s    | Batch Execution           |
| 23:25:32.642 | 🔄 代码膨胀完成          | 22.8s    | 4/4                       |
| 23:25:32.642 | 🚀 并发执行开始          | 22.8s    | Batch Execution           |
| 23:25:33.363 | ⭐ 第一个洞察成功 (TTFI) | 23.5s    | Prompt: worker-groupby-v1 |
| 23:25:35.601 | 🏁 最后一个洞察成功      | 25.7s    | Total 7 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID               | Score | Status | Params                              | Notes |
| :--- | :---------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"payment_method",...` | -     |
| 2    | `worker-stats-v1`       | 80    | ✅ Pass | `{"column_name":"total_amount"}`    | -     |
| 3    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"payment_method",...` | -     |
| 4    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"total_amount","col_y...` | -     |
| 5    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"total_amount","col_y...` | -     |
| 6    | `worker-trend-v1`       | 90    | ✅ Pass | `{"date_col":"order_date","valu...` | -     |
| 7    | `worker-trend-v1`       | 90    | ✅ Pass | `{"date_col":"order_date","valu...` | -     |

**C. 错误日志 (Errors)**

> 23:25:08.006 [23:25:08.006] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:25:10.433 [23:25:10.433] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [medium_stocks_1000.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:25:47.062 | 📥 文件上传开始          | 0s       | User Action               |
| 23:25:47.643 | ✅ 数据导入完成          | 0.6s     | CSV导入                   |
| 23:26:08.204 | 🔄 代码膨胀完成          | 21.1s    | 4/4                       |
| 23:26:08.204 | 🚀 并发执行开始          | 21.1s    | Batch Execution           |
| 23:26:09.015 | 🔄 代码膨胀完成          | 22.0s    | 5/5                       |
| 23:26:09.015 | 🚀 并发执行开始          | 22.0s    | Batch Execution           |
| 23:26:10.410 | ⭐ 第一个洞察成功 (TTFI) | 23.3s    | Prompt: worker-outlier-v1 |
| 23:26:13.198 | 🏁 最后一个洞察成功      | 26.1s    | Total 9 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID                | Score | Status | Params                              | Notes |
| :--- | :----------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-outlier-v1`      | 80    | ✅ Pass | `{"column_name":"volume"}`          | -     |
| 2    | `worker-groupby-v1`      | 80    | ✅ Pass | `{"group_col":"symbol","value_c...` | -     |
| 3    | `worker-stats-v1`        | 70    | ✅ Pass | `{"column_name":"high"}`            | -     |
| 4    | `worker-groupby-v1`      | 70    | ✅ Pass | `{"group_col":"symbol","value_c...` | -     |
| 5    | `worker-correlation-v1`  | 80    | ✅ Pass | `{"col_x":"volume","col_y":"clo...` | -     |
| 6    | `worker-correlation-v1`  | 80    | ✅ Pass | `{"col_x":"volume","col_y":"clo...` | -     |
| 7    | `worker-trend-v1`        | 80    | ✅ Pass | `{"date_col":"date","value_col"...` | -     |
| 8    | `worker-trend-v1`        | 80    | ✅ Pass | `{"date_col":"date","value_col"...` | -     |
| 9    | `worker-distribution-v1` | 80    | ✅ Pass | `{"column_name":"volume"}`          | -     |

**C. 错误日志 (Errors)**

> 23:25:44.486 [23:25:44.486] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:25:47.648 [23:25:47.648] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [large_employees_1500.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:26:24.347 | 📥 文件上传开始          | 0s       | User Action               |
| 23:26:24.909 | ✅ 数据导入完成          | 0.6s     | CSV导入                   |
| 23:26:45.543 | 🔄 代码膨胀完成          | 21.2s    | 5/5                       |
| 23:26:45.543 | 🚀 并发执行开始          | 21.2s    | Batch Execution           |
| 23:26:46.992 | 🔄 代码膨胀完成          | 22.6s    | 5/5                       |
| 23:26:46.992 | 🚀 并发执行开始          | 22.6s    | Batch Execution           |
| 23:26:47.410 | ⭐ 第一个洞察成功 (TTFI) | 23.1s    | Prompt: worker-groupby-v1 |
| 23:26:48.326 | 🏁 最后一个洞察成功      | 24.0s    | Total 5 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID               | Score | Status | Params                              | Notes |
| :--- | :---------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"department","val...` | -     |
| 2    | `worker-outlier-v1`     | 80    | ✅ Pass | `{"column_name":"salary"}`          | -     |
| 3    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"department","val...` | -     |
| 4    | `worker-correlation-v1` | 90    | ✅ Pass | `{"col_x":"performance_score","...` | -     |
| 5    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"years_experience","c...` | -     |

**C. 错误日志 (Errors)**

> 23:26:21.801 [23:26:21.801] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:26:24.914 [23:26:24.914] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:26:46.998 [23:26:46.998] [AI服务] [洞察-基于薪资、经验、绩效和培训时长对员工进行分群，识别不同员工群体特征] 列名验证失败: 列不存在 JSHandle@object


---

### [large_sensors_2000.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:26:57.591 | 📥 文件上传开始          | 0s       | User Action               |
| 23:26:58.350 | ✅ 数据导入完成          | 0.8s     | CSV导入                   |
| 23:27:18.789 | 🔄 代码膨胀完成          | 21.2s    | 5/5                       |
| 23:27:18.789 | 🚀 并发执行开始          | 21.2s    | Batch Execution           |
| 23:27:19.038 | 🔄 代码膨胀完成          | 21.4s    | 5/5                       |
| 23:27:19.038 | 🚀 并发执行开始          | 21.4s    | Batch Execution           |
| 23:27:20.822 | ⭐ 第一个洞察成功 (TTFI) | 23.2s    | Prompt: worker-groupby-v1 |
| 23:27:23.464 | 🏁 最后一个洞察成功      | 25.9s    | Total 9 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID                | Score | Status | Params                              | Notes |
| :--- | :----------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-groupby-v1`      | 80    | ✅ Pass | `{"group_col":"sensor_id","valu...` | -     |
| 2    | `worker-stats-v1`        | 70    | ✅ Pass | `{"column_name":"temperature"}`     | -     |
| 3    | `worker-groupby-v1`      | 80    | ✅ Pass | `{"group_col":"sensor_id","valu...` | -     |
| 4    | `worker-outlier-v1`      | 70    | ✅ Pass | `{"column_name":"humidity"}`        | -     |
| 5    | `worker-correlation-v1`  | 80    | ✅ Pass | `{"col_x":"temperature","col_y"...` | -     |
| 6    | `worker-correlation-v1`  | 80    | ✅ Pass | `{"col_x":"temperature","col_y"...` | -     |
| 7    | `worker-trend-v1`        | 90    | ✅ Pass | `{"date_col":"timestamp","value...` | -     |
| 8    | `worker-trend-v1`        | 90    | ✅ Pass | `{"date_col":"timestamp","value...` | -     |
| 9    | `worker-distribution-v1` | 80    | ✅ Pass | `{"column_name":"status"}`          | -     |

**C. 错误日志 (Errors)**

> 23:26:55.522 [23:26:55.522] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:26:58.355 [23:26:58.355] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [large_webtraffic_3000.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:27:33.932 | 📥 文件上传开始          | 0s       | User Action               |
| 23:27:34.406 | ✅ 数据导入完成          | 0.5s     | CSV导入                   |
| 23:27:52.208 | 🔄 代码膨胀完成          | 18.3s    | 4/4                       |
| 23:27:52.208 | 🚀 并发执行开始          | 18.3s    | Batch Execution           |
| 23:27:54.323 | ⭐ 第一个洞察成功 (TTFI) | 20.4s    | Prompt: worker-groupby-v1 |
| 23:27:56.798 | 🔄 代码膨胀完成          | 22.9s    | 5/5                       |
| 23:27:56.798 | 🚀 并发执行开始          | 22.9s    | Batch Execution           |
| 23:27:59.983 | 🏁 最后一个洞察成功      | 26.1s    | Total 9 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID                 | Score | Status | Params                              | Notes |
| :--- | :------------------------ | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-groupby-v1`       | 80    | ✅ Pass | `{"group_col":"device","value_c...` | -     |
| 2    | `worker-correlation-v1`   | 80    | ✅ Pass | `{"col_x":"page_views","col_y":...` | -     |
| 3    | `worker-decision-tree-v1` | 70    | ✅ Pass | `{"target_col":"conversion","fe...` | -     |
| 4    | `worker-distribution-v1`  | 70    | ✅ Pass | `{"column_name":"conversion"}`      | -     |
| 5    | `worker-stats-v1`         | 70    | ✅ Pass | `{"column_name":"bounce_rate"}`     | -     |
| 6    | `worker-distribution-v1`  | 70    | ✅ Pass | `{"column_name":"conversion"}`      | -     |
| 7    | `worker-groupby-v1`       | 80    | ✅ Pass | `{"group_col":"device","value_c...` | -     |
| 8    | `worker-correlation-v1`   | 80    | ✅ Pass | `{"col_x":"page_views","col_y":...` | -     |
| 9    | `worker-decision-tree-v1` | 70    | ✅ Pass | `{"target_col":"conversion","fe...` | -     |

**C. 错误日志 (Errors)**

> 23:27:31.423 [23:27:31.423] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:27:34.410 [23:27:34.410] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [xlarge_iot_20k.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:28:09.854 | 📥 文件上传开始          | 0s       | User Action               |
| 23:28:10.530 | ✅ 数据导入完成          | 0.7s     | CSV导入                   |
| 23:28:31.584 | 🔄 代码膨胀完成          | 21.7s    | 5/5                       |
| 23:28:31.584 | 🚀 并发执行开始          | 21.7s    | Batch Execution           |
| 23:28:34.569 | 🔄 代码膨胀完成          | 24.7s    | 5/5                       |
| 23:28:34.569 | 🚀 并发执行开始          | 24.7s    | Batch Execution           |
| 23:28:35.662 | ⭐ 第一个洞察成功 (TTFI) | 25.8s    | Prompt: worker-groupby-v1 |
| 23:28:41.696 | 🏁 最后一个洞察成功      | 31.8s    | Total 7 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID               | Score | Status | Params                              | Notes |
| :--- | :---------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"status","value_c...` | -     |
| 2    | `worker-stats-v1`       | 70    | ✅ Pass | `{"column_name":"temperature"}`     | -     |
| 3    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"status","value_c...` | -     |
| 4    | `worker-outlier-v1`     | 80    | ✅ Pass | `{"column_name":"signal_strengt...` | -     |
| 5    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"temperature","col_y"...` | -     |
| 6    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"temperature","col_y"...` | -     |
| 7    | `worker-trend-v1`       | 90    | ✅ Pass | `{"date_col":"timestamp","value...` | -     |

**C. 错误日志 (Errors)**

> 23:28:08.046 [23:28:08.046] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:28:10.546 [23:28:10.546] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:28:31.622 [23:28:31.622] [AI服务] [洞察-基于温度、湿度、气压对设备/读数进行聚类，发现不同的环境模式组。] 列名验证失败: 列不存在 JSHandle@object

> 23:28:34.574 [23:28:34.574] [AI服务] [洞察-基于温湿压特征对设备进行聚类，识别不同的环境模式组] 列名验证失败: 列不存在 JSHandle@object


---

### [xlarge_logs_8000.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                    |
| :----------- | :---------------------- | :------- | :---------------------- |
| 23:28:52.312 | 📥 文件上传开始          | 0s       | User Action             |
| 23:28:53.131 | ✅ 数据导入完成          | 0.8s     | CSV导入                 |
| 23:29:17.370 | 🔄 代码膨胀完成          | 25.1s    | 5/5                     |
| 23:29:17.370 | 🚀 并发执行开始          | 25.1s    | Batch Execution         |
| 23:29:17.610 | 🔄 代码膨胀完成          | 25.3s    | 5/5                     |
| 23:29:17.610 | 🚀 并发执行开始          | 25.3s    | Batch Execution         |
| 23:29:20.526 | ⭐ 第一个洞察成功 (TTFI) | 28.2s    | Prompt: worker-stats-v1 |
| 23:29:24.200 | 🏁 最后一个洞察成功      | 31.9s    | Total 10 Insights       |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID               | Score | Status | Params                              | Notes |
| :--- | :---------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-stats-v1`       | 80    | ✅ Pass | `{"column_name":"response_time_...` | -     |
| 2    | `worker-outlier-v1`     | 80    | ✅ Pass | `{"column_name":"response_time_...` | -     |
| 3    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"level","value_co...` | -     |
| 4    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"level","value_co...` | -     |
| 5    | `worker-outlier-v1`     | 80    | ✅ Pass | `{"column_name":"response_time_...` | -     |
| 6    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"source","value_c...` | -     |
| 7    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"user_count","col_y":...` | -     |
| 8    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"response_time_ms","c...` | -     |
| 9    | `worker-trend-v1`       | 90    | ✅ Pass | `{"date_col":"timestamp","value...` | -     |
| 10   | `worker-trend-v1`       | 90    | ✅ Pass | `{"date_col":"timestamp","value...` | -     |

**C. 错误日志 (Errors)**

> 23:28:50.112 [23:28:50.112] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:28:53.156 [23:28:53.156] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [mega_ecommerce_600k.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:29:34.803 | 📥 文件上传开始          | 0s       | User Action               |
| 23:29:36.118 | ✅ 数据导入完成          | 1.3s     | CSV导入                   |
| 23:29:56.703 | 🔄 代码膨胀完成          | 21.9s    | 4/5                       |
| 23:29:56.703 | 🚀 并发执行开始          | 21.9s    | Batch Execution           |
| 23:29:59.160 | 🔄 代码膨胀完成          | 24.4s    | 4/4                       |
| 23:29:59.160 | 🚀 并发执行开始          | 24.4s    | Batch Execution           |
| 23:30:25.618 | ⭐ 第一个洞察成功 (TTFI) | 50.8s    | Prompt: worker-groupby-v1 |
| 23:30:27.774 | 🏁 最后一个洞察成功      | 53.0s    | Total 4 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID               | Score | Status | Params                              | Notes |
| :--- | :---------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"product_category...` | -     |
| 2    | `worker-correlation-v1` | 90    | ✅ Pass | `{"col_x":"customer_loyalty_sco...` | -     |
| 3    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"product_category...` | -     |
| 4    | `worker-correlation-v1` | 90    | ✅ Pass | `{"col_x":"customer_loyalty_sco...` | -     |

**C. 错误日志 (Errors)**

> 23:29:32.543 [23:29:32.543] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:29:36.139 [23:29:36.139] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [trips_data_1m.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:30:37.982 | 📥 文件上传开始          | 0s       | User Action               |
| 23:30:39.651 | ✅ 数据导入完成          | 1.7s     | CSV导入                   |
| 23:31:02.777 | 🔄 代码膨胀完成          | 24.8s    | 5/5                       |
| 23:31:02.777 | 🚀 并发执行开始          | 24.8s    | Batch Execution           |
| 23:31:04.765 | 🔄 代码膨胀完成          | 26.8s    | 4/4                       |
| 23:31:04.765 | 🚀 并发执行开始          | 26.8s    | Batch Execution           |
| 23:31:28.022 | ⭐ 第一个洞察成功 (TTFI) | 50.0s    | Prompt: worker-outlier-v1 |
| 23:31:31.328 | 🏁 最后一个洞察成功      | 53.3s    | Total 9 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID               | Score | Status | Params                              | Notes |
| :--- | :---------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-outlier-v1`     | 80    | ✅ Pass | `{"column_name":"trip_distance"...` | -     |
| 2    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"payment_type","v...` | -     |
| 3    | `worker-stats-v1`       | 70    | ✅ Pass | `{"column_name":"passenger_coun...` | -     |
| 4    | `worker-stats-v1`       | 70    | ✅ Pass | `{"column_name":"passenger_coun...` | -     |
| 5    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"payment_type","v...` | -     |
| 6    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"trip_distance","col_...` | -     |
| 7    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"trip_distance","col_...` | -     |
| 8    | `worker-trend-v1`       | 90    | ✅ Pass | `{"date_col":"pickup_datetime",...` | -     |
| 9    | `worker-trend-v1`       | 90    | ✅ Pass | `{"date_col":"pickup_datetime",...` | -     |

**C. 错误日志 (Errors)**

> 23:30:35.654 [23:30:35.654] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:30:39.666 [23:30:39.666] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [big_sales_2m.csv]

**A. 执行时间线 (Timeline)**

| 时间点       | 阶段                    | 累计耗时 | 说明                      |
| :----------- | :---------------------- | :------- | :------------------------ |
| 23:31:40.205 | 📥 文件上传开始          | 0s       | User Action               |
| 23:31:42.028 | ✅ 数据导入完成          | 1.8s     | CSV导入                   |
| 23:32:06.450 | 🔄 代码膨胀完成          | 26.2s    | 5/5                       |
| 23:32:06.450 | 🚀 并发执行开始          | 26.2s    | Batch Execution           |
| 23:32:06.450 | 🔄 代码膨胀完成          | 26.2s    | 5/5                       |
| 23:32:06.450 | 🚀 并发执行开始          | 26.2s    | Batch Execution           |
| 23:32:29.300 | ⭐ 第一个洞察成功 (TTFI) | 49.1s    | Prompt: worker-groupby-v1 |
| 23:32:31.612 | 🏁 最后一个洞察成功      | 51.4s    | Total 5 Insights          |

**B. 洞察执行详情 (Insights)**

| #    | Prompt ID               | Score | Status | Params                              | Notes |
| :--- | :---------------------- | :---- | :----- | :---------------------------------- | :---- |
| 1    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"Country","value_...` | -     |
| 2    | `worker-outlier-v1`     | 70    | ✅ Pass | `{"column_name":"Quantity"}`        | -     |
| 3    | `worker-groupby-v1`     | 80    | ✅ Pass | `{"group_col":"Country","value_...` | -     |
| 4    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"Quantity","col_y":"t...` | -     |
| 5    | `worker-correlation-v1` | 80    | ✅ Pass | `{"col_x":"Quantity","col_y":"t...` | -     |

**C. 错误日志 (Errors)**

> 23:31:38.289 [23:31:38.289] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:31:42.040 [23:31:42.040] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 23:32:06.526 [23:32:06.526] [AI服务] [洞察-基于购买行为对客户或商品进行聚类，识别细分群体] 列名验证失败: 列不存在 JSHandle@object


---

## Part 2: 汇总分析 (Summary Analysis)

#### 1. 性能分析 (Performance Detail)

| 数据集量级           | 指标        | Avg (平均) | Min (最小) | Max (最大) | 样本数 |
| :------------------- | :---------- | :--------- | :--------- | :--------- | :----- |
| **Small (<1MB)**     | Import Time | 0.55s      | 0.50s      | 0.60s      | 2      |
|                      | TTFI        | 25.40s     | 22.80s     | 28.00s     | 2      |
|                      | E2E Total   | 28.45s     | 25.30s     | 31.60s     | 2      |
| **Medium (1-10MB)**  | Import Time | 0.53s      | 0.50s      | 0.60s      | 3      |
|                      | TTFI        | 23.80s     | 23.30s     | 24.60s     | 3      |
|                      | E2E Total   | 26.20s     | 25.70s     | 26.80s     | 3      |
| **Large (10-100MB)** | Import Time | 0.68s      | 0.50s      | 0.80s      | 5      |
|                      | TTFI        | 24.14s     | 20.40s     | 28.20s     | 5      |
|                      | E2E Total   | 27.94s     | 24.00s     | 31.90s     | 5      |
| **Mega (>100MB)**    | Import Time | 1.60s      | 1.30s      | 1.80s      | 3      |
|                      | TTFI        | 49.97s     | 49.10s     | 50.80s     | 3      |
|                      | E2E Total   | 52.57s     | 51.40s     | 53.30s     | 3      |

#### 2. Prompt 质量通过率 (Quality Pass Rate)

> **注**: "AI对应推荐总数" = 执行总数 + 验证拦截数(Blocked)。拦截数 (**5**) 因日志未记录PromptID暂时无法分摊到具体模版。

| Prompt ID                 | 执行总数 (Executed) | 通过次数 (Pass) | 通过率 (Exec Rate) | 失败 (Fail) |
| :------------------------ | :------------------ | :-------------- | :----------------- | :---------- |
| `worker-groupby-v1`       | 30                  | 30              | 100%               | 0           |
| `worker-stats-v1`         | 11                  | 11              | 100%               | 0           |
| `worker-correlation-v1`   | 26                  | 26              | 100%               | 0           |
| `worker-trend-v1`         | 13                  | 13              | 100%               | 0           |
| `worker-distribution-v1`  | 9                   | 9               | 100%               | 0           |
| `worker-outlier-v1`       | 8                   | 8               | 100%               | 0           |
| `worker-decision-tree-v1` | 2                   | 2               | 100%               | 0           |

**验证拦截统计 (Validation Blocked)**: 共 **5** 次 (AI 幻觉生成的无效列名被门控拦截，未进入执行阶段)

> **拦截日志详情**:
> - 23:24:21.326 [23:24:21.326] [AI服务] [洞察-基于年龄和收入对用户进行分群，识别潜在细分市场] 列名验证失败: 列不存在 JSHandle@object
> - 23:26:46.998 [23:26:46.998] [AI服务] [洞察-基于薪资、经验、绩效和培训时长对员工进行分群，识别不同员工群体特征] 列名验证失败: 列不存在 JSHandle@object
> - 23:28:31.622 [23:28:31.622] [AI服务] [洞察-基于温度、湿度、气压对设备/读数进行聚类，发现不同的环境模式组。] 列名验证失败: 列不存在 JSHandle@object
> - 23:28:34.574 [23:28:34.574] [AI服务] [洞察-基于温湿压特征对设备进行聚类，识别不同的环境模式组] 列名验证失败: 列不存在 JSHandle@object
> - 23:32:06.526 [23:32:06.526] [AI服务] [洞察-基于购买行为对客户或商品进行聚类，识别细分群体] 列名验证失败: 列不存在 JSHandle@object

