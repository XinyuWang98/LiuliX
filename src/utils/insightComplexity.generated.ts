/**
 * 自动生成的Worker复杂度评分
 * 生成时间: 2026-01-11T09:04:47.622Z
 * 生成脚本: scripts/generate-complexity-scores.js
 * 
 * ⚠️ 注意：此文件自动生成，请勿手动编辑
 */

export const WORKER_COMPLEXITY_SCORES: Record<string, number> = {
    'worker-clean-dedup-v1': 10,  // 🟢 轻量级
    'worker-clean-dropna-v1': 10,  // 🟢 轻量级
    'worker-clean-fillna-v1': 10,  // 🟢 轻量级
    'worker-clean-normalize-v1': 10,  // 🟢 轻量级
    'worker-clean-typecast-v1': 10,  // 🟢 轻量级
    'worker-clean-outlier-v1': 90,  // 🔴 重量级
    'worker-crosstab-v1': 90,  // 🔴 重量级
    'worker-missing-v1': 90,  // 🔴 重量级
    'worker-stats-v1': 90,  // 🔴 重量级
    'worker-cluster-v1': 100,  // 🔴 重量级
    'worker-correlation-v1': 100,  // 🔴 重量级
    'worker-dbscan-v1': 100,  // 🔴 重量级
    'worker-decision-tree-v1': 100,  // 🔴 重量级
    'worker-distribution-v1': 100,  // 🔴 重量级
    'worker-granger-v1': 100,  // 🔴 重量级
    'worker-groupby-v1': 100,  // 🔴 重量级
    'worker-outlier-v1': 100,  // 🔴 重量级
    'worker-regression-v1': 100,  // 🔴 重量级
    'worker-time-decomposition-v1': 100,  // 🔴 重量级
    'worker-topn-v1': 100,  // 🔴 重量级
    'worker-trend-v1': 100,  // 🔴 重量级
};
