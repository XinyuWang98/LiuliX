/**
 * Prompt 种子清单 (Manifest)
 * 用于在应用启动时批量注册 Prompt，避免硬编码耦合
 */

import { explorerGeneralPrompt } from './library/l1/explorer_general/index';
// L2 分析类
import { workerCorrelationPrompt } from './library/l2/worker_correlation/index';
import { workerDistributionPrompt } from './library/l2/worker_distribution/index';
import { workerOutlierPrompt } from './library/l2/worker_outlier/index';
import { workerGroupbyPrompt } from './library/l2/worker_groupby/index';
import { workerTrendPrompt } from './library/l2/worker_trend/index';
import { workerTopnPrompt } from './library/l2/worker_topn/index';
import { workerMissingPrompt } from './library/l2/worker_missing/index';
import { workerStatsPrompt } from './library/l2/worker_stats/index';
import { workerCrosstabPrompt } from './library/l2/worker_crosstab/index';
// L2 清洗类 (Worker - Python)
import { workerCleanDedupPrompt } from './library/l2/worker_clean_dedup/index';
import { workerCleanFillnaPrompt } from './library/l2/worker_clean_fillna/index';
import { workerCleanDropnaPrompt } from './library/l2/worker_clean_dropna/index';
import { workerCleanOutlierPrompt } from './library/l2/worker_clean_outlier/index';
import { workerCleanNormalizePrompt } from './library/l2/worker_clean_normalize/index';
import { workerCleanTypecastPrompt } from './library/l2/worker_clean_typecast/index';

// L2 清洗类 (Cleaner - SQL/Official)
import { cleanerRemoveDuplicatesPrompt } from './library/l2/cleaner_remove_duplicates/index';
import { cleanerFillNullMedianPrompt } from './library/l2/cleaner_fill_null_median/index';
import { cleanerFillNullUnknownPrompt } from './library/l2/cleaner_fill_null_unknown/index';
import { cleanerStandardizeDatePrompt } from './library/l2/cleaner_standardize_date/index';
import { cleanerStandardizeEmailPrompt } from './library/l2/cleaner_standardize_email/index';
import { cleanerFilterOutliersIqrPrompt } from './library/l2/cleaner_filter_outliers_iqr/index';
import { cleanerFormatMoneyPrompt } from './library/l2/cleaner_format_money/index';
import { cleanerDropNullColumnPrompt } from './library/l2/cleaner_drop_null_column/index';
import { cleanerCastToNumericPrompt } from './library/l2/cleaner_cast_to_numeric/index';
import { cleanerFillNullMeanPrompt } from './library/l2/cleaner_fill_null_mean/index';
import { cleanerFillNullModePrompt } from './library/l2/cleaner_fill_null_mode/index';
import { cleanerStandardizePhonePrompt } from './library/l2/cleaner_standardize_phone/index';
import { cleanerTrimWhitespacePrompt } from './library/l2/cleaner_trim_whitespace/index';
import { cleanerDeleteNullRowsPrompt } from './library/l2/cleaner_delete_null_rows/index';
import { cleanerStandardizeCasePrompt } from './library/l2/cleaner_standardize_case/index';
// L2 高级分析类 (P0/P1)
import { workerRegressionPrompt } from './library/l2/worker_regression/index';
import { workerDecisionTreePrompt } from './library/l2/worker_decision_tree/index';
import { workerClusterPrompt } from './library/l2/worker_cluster/index';
import { workerGrangerPrompt } from './library/l2/worker_granger/index';
// L2 扩展分析类 (Advanced)
import { workerTimeDecompositionPrompt } from './library/l2/worker_time_decomposition/index';
import { workerDbscanPrompt } from './library/l2/worker_dbscan/index';

// 导出种子全集 (1个L1 + 18个L2 = 19个)
export const seedPrompts = [
    // L1 决策层
    explorerGeneralPrompt,
    // L2 执行层 - 分析类 (9个)
    workerDistributionPrompt,
    workerCorrelationPrompt,
    workerOutlierPrompt,
    workerGroupbyPrompt,
    workerTrendPrompt,
    workerTopnPrompt,
    workerMissingPrompt,
    workerStatsPrompt,
    workerCrosstabPrompt,
    // L2 执行层 - 清洗类 (6个)
    workerCleanDedupPrompt,
    workerCleanFillnaPrompt,
    workerCleanDropnaPrompt,
    workerCleanOutlierPrompt,
    workerCleanNormalizePrompt,
    workerCleanTypecastPrompt,
    // Cleaner class (15 official)
    cleanerRemoveDuplicatesPrompt,
    cleanerFillNullMedianPrompt,
    cleanerFillNullUnknownPrompt,
    cleanerStandardizeDatePrompt,
    cleanerStandardizeEmailPrompt,
    cleanerFilterOutliersIqrPrompt,
    cleanerFormatMoneyPrompt,
    cleanerDropNullColumnPrompt,
    cleanerCastToNumericPrompt,
    cleanerFillNullMeanPrompt,
    cleanerFillNullModePrompt,
    cleanerStandardizePhonePrompt,
    cleanerTrimWhitespacePrompt,
    cleanerDeleteNullRowsPrompt,
    cleanerStandardizeCasePrompt,
    // L2 执行层 - 高级分析类 (3个) 🆕
    workerRegressionPrompt,
    workerDecisionTreePrompt,
    workerClusterPrompt,
    workerGrangerPrompt,
    workerTimeDecompositionPrompt,
    workerDbscanPrompt
];

/**
 * 辅助函数：按层级分组获取
 */
export const getPromptsByLayer = (layer: 'L1_DECISION' | 'L2_EXECUTION') => {
    return seedPrompts.filter(p => p.layer === layer);
};

/**
 * 辅助函数：按意图分组获取
 */
export const getPromptsByIntent = (intent: 'exploration' | 'causal' | 'cleaning') => {
    return seedPrompts.filter(p =>
        p.dimensions.some(d => d.category === 'intent' && d.value === intent)
    );
};
