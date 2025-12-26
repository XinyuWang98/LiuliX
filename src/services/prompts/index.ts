/**
 * Prompt 种子清单 (Manifest)
 * 用于在应用启动时批量注册 Prompt，避免硬编码耦合
 */

import { explorerGeneralPrompt } from './library/l1/explorer_general';
// L2 分析类
import { workerCorrelationPrompt } from './library/l2/worker_correlation';
import { workerDistributionPrompt } from './library/l2/worker_distribution';
import { workerOutlierPrompt } from './library/l2/worker_outlier';
import { workerGroupbyPrompt } from './library/l2/worker_groupby';
import { workerTrendPrompt } from './library/l2/worker_trend';
import { workerTopnPrompt } from './library/l2/worker_topn';
import { workerMissingPrompt } from './library/l2/worker_missing';
import { workerStatsPrompt } from './library/l2/worker_stats';
import { workerCrosstabPrompt } from './library/l2/worker_crosstab';
// L2 清洗类
import { workerCleanDedupPrompt } from './library/l2/worker_clean_dedup';
import { workerCleanFillnaPrompt } from './library/l2/worker_clean_fillna';
import { workerCleanDropnaPrompt } from './library/l2/worker_clean_dropna';
import { workerCleanOutlierPrompt } from './library/l2/worker_clean_outlier';
import { workerCleanNormalizePrompt } from './library/l2/worker_clean_normalize';
import { workerCleanTypecastPrompt } from './library/l2/worker_clean_typecast';
// L2 高级分析类 (P0/P1)
import { workerRegressionPrompt } from './library/l2/worker_regression';
import { workerDecisionTreePrompt } from './library/l2/worker_decision_tree';
import { workerClusterPrompt } from './library/l2/worker_cluster';

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
    // L2 执行层 - 高级分析类 (3个) 🆕
    workerRegressionPrompt,
    workerDecisionTreePrompt,
    workerClusterPrompt
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
