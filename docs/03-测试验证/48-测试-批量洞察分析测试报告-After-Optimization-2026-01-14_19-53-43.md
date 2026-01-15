# 📊 批量洞察分析测试报告 (V2) - 2026/01/15 04:03:06

> **生成时间**: 1/15/2026, 4:03:06 AM\
> **测试方案**: 对齐 [47-测试-批量洞察分析测试方案](docs/03-测试验证/47-测试-批量洞察分析测试方案.md)\
## Part 1: 数据集测试详情 (Detail per Dataset)

### [small_sales_100.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 03:53:50.002 | 📥 文件上传开始 | 0s | User Action |
| 03:53:50.534 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 03:53:56.237 | 🤖 AI建议返回 | 6.2s | Router Prompt Response |
| 03:55:18.312 | 🔄 代码膨胀完成 | 88.3s | 4/4 |
| 03:55:18.312 | 🚀 并发执行开始 | 88.3s | Batch Execution |
| 03:55:19.716 | ⭐ 第一个洞察成功 (TTFI) | 89.7s | Prompt: worker-stats-v1 |
| 03:55:22.296 | 🏁 最后一个洞察成功 | 92.3s | Total 4 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"revenue"}` | - |
| 2 | `worker-groupby-v1` | 70 | ✅ Pass | `{"group_col":"product","value_...` | - |
| 3 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"quantity","col_y":"r...` | - |

**C. 错误日志 (Errors)**

> 03:53:50.541 [03:53:50.541] [Python] 中文字体加载失败（不影响功能） JSHandle@object

>  Failed to load resource: the server responded with a status of 404 (Not Found)

>  [AI服务-洞察] ⚠️ 调用失败: Request failed with status code 404 Not Found: POST http://localhost:5173/api/proxy/deepseek-insight

>  [AI服务-清洗] ⚠️ 调用失败: Request failed with status code 404 Not Found: POST http://localhost:5173/api/proxy/deepseek-cleaning

> 03:53:56.275 [03:53:56.275] [AI清洗] Router失败: Error: 清洗建议 AI 调用失败

> 03:53:56.271 [03:53:56.271] [AI洞察] 流程失败 JSHandle@error
👉 错误详情:
[Error: 洞察建议 AI 调用失败]
Stack: Error: 洞察建议 AI 调用失败
    at askAIInsight (http://localhost:5173/src/services/aiService.ts:239:11)
    at async callCloudAPI (http://localhost:5173/src/services/aiInvoker.ts:117:20)
    at async invokeAI (http://localhost:5173/src/services/aiInvoker.ts:61:25)
    at async loadInsights (http://localhost:5173/src/hooks/useInsightLoaderV2.ts:129:26)
    at async handleLoadInsights (http://localhost:5173/src/components/insights/InsightChainFlow.tsx:71:20)

> 03:53:56.274 [03:53:56.274] [AI洞察] 流程失败 JSHandle@error
👉 错误详情:
[Error: 洞察建议 AI 调用失败]
Stack: Error: 洞察建议 AI 调用失败
    at askAIInsight (http://localhost:5173/src/services/aiService.ts:239:11)
    at async callCloudAPI (http://localhost:5173/src/services/aiInvoker.ts:117:20)
    at async invokeAI (http://localhost:5173/src/services/aiInvoker.ts:61:25)
    at async loadInsights (http://localhost:5173/src/hooks/useInsightLoaderV2.ts:129:26)
    at async handleLoadInsights (http://localhost:5173/src/components/insights/InsightChainFlow.tsx:71:20)

> 03:53:56.286 [03:53:56.286] [AI清洗] AI建议失败，已降级到规则引擎: 清洗建议 AI 调用失败

> 03:54:58.044 [03:54:58.044] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:54:58.045 [03:54:58.045] [系统] 配置初始化失败，将使用本地默认配置

> 03:54:58.450 [03:54:58.450] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:54:58.450 [03:54:58.450] [系统] 配置初始化失败，将使用本地默认配置

> 03:54:58.450 [03:54:58.450] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:55:00.928 [03:55:00.928] [AI洞察] 流程失败 JSHandle@error
👉 错误详情:
[Error: Table t_bc2d7c9f_c317_4131_aacd_9b2b1f2b398a_working does not exist. 数据表尚未ready，请稍候再试]
Stack: Error: Table t_bc2d7c9f_c317_4131_aacd_9b2b1f2b398a_working does not exist. 数据表尚未ready，请稍候再试
    at loadInsights (http://localhost:5173/src/hooks/useInsightLoaderV2.ts:41:17)
    at async handleLoadInsights (http://localhost:5173/src/components/insights/InsightChainFlow.tsx:71:20)

> 03:55:00.931 [03:55:00.931] [AI洞察] 流程失败 JSHandle@error
👉 错误详情:
[Error: Table t_bc2d7c9f_c317_4131_aacd_9b2b1f2b398a_working does not exist. 数据表尚未ready，请稍候再试]
Stack: Error: Table t_bc2d7c9f_c317_4131_aacd_9b2b1f2b398a_working does not exist. 数据表尚未ready，请稍候再试
    at loadInsights (http://localhost:5173/src/hooks/useInsightLoaderV2.ts:41:17)
    at async handleLoadInsights (http://localhost:5173/src/components/insights/InsightChainFlow.tsx:71:20)

>  JSHandle@error
👉 错误详情:
[Error: Catalog Error: Table with name t_bc2d7c9f_c317_4131_aacd_9b2b1f2b398a_working does not exist!
Did you mean "pg_am"?

LINE 1: DESCRIBE t_bc2d7c9f_c317_4131_aacd_9b2b1f2b398a_working
                 ^]
Stack: Error: Catalog Error: Table with name t_bc2d7c9f_c317_4131_aacd_9b2b1f2b398a_working does not exist!
Did you mean "pg_am"?

LINE 1: DESCRIBE t_bc2d7c9f_c317_4131_aacd_9b2b1f2b398a_working
                 ^
    at ha.runQuery (http://localhost:5173/node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js:1:738060)
    at xo.onMessage (http://localhost:5173/node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js:1:748160)
    at globalThis.onmessage (http://localhost:5173/node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js:1:771195)

>  JSHandle@error
👉 错误详情:
[Error: Catalog Error: Table with name undefined does not exist!
Did you mean "pg_depend"?

LINE 1: SELECT * FROM undefined LIMIT 1 OFFSET 0
                      ^]
Stack: Error: Catalog Error: Table with name undefined does not exist!
Did you mean "pg_depend"?

LINE 1: SELECT * FROM undefined LIMIT 1 OFFSET 0
                      ^
    at ha.runQuery (http://localhost:5173/node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js:1:738060)
    at xo.onMessage (http://localhost:5173/node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js:1:748160)
    at globalThis.onmessage (http://localhost:5173/node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js:1:771195)


---

### [small_users_200.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 03:55:31.168 | 📥 文件上传开始 | 0s | User Action |
| 03:55:31.611 | ✅ 数据导入完成 | 0.4s | CSV导入 |
| 03:55:33.467 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 03:55:49.824 | 🔄 代码膨胀完成 | 18.7s | 5/5 |
| 03:55:49.824 | 🚀 并发执行开始 | 18.7s | Batch Execution |
| 03:55:50.178 | 🔄 代码膨胀完成 | 19.0s | 4/4 |
| 03:55:50.178 | 🚀 并发执行开始 | 19.0s | Batch Execution |
| 03:55:51.278 | ⭐ 第一个洞察成功 (TTFI) | 20.1s | Prompt: worker-stats-v1 |
| 03:55:53.255 | 🏁 最后一个洞察成功 | 22.1s | Total 7 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"income"}` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"city","value_col...` | - |
| 3 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"income"}` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"age","col_y":"income...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"age","col_y":"income...` | - |
| 6 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"age"}` | - |
| 7 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"age"}` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 03:55:27.775 [03:55:27.775] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:55:27.775 [03:55:27.775] [系统] 配置初始化失败，将使用本地默认配置

> 03:55:28.769 [03:55:28.769] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:55:28.769 [03:55:28.769] [系统] 配置初始化失败，将使用本地默认配置

> 03:55:29.302 [03:55:29.302] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:55:29.302 [03:55:29.302] [系统] 配置初始化失败，将使用本地默认配置

> 03:55:29.303 [03:55:29.303] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:55:30.197 [03:55:30.197] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:55:30.197 [03:55:30.197] [系统] 配置初始化失败，将使用本地默认配置

> 03:55:30.574 [03:55:30.574] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:55:30.575 [03:55:30.575] [系统] 配置初始化失败，将使用本地默认配置

> 03:55:31.615 [03:55:31.615] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:55:49.858 [03:55:49.858] [AI服务] [洞察-基于年龄和收入对用户进行聚类，识别细分群体] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object

> 03:55:50.182 [03:55:50.182] [AI服务] [洞察-基于年龄和收入对用户进行聚类，识别不同的用户细分群体] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [medium_feedback_800.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 03:56:02.063 | 📥 文件上传开始 | 0s | User Action |
| 03:56:02.511 | ✅ 数据导入完成 | 0.4s | CSV导入 |
| 03:56:04.364 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 03:56:19.700 | 🔄 代码膨胀完成 | 17.6s | 5/5 |
| 03:56:19.700 | 🚀 并发执行开始 | 17.6s | Batch Execution |
| 03:56:21.231 | 🔄 代码膨胀完成 | 19.2s | 4/5 |
| 03:56:21.231 | 🚀 并发执行开始 | 19.2s | Batch Execution |
| 03:56:21.425 | ⭐ 第一个洞察成功 (TTFI) | 19.4s | Prompt: worker-outlier-v1 |
| 03:56:23.601 | 🏁 最后一个洞察成功 | 21.5s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 2 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sentiment","valu...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"rating","col_y":"res...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"response_time_hours"...` | - |
| 6 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"category","value...` | - |
| 7 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"rating"}` | - |
| 8 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"rating"}` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 03:55:58.842 [03:55:58.842] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:55:58.842 [03:55:58.842] [系统] 配置初始化失败，将使用本地默认配置

> 03:55:58.966 [03:55:58.966] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:55:58.966 [03:55:58.966] [系统] 配置初始化失败，将使用本地默认配置

> 03:55:59.858 [03:55:59.858] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:55:59.859 [03:55:59.859] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:00.159 [03:56:00.159] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:00.160 [03:56:00.160] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:00.160 [03:56:00.160] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:56:01.083 [03:56:01.083] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:01.083 [03:56:01.083] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:01.484 [03:56:01.484] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:01.484 [03:56:01.484] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:02.515 [03:56:02.515] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [medium_orders_500.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 03:56:31.775 | 📥 文件上传开始 | 0s | User Action |
| 03:56:32.276 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 03:56:34.134 | 🤖 AI建议返回 | 2.4s | Router Prompt Response |
| 03:56:49.797 | 🔄 代码膨胀完成 | 18.0s | 4/5 |
| 03:56:49.797 | 🚀 并发执行开始 | 18.0s | Batch Execution |
| 03:56:51.198 | ⭐ 第一个洞察成功 (TTFI) | 19.4s | Prompt: worker-groupby-v1 |
| 03:56:53.268 | 🔄 代码膨胀完成 | 21.5s | 4/4 |
| 03:56:53.268 | 🚀 并发执行开始 | 21.5s | Batch Execution |
| 03:56:53.926 | 🏁 最后一个洞察成功 | 22.2s | Total 7 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_method",...` | - |
| 2 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"total_amount","col_y...` | - |
| 3 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"order_date","valu...` | - |
| 4 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"order_date","valu...` | - |
| 5 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"customer_id","va...` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"total_amount","col_y...` | - |
| 7 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"total_amount"}` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 03:56:28.651 [03:56:28.651] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:28.651 [03:56:28.651] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:28.747 [03:56:28.747] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:28.747 [03:56:28.747] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:29.601 [03:56:29.601] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:29.601 [03:56:29.601] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:29.887 [03:56:29.887] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:29.887 [03:56:29.887] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:29.888 [03:56:29.888] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:56:30.789 [03:56:30.789] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:30.790 [03:56:30.790] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:31.193 [03:56:31.193] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:31.193 [03:56:31.193] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:32.280 [03:56:32.280] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [medium_stocks_1000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 03:57:02.559 | 📥 文件上传开始 | 0s | User Action |
| 03:57:03.084 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 03:57:04.921 | 🤖 AI建议返回 | 2.4s | Router Prompt Response |
| 03:57:20.527 | 🔄 代码膨胀完成 | 18.0s | 5/5 |
| 03:57:20.527 | 🚀 并发执行开始 | 18.0s | Batch Execution |
| 03:57:22.174 | 🔄 代码膨胀完成 | 19.6s | 5/5 |
| 03:57:22.174 | 🚀 并发执行开始 | 19.6s | Batch Execution |
| 03:57:22.219 | ⭐ 第一个洞察成功 (TTFI) | 19.7s | Prompt: worker-groupby-v1 |
| 03:57:25.337 | 🏁 最后一个洞察成功 | 22.8s | Total 10 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"symbol","value_c...` | - |
| 2 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"high"}` | - |
| 3 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"volume"}` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"volume","col_y":"clo...` | - |
| 5 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"symbol","value_c...` | - |
| 6 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"high"}` | - |
| 7 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"volume","col_y":"clo...` | - |
| 8 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 9 | `worker-trend-v1` | 80 | ✅ Pass | `{"date_col":"date","value_col"...` | - |
| 10 | `worker-regression-v1` | 70 | ✅ Pass | `{"target_col":"close","feature...` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 03:56:59.089 [03:56:59.089] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:59.089 [03:56:59.089] [系统] 配置初始化失败，将使用本地默认配置

> 03:56:59.451 [03:56:59.451] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:56:59.451 [03:56:59.451] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:00.208 [03:57:00.208] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:57:00.208 [03:57:00.208] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:00.763 [03:57:00.763] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:57:00.763 [03:57:00.763] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:00.763 [03:57:00.763] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:57:01.681 [03:57:01.681] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:57:01.681 [03:57:01.681] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:01.975 [03:57:01.975] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:57:01.975 [03:57:01.975] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:03.089 [03:57:03.089] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [large_employees_1500.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 03:57:33.838 | 📥 文件上传开始 | 0s | User Action |
| 03:57:34.341 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 03:57:36.221 | 🤖 AI建议返回 | 2.4s | Router Prompt Response |
| 03:57:53.641 | 🔄 代码膨胀完成 | 19.8s | 5/5 |
| 03:57:53.641 | 🚀 并发执行开始 | 19.8s | Batch Execution |
| 03:57:55.016 | 🔄 代码膨胀完成 | 21.2s | 5/5 |
| 03:57:55.016 | 🚀 并发执行开始 | 21.2s | Batch Execution |
| 03:57:55.159 | ⭐ 第一个洞察成功 (TTFI) | 21.3s | Prompt: worker-groupby-v1 |
| 03:57:59.349 | 🏁 最后一个洞察成功 | 25.5s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"department","val...` | - |
| 2 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"years_experience","c...` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"department","val...` | - |
| 4 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"performance_sc...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"years_experience","c...` | - |
| 6 | `worker-decision-tree-v1` | 70 | ✅ Pass | `{"target_col":"performance_sco...` | - |
| 7 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"performance_sc...` | - |
| 8 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"salary"}` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 03:57:30.607 [03:57:30.607] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:57:30.607 [03:57:30.607] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:30.667 [03:57:30.667] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:57:30.667 [03:57:30.667] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:31.544 [03:57:31.544] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:57:31.544 [03:57:31.544] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:31.955 [03:57:31.955] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:57:31.956 [03:57:31.956] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:31.956 [03:57:31.956] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:57:32.846 [03:57:32.846] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:57:32.846 [03:57:32.846] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:33.227 [03:57:33.227] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:57:33.228 [03:57:33.228] [系统] 配置初始化失败，将使用本地默认配置

> 03:57:34.346 [03:57:34.346] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:57:53.676 [03:57:53.676] [AI服务] [洞察-基于薪资、经验、绩效和培训时长对员工进行聚类，识别不同特征群体] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object

> 03:57:55.021 [03:57:55.021] [AI服务] [洞察-基于多维度特征对员工进行分群，识别人才类型] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [large_sensors_2000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 03:58:07.863 | 📥 文件上传开始 | 0s | User Action |
| 03:58:08.611 | ✅ 数据导入完成 | 0.7s | CSV导入 |
| 03:58:10.506 | 🤖 AI建议返回 | 2.6s | Router Prompt Response |
| 03:58:27.212 | 🔄 代码膨胀完成 | 19.3s | 5/5 |
| 03:58:27.212 | 🚀 并发执行开始 | 19.3s | Batch Execution |
| 03:58:27.212 | 🔄 代码膨胀完成 | 19.3s | 5/5 |
| 03:58:27.212 | 🚀 并发执行开始 | 19.3s | Batch Execution |
| 03:58:29.420 | ⭐ 第一个洞察成功 (TTFI) | 21.6s | Prompt: worker-groupby-v1 |
| 03:58:31.389 | 🏁 最后一个洞察成功 | 23.5s | Total 7 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sensor_id","valu...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"sensor_id","valu...` | - |
| 3 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"humidity"}` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 6 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 03:58:04.547 [03:58:04.547] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:04.547 [03:58:04.547] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:04.613 [03:58:04.613] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:04.613 [03:58:04.613] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:05.579 [03:58:05.579] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:05.580 [03:58:05.580] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:05.997 [03:58:05.997] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:05.997 [03:58:05.997] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:05.998 [03:58:05.998] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:58:06.935 [03:58:06.935] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:06.935 [03:58:06.935] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:07.291 [03:58:07.291] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:07.291 [03:58:07.291] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:08.615 [03:58:08.615] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:58:27.245 [03:58:27.245] [AI服务] [洞察-基于温湿压三个环境指标对观测数据进行聚类，发现不同的环境状态模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [large_webtraffic_3000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 03:58:40.593 | 📥 文件上传开始 | 0s | User Action |
| 03:58:41.080 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 03:58:43.000 | 🤖 AI建议返回 | 2.4s | Router Prompt Response |
| 03:58:57.940 | 🔄 代码膨胀完成 | 17.3s | 5/5 |
| 03:58:57.940 | 🚀 并发执行开始 | 17.3s | Batch Execution |
| 03:58:58.303 | 🔄 代码膨胀完成 | 17.7s | 5/5 |
| 03:58:58.303 | 🚀 并发执行开始 | 17.7s | Batch Execution |
| 03:58:59.896 | ⭐ 第一个洞察成功 (TTFI) | 19.3s | Prompt: worker-groupby-v1 |
| 03:59:03.166 | 🏁 最后一个洞察成功 | 22.6s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"device","value_c...` | - |
| 2 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"duration_secon...` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"device","value_c...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"page_views","col_y":...` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"page_views","col_y":...` | - |
| 6 | `worker-decision-tree-v1` | 70 | ✅ Pass | `{"target_col":"conversion","fe...` | - |
| 7 | `worker-distribution-v1` | 80 | ✅ Pass | `{"column_name":"duration_secon...` | - |
| 8 | `worker-distribution-v1` | 70 | ✅ Pass | `{"column_name":"bounce_rate"}` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 03:58:36.758 [03:58:36.758] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:36.758 [03:58:36.758] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:37.149 [03:58:37.149] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:37.149 [03:58:37.149] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:37.849 [03:58:37.849] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:37.849 [03:58:37.849] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:38.284 [03:58:38.284] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:38.284 [03:58:38.284] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:38.285 [03:58:38.285] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:58:39.201 [03:58:39.201] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:39.201 [03:58:39.201] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:39.999 [03:58:39.999] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:58:39.999 [03:58:39.999] [系统] 配置初始化失败，将使用本地默认配置

> 03:58:41.097 [03:58:41.097] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [xlarge_iot_20k.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 03:59:12.174 | 📥 文件上传开始 | 0s | User Action |
| 03:59:12.740 | ✅ 数据导入完成 | 0.6s | CSV导入 |
| 03:59:14.596 | 🤖 AI建议返回 | 2.4s | Router Prompt Response |
| 03:59:33.012 | 🔄 代码膨胀完成 | 20.8s | 5/5 |
| 03:59:33.012 | 🚀 并发执行开始 | 20.8s | Batch Execution |
| 03:59:33.013 | 🔄 代码膨胀完成 | 20.8s | 5/5 |
| 03:59:33.013 | 🚀 并发执行开始 | 20.8s | Batch Execution |
| 03:59:37.483 | ⭐ 第一个洞察成功 (TTFI) | 25.3s | Prompt: worker-outlier-v1 |
| 03:59:40.562 | 🏁 最后一个洞察成功 | 28.4s | Total 6 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"battery"}` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"status","value_c...` | - |
| 3 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 4 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"temperature","col_y"...` | - |
| 5 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 6 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 03:59:09.000 [03:59:09.000] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:09.000 [03:59:09.000] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:09.254 [03:59:09.254] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:09.254 [03:59:09.254] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:10.009 [03:59:10.009] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:10.009 [03:59:10.009] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:10.310 [03:59:10.310] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:10.310 [03:59:10.310] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:10.311 [03:59:10.311] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:59:11.217 [03:59:11.217] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:11.217 [03:59:11.217] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:11.594 [03:59:11.594] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:11.594 [03:59:11.594] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:12.745 [03:59:12.745] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:59:33.050 [03:59:33.050] [AI服务] [洞察-基于环境指标（温、湿、压）对设备或观测点进行聚类，发现不同环境模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object

> 03:59:33.052 [03:59:33.052] [AI服务] [洞察-基于温湿压特征对设备观测点进行聚类，发现环境模式] [worker-cluster-v1] 列名验证失败: 列不存在 [Cluster] JSHandle@object


---

### [xlarge_logs_8000.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 03:59:49.025 | 📥 文件上传开始 | 0s | User Action |
| 03:59:49.533 | ✅ 数据导入完成 | 0.5s | CSV导入 |
| 03:59:51.373 | 🤖 AI建议返回 | 2.3s | Router Prompt Response |
| 04:00:07.495 | 🔄 代码膨胀完成 | 18.5s | 5/5 |
| 04:00:07.495 | 🚀 并发执行开始 | 18.5s | Batch Execution |
| 04:00:07.496 | 🔄 代码膨胀完成 | 18.5s | 5/5 |
| 04:00:07.496 | 🚀 并发执行开始 | 18.5s | Batch Execution |
| 04:00:10.603 | ⭐ 第一个洞察成功 (TTFI) | 21.6s | Prompt: worker-groupby-v1 |
| 04:00:12.168 | 🏁 最后一个洞察成功 | 23.1s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"level","value_co...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"level","value_co...` | - |
| 3 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"user_count"}` | - |
| 4 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 5 | `worker-stats-v1` | 80 | ✅ Pass | `{"column_name":"user_count"}` | - |
| 6 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"response_time_...` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |
| 8 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"timestamp","value...` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 03:59:45.604 [03:59:45.604] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:45.604 [03:59:45.604] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:45.654 [03:59:45.654] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:45.654 [03:59:45.654] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:46.529 [03:59:46.529] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:46.529 [03:59:46.529] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:47.063 [03:59:47.063] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:47.063 [03:59:47.063] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:47.064 [03:59:47.064] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 03:59:47.949 [03:59:47.949] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:47.949 [03:59:47.949] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:48.441 [03:59:48.441] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 03:59:48.441 [03:59:48.441] [系统] 配置初始化失败，将使用本地默认配置

> 03:59:49.540 [03:59:49.540] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [mega_ecommerce_600k.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 04:00:20.772 | 📥 文件上传开始 | 0s | User Action |
| 04:00:21.909 | ✅ 数据导入完成 | 1.1s | CSV导入 |
| 04:00:23.958 | 🤖 AI建议返回 | 3.2s | Router Prompt Response |
| 04:00:42.714 | 🔄 代码膨胀完成 | 22.0s | 4/4 |
| 04:00:42.714 | 🚀 并发执行开始 | 22.0s | Batch Execution |
| 04:00:42.714 | 🔄 代码膨胀完成 | 22.0s | 4/4 |
| 04:00:42.714 | 🚀 并发执行开始 | 22.0s | Batch Execution |
| 04:01:06.291 | ⭐ 第一个洞察成功 (TTFI) | 45.5s | Prompt: worker-groupby-v1 |
| 04:01:06.298 | 🏁 最后一个洞察成功 | 45.5s | Total 2 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"product_category...` | - |
| 2 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"product_category...` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 04:00:17.411 [04:00:17.411] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:00:17.411 [04:00:17.411] [系统] 配置初始化失败，将使用本地默认配置

> 04:00:17.489 [04:00:17.489] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:00:17.489 [04:00:17.489] [系统] 配置初始化失败，将使用本地默认配置

> 04:00:18.446 [04:00:18.446] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:00:18.447 [04:00:18.447] [系统] 配置初始化失败，将使用本地默认配置

> 04:00:18.860 [04:00:18.860] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:00:18.860 [04:00:18.860] [系统] 配置初始化失败，将使用本地默认配置

> 04:00:18.861 [04:00:18.861] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 04:00:20.196 [04:00:20.196] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:00:20.196 [04:00:20.196] [系统] 配置初始化失败，将使用本地默认配置

> 04:00:21.922 [04:00:21.922] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [trips_data_1m.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 04:01:14.909 | 📥 文件上传开始 | 0s | User Action |
| 04:01:16.165 | ✅ 数据导入完成 | 1.3s | CSV导入 |
| 04:01:18.158 | 🤖 AI建议返回 | 3.3s | Router Prompt Response |
| 04:01:36.430 | 🔄 代码膨胀完成 | 21.5s | 5/5 |
| 04:01:36.430 | 🚀 并发执行开始 | 21.5s | Batch Execution |
| 04:01:36.430 | 🔄 代码膨胀完成 | 21.5s | 5/5 |
| 04:01:36.430 | 🚀 并发执行开始 | 21.5s | Batch Execution |
| 04:02:01.402 | ⭐ 第一个洞察成功 (TTFI) | 46.5s | Prompt: worker-groupby-v1 |
| 04:02:04.728 | 🏁 最后一个洞察成功 | 49.8s | Total 9 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_type","v...` | - |
| 2 | `worker-stats-v1` | 70 | ✅ Pass | `{"column_name":"passenger_coun...` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"payment_type","v...` | - |
| 4 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"trip_distance"...` | - |
| 5 | `worker-outlier-v1` | 80 | ✅ Pass | `{"column_name":"trip_distance"...` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"trip_distance","col_...` | - |
| 7 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"trip_distance","col_...` | - |
| 8 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"pickup_datetime",...` | - |
| 9 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"pickup_datetime",...` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 04:01:11.729 [04:01:11.729] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:01:11.729 [04:01:11.729] [系统] 配置初始化失败，将使用本地默认配置

> 04:01:11.786 [04:01:11.786] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:01:11.786 [04:01:11.786] [系统] 配置初始化失败，将使用本地默认配置

> 04:01:12.697 [04:01:12.697] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:01:12.697 [04:01:12.697] [系统] 配置初始化失败，将使用本地默认配置

> 04:01:13.079 [04:01:13.079] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:01:13.079 [04:01:13.079] [系统] 配置初始化失败，将使用本地默认配置

> 04:01:13.080 [04:01:13.080] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 04:01:14.002 [04:01:14.002] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:01:14.002 [04:01:14.002] [系统] 配置初始化失败，将使用本地默认配置

> 04:01:14.324 [04:01:14.324] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:01:14.324 [04:01:14.324] [系统] 配置初始化失败，将使用本地默认配置

> 04:01:16.178 [04:01:16.178] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

### [big_sales_2m.csv]

**A. 执行时间线 (Timeline)**

| 时间点 | 阶段 | 累计耗时 | 说明 |
| :--- | :--- | :--- | :--- |
| 04:02:13.284 | 📥 文件上传开始 | 0s | User Action |
| 04:02:15.033 | ✅ 数据导入完成 | 1.7s | CSV导入 |
| 04:02:17.123 | 🤖 AI建议返回 | 3.8s | Router Prompt Response |
| 04:02:32.476 | 🔄 代码膨胀完成 | 19.2s | 4/4 |
| 04:02:32.476 | 🚀 并发执行开始 | 19.2s | Batch Execution |
| 04:02:35.585 | 🔄 代码膨胀完成 | 22.3s | 4/4 |
| 04:02:35.585 | 🚀 并发执行开始 | 22.3s | Batch Execution |
| 04:02:53.683 | ⭐ 第一个洞察成功 (TTFI) | 40.4s | Prompt: worker-groupby-v1 |
| 04:03:02.531 | 🏁 最后一个洞察成功 | 49.2s | Total 8 Insights |

**B. 洞察执行详情 (Insights)**

| # | Prompt ID | Score | Status | Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"Country","value_...` | - |
| 2 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"Quantity"}` | - |
| 3 | `worker-groupby-v1` | 80 | ✅ Pass | `{"group_col":"CustomerID","val...` | - |
| 4 | `worker-outlier-v1` | 70 | ✅ Pass | `{"column_name":"Quantity"}` | - |
| 5 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"Quantity","col_y":"t...` | - |
| 6 | `worker-correlation-v1` | 80 | ✅ Pass | `{"col_x":"Quantity","col_y":"t...` | - |
| 7 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"InvoiceDate","val...` | - |
| 8 | `worker-trend-v1` | 90 | ✅ Pass | `{"date_col":"InvoiceDate","val...` | - |

**C. 错误日志 (Errors)**

>  Failed to load resource: the server responded with a status of 404 (Not Found)

> 04:02:10.007 [04:02:10.007] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:02:10.007 [04:02:10.007] [系统] 配置初始化失败，将使用本地默认配置

> 04:02:10.190 [04:02:10.190] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:02:10.190 [04:02:10.190] [系统] 配置初始化失败，将使用本地默认配置

> 04:02:10.982 [04:02:10.982] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:02:10.982 [04:02:10.982] [系统] 配置初始化失败，将使用本地默认配置

> 04:02:11.277 [04:02:11.277] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:02:11.278 [04:02:11.278] [系统] 配置初始化失败，将使用本地默认配置

> 04:02:11.278 [04:02:11.278] [Python] 中文字体加载失败（不影响功能） JSHandle@object

> 04:02:12.242 [04:02:12.242] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:02:12.242 [04:02:12.242] [系统] 配置初始化失败，将使用本地默认配置

> 04:02:12.708 [04:02:12.708] [系统] 远程配置加载失败，使用本地默认值 JSHandle@object

> 04:02:12.708 [04:02:12.708] [系统] 配置初始化失败，将使用本地默认配置

> 04:02:15.040 [04:02:15.040] [Python] 中文字体加载失败（不影响功能） JSHandle@object


---

## Part 2: 汇总分析 (Summary Analysis)

#### 1. 性能分析 (Performance Detail)

| 数据集量级 | 指标 | Avg (平均) | Min (最小) | Max (最大) | 样本数 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Small (<1MB)** | Import Time | 0.49s | 0.44s | 0.53s | 2 |
| | TTFI | 54.91s | 20.11s | 89.71s | 2 |
| | E2E Total | 60.62s | 25.55s | 95.68s | 2 |
| | Column Count | 5 | 5 | 5 | 2 |
| | AI Suggestion | 42.87s | 10.80s | 74.93s | 2 |
| | Prompt Length | 2037 | 2035 | 2039 | 2 |
| **Medium (1-10MB)** | Import Time | 0.49s | 0.45s | 0.53s | 3 |
| | TTFI | 19.48s | 19.36s | 19.66s | 3 |
| | E2E Total | 25.39s | 24.55s | 26.06s | 3 |
| | Column Count | 7 | 6 | 7 | 3 |
| | AI Suggestion | 10.86s | 9.75s | 12.36s | 3 |
| | Prompt Length | 2102 | 2084 | 2127 | 3 |
| **Large (10-100MB)** | Import Time | 0.56s | 0.49s | 0.75s | 5 |
| | TTFI | 21.81s | 19.30s | 25.31s | 5 |
| | E2E Total | 27.86s | 26.05s | 31.56s | 5 |
| | Column Count | 7 | 6 | 10 | 5 |
| | AI Suggestion | 8.65s | 7.55s | 11.39s | 5 |
| | Prompt Length | 2131 | 2086 | 2217 | 5 |
| **Mega (>100MB)** | Import Time | 1.38s | 1.14s | 1.75s | 3 |
| | TTFI | 44.14s | 40.40s | 46.49s | 3 |
| | E2E Total | 51.42s | 48.58s | 53.09s | 3 |
| | Column Count | 13 | 10 | 15 | 3 |
| | AI Suggestion | 10.98s | 8.08s | 12.47s | 3 |
| | Prompt Length | 2236 | 2221 | 2246 | 3 |

#### 2. Prompt 质量通过率 (Quality Pass Rate)

> **注**: "AI对应推荐总数" = 执行总数 + 验证拦截数(Blocked)。拦截数 (**7**) 来自 AI 引用了不存在列名被门控拦截。 

| Prompt ID | 执行总数 (Executed) | 通过次数 (Pass) | 拦截数 (Blocked) | 通过率 (Exec Rate) | 失败原因 (Fail/Block Reasons) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `worker-stats-v1` | 9 | 9 | **0** | 100% | - |
| `worker-groupby-v1` | 23 | 23 | **0** | 100% | - |
| `worker-trend-v1` | 15 | 15 | **0** | 100% | - |
| `worker-correlation-v1` | 21 | 21 | **0** | 100% | - |
| `worker-distribution-v1` | 8 | 8 | **0** | 100% | - |
| `洞察-基于年龄和收入对用户进行聚类，识别细分群体] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于年龄和收入对用户进行聚类，识别不同的用户细分群体] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `worker-outlier-v1` | 13 | 13 | **0** | 100% | - |
| `worker-regression-v1` | 1 | 1 | **0** | 100% | - |
| `worker-decision-tree-v1` | 2 | 2 | **0** | 100% | - |
| `洞察-基于薪资、经验、绩效和培训时长对员工进行聚类，识别不同特征群体] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于多维度特征对员工进行分群，识别人才类型] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于温湿压三个环境指标对观测数据进行聚类，发现不同的环境状态模式] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于环境指标（温、湿、压）对设备或观测点进行聚类，发现不同环境模式] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |
| `洞察-基于温湿压特征对设备观测点进行聚类，发现环境模式] [worker-cluster-v1` | 0 | 0 | **1** | - | InvalidCols: [Cluster] |

**验证拦截统计 (Validation Blocked)**: 共 **7** 次

| 触发 Prompt | 拦截原因 | AI 返回参数 (Returned) | 模板所需参数 (Expected) |
| :--- | :--- | :--- | :--- |
