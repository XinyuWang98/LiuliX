/**
 * Prompt ID 常量定义
 * 
 * 用途：
 * 1. 集中管理硬编码的 Prompt ID 引用
 * 2. 未来修改ID时只需修改此文件
 * 3. 代码可读性更好
 * 
 * 注意：这些是语义化slug，实际ID可能不同
 */

// ========== L2 分析 Worker Prompts ==========

export const PROMPT_IDS = {
    // 基础分析
    DISTRIBUTION: 'worker-distribution-v1',
    CORRELATION: 'worker-correlation-v1',
    TREND: 'worker-trend-v1',
    STATS: 'worker-stats-v1',
    GROUPBY: 'worker-groupby-v1',
    TOPN: 'worker-topn-v1',
    MISSING: 'worker-missing-v1',
    OUTLIER: 'worker-outlier-v1',
    CROSSTAB: 'worker-crosstab-v1',

    // 机器学习
    CLUSTER: 'worker-cluster-v1',
    DECISION_TREE: 'worker-decision-tree-v1',
    REGRESSION: 'worker-regression-v1',

    // L1 Router
    EXPLORER_GENERAL: 'explorer-general-v1'
} as const;

// 类型导出（供 TypeScript 类型检查）
export type PromptIdKey = typeof PROMPT_IDS[keyof typeof PROMPT_IDS];
