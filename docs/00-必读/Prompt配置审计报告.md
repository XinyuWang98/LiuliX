# 🛡️ Prompt 配置审计报告

> 生成时间: 1/14/2026, 7:55:51 PM
> 扫描路径: `src/services/prompts/library/l2`
> 文档归类: 00-必读
> 目的: 审计所有 AI Prompt 模版的输入参数和维度配置，确保规范性。

## 📊 概览总结
- **Prompt 总数**: 36
- **无参数 Prompt**: 2 (通常为全表扫描类)
- **参数化 Prompt**: 34

## 📝 详细配置表

| Prompt ID | 标题 (Title) | 输入参数 (Input Variables) | 维度标签 (Dimensions) | 文件名 |
| :--- | :--- | :--- | :--- | :--- |
| `cleaner-cast-to-numeric-v1` | 类型转换（转数值） | `column_name` | 类型转换, 数值 | [cleaner_cast_to_numeric.zh.ts](../../../src/services/prompts/library/l2/cleaner_cast_to_numeric/cleaner_cast_to_numeric.zh.ts) |
| `cleaner-delete-null-rows-v1` | 删除空白行 | `column_name` | 过滤, 删除 | [cleaner_delete_null_rows.zh.ts](../../../src/services/prompts/library/l2/cleaner_delete_null_rows/cleaner_delete_null_rows.zh.ts) |
| `cleaner-drop-null-column-v1` | 删除全空列 | `column_name` | 过滤, 删除 | [cleaner_drop_null_column.zh.ts](../../../src/services/prompts/library/l2/cleaner_drop_null_column/cleaner_drop_null_column.zh.ts) |
| `cleaner-fill-null-mean-v1` | 缺失值填充（均值） | `column_name,mean_value` | 填充缺失值, 均值 | [cleaner_fill_null_mean.zh.ts](../../../src/services/prompts/library/l2/cleaner_fill_null_mean/cleaner_fill_null_mean.zh.ts) |
| `cleaner-fill-null-median-v1` | 缺失值填充（中位数） | `column_name,median_value` | 填充缺失值, 中位数 | [cleaner_fill_null_median.zh.ts](../../../src/services/prompts/library/l2/cleaner_fill_null_median/cleaner_fill_null_median.zh.ts) |
| `cleaner-fill-null-mode-v1` | 缺失值填充（众数） | `column_name,mode_value` | 填充缺失值, 众数 | [cleaner_fill_null_mode.zh.ts](../../../src/services/prompts/library/l2/cleaner_fill_null_mode/cleaner_fill_null_mode.zh.ts) |
| `cleaner-fill-null-unknown-v1` | 缺失值填充（Unknown） | `column_name` | 填充缺失值, 文本 | [cleaner_fill_null_unknown.zh.ts](../../../src/services/prompts/library/l2/cleaner_fill_null_unknown/cleaner_fill_null_unknown.zh.ts) |
| `cleaner-filter-outliers-iqr-v1` | 异常值过滤（IQR规则） | `column_name,q1_minus_iqr,q3_plus_iqr` | 过滤, IQR规则 | [cleaner_filter_outliers_iqr.zh.ts](../../../src/services/prompts/library/l2/cleaner_filter_outliers_iqr/cleaner_filter_outliers_iqr.zh.ts) |
| `cleaner-format-money-v1` | 金额格式化（2位小数） | `column_name` | 格式标准化, 数值 | [cleaner_format_money.zh.ts](../../../src/services/prompts/library/l2/cleaner_format_money/cleaner_format_money.zh.ts) |
| `cleaner-remove-duplicates-v1` | 删除重复行 | `None` | 去重, SQL | [cleaner_remove_duplicates.zh.ts](../../../src/services/prompts/library/l2/cleaner_remove_duplicates/cleaner_remove_duplicates.zh.ts) |
| `cleaner-standardize-case-v1` | 大小写标准化 | `column_name,case_function` | 格式标准化, 文本 | [cleaner_standardize_case.zh.ts](../../../src/services/prompts/library/l2/cleaner_standardize_case/cleaner_standardize_case.zh.ts) |
| `cleaner-standardize-date-v1` | 日期格式标准化 | `column_name` | 格式标准化, 日期 | [cleaner_standardize_date.zh.ts](../../../src/services/prompts/library/l2/cleaner_standardize_date/cleaner_standardize_date.zh.ts) |
| `cleaner-standardize-email-v1` | 邮箱格式标准化 | `column_name` | 格式标准化, 文本 | [cleaner_standardize_email.zh.ts](../../../src/services/prompts/library/l2/cleaner_standardize_email/cleaner_standardize_email.zh.ts) |
| `cleaner-standardize-phone-v1` | 电话号码标准化 | `column_name` | 格式标准化, 文本 | [cleaner_standardize_phone.zh.ts](../../../src/services/prompts/library/l2/cleaner_standardize_phone/cleaner_standardize_phone.zh.ts) |
| `cleaner-trim-whitespace-v1` | 文本清洗（去除空白） | `column_name` | 格式标准化, 文本 | [cleaner_trim_whitespace.zh.ts](../../../src/services/prompts/library/l2/cleaner_trim_whitespace/cleaner_trim_whitespace.zh.ts) |
| `worker-clean-dedup-v1` | 去除重复行 | `df_summary,dedup_columns` | 通用, 清洗, 去重, SQL | [worker_clean_dedup.zh.ts](../../../src/services/prompts/library/l2/worker_clean_dedup/worker_clean_dedup.zh.ts) |
| `worker-clean-dropna-v1` | 删除空值行 | `df_summary,column_name,drop_mode` | 通用, 清洗, 过滤, SQL | [worker_clean_dropna.zh.ts](../../../src/services/prompts/library/l2/worker_clean_dropna/worker_clean_dropna.zh.ts) |
| `worker-clean-fillna-v1` | 缺失值填充 | `df_summary,column_name,fill_strategy,fill_value` | 通用, 清洗, 填充, SQL | [worker_clean_fillna.zh.ts](../../../src/services/prompts/library/l2/worker_clean_fillna/worker_clean_fillna.zh.ts) |
| `worker-clean-normalize-v1` | 文本标准化 | `df_summary,column_name,normalize_options` | 通用, 清洗, 标准化, SQL | [worker_clean_normalize.zh.ts](../../../src/services/prompts/library/l2/worker_clean_normalize/worker_clean_normalize.zh.ts) |
| `worker-clean-outlier-v1` | 剔除异常值 | `df_summary,column_name,outlier_method` | 通用, 清洗, 异常剔除, SQL | [worker_clean_outlier.zh.ts](../../../src/services/prompts/library/l2/worker_clean_outlier/worker_clean_outlier.zh.ts) |
| `worker-clean-typecast-v1` | 类型转换 | `df_summary,column_name,source_type,target_type,date_format` | 通用, 清洗, 类型转换, SQL | [worker_clean_typecast.zh.ts](../../../src/services/prompts/library/l2/worker_clean_typecast/worker_clean_typecast.zh.ts) |
| `worker-cluster-v1` | 聚类分析 | `feature_cols,n_clusters` | 通用, 探索, 聚类, 图表 | [worker_cluster.zh.ts](../../../src/services/prompts/library/l2/worker_cluster/worker_cluster.zh.ts) |
| `worker-correlation-v1` | 双变量相关性分析 | `col_x,col_y` | 通用, 归因/关系, 相关性, 图表 | [worker_correlation.zh.ts](../../../src/services/prompts/library/l2/worker_correlation/worker_correlation.zh.ts) |
| `worker-crosstab-v1` | 交叉表分析 | `df_summary,row_col,col_col` | 通用, 探索, 交叉分析, 图表 | [worker_crosstab.zh.ts](../../../src/services/prompts/library/l2/worker_crosstab/worker_crosstab.zh.ts) |
| `worker-dbscan-v1` | DBSCAN 密度聚类 | `feature_cols,eps,min_samples` | 通用, 探索, 聚类, 图表 | [worker_dbscan.zh.ts](../../../src/services/prompts/library/l2/worker_dbscan/worker_dbscan.zh.ts) |
| `worker-decision-tree-v1` | 决策树分析 | `target_col,feature_cols,max_depth` | 通用, 归因, 分类建模, 图表 | [worker_decision_tree.zh.ts](../../../src/services/prompts/library/l2/worker_decision_tree/worker_decision_tree.zh.ts) |
| `worker-distribution-v1` | 单变量分布分析 | `column_name` | 通用, 探索, 统计分布, 图表 | [worker_distribution.zh.ts](../../../src/services/prompts/library/l2/worker_distribution/worker_distribution.zh.ts) |
| `worker-granger-v1` | 格兰杰因果检验 | `x_col,y_col` | 通用, 因果, 时序分析, 图表 | [worker_granger.zh.ts](../../../src/services/prompts/library/l2/worker_granger/worker_granger.zh.ts) |
| `worker-groupby-v1` | 分组聚合分析 | `group_col,value_col,agg_func` | 通用, 探索, 分组聚合, 图表 | [worker_groupby.zh.ts](../../../src/services/prompts/library/l2/worker_groupby/worker_groupby.zh.ts) |
| `worker-missing-v1` | 缺失值分析 | `None` | 通用, 清洗, 缺失检测, 图表 | [worker_missing.zh.ts](../../../src/services/prompts/library/l2/worker_missing/worker_missing.zh.ts) |
| `worker-outlier-v1` | 异常值检测 | `column_name` | 通用, 探索, 异常检测, 图表 | [worker_outlier.zh.ts](../../../src/services/prompts/library/l2/worker_outlier/worker_outlier.zh.ts) |
| `worker-regression-v1` | 多元回归分析 | `target_col,feature_cols` | 通用, 归因, 回归分析, 图表 | [worker_regression.zh.ts](../../../src/services/prompts/library/l2/worker_regression/worker_regression.zh.ts) |
| `worker-stats-v1` | 描述性统计 | `column_name` | 通用, 探索, 描述统计, 表格 | [worker_stats.zh.ts](../../../src/services/prompts/library/l2/worker_stats/worker_stats.zh.ts) |
| `worker-time-decomposition-v1` | 时序分解 (季节性分析) | `date_col,value_col,period` | 通用, 探索, 时序分析, 图表 | [worker_time_decomposition.zh.ts](../../../src/services/prompts/library/l2/worker_time_decomposition/worker_time_decomposition.zh.ts) |
| `worker-topn-v1` | Top N 排名 | `df_summary,column_name,n,ascending` | 通用, 探索, 排名, 图表 | [worker_topn.zh.ts](../../../src/services/prompts/library/l2/worker_topn/worker_topn.zh.ts) |
| `worker-trend-v1` | 时序趋势分析 | `date_col,value_col` | 通用, 探索, 时序分析, 图表 | [worker_trend.zh.ts](../../../src/services/prompts/library/l2/worker_trend/worker_trend.zh.ts) |


## 🔍 异常检测
- ✅ 所有 Prompt 均有 ID 定义
