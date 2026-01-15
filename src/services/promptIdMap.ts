/**
 * Prompt ID 映射表
 * 
 * 用途：将字符串 ID 映射为数字 ID，减少 Prompt 长度
 * 
 * 规则：
 * - 1-9: 基础分析
 * - 10-19: 高级分析
 * - 20-29: 清洗类（不在 Router Prompt 中使用）
 */

// 数字 ID → 字符串 ID 映射
export const PROMPT_ID_MAP: Record<number, string> = {
    // ===== 基础分析 (1-9) =====
    1: 'worker-distribution-v1',
    2: 'worker-correlation-v1',
    3: 'worker-groupby-v1',
    4: 'worker-trend-v1',
    5: 'worker-stats-v1',
    6: 'worker-topn-v1',
    7: 'worker-missing-v1',
    8: 'worker-outlier-v1',
    9: 'worker-crosstab-v1',

    // ===== 高级分析 (10-19) =====
    10: 'worker-cluster-v1',
    11: 'worker-dbscan-v1',
    12: 'worker-decision-tree-v1',
    13: 'worker-regression-v1',
    14: 'worker-granger-v1',
    15: 'worker-time-decomposition-v1',

    // ===== 清洗类 (20-29，不在 Router 中使用) =====
    20: 'worker-clean-dedup-v1',
    21: 'worker-clean-dropna-v1',
    22: 'worker-clean-fillna-v1',
    23: 'worker-clean-normalize-v1',
    24: 'worker-clean-outlier-v1',
    25: 'worker-clean-typecast-v1',
} as const;

// 字符串 ID → 数字 ID 反向映射
export const PROMPT_NAME_TO_ID: Record<string, number> = Object.fromEntries(
    Object.entries(PROMPT_ID_MAP).map(([id, name]) => [name, parseInt(id)])
);

/**
 * 根据数字 ID 获取字符串 ID
 */
export function getPromptNameById(id: number): string | undefined {
    return PROMPT_ID_MAP[id];
}

/**
 * 根据字符串 ID 获取数字 ID
 */
export function getPromptIdByName(name: string): number | undefined {
    return PROMPT_NAME_TO_ID[name];
}

/**
 * 检查是否为有效的数字 ID
 */
export function isValidPromptId(id: number): boolean {
    return id in PROMPT_ID_MAP;
}

/**
 * 检查是否为基础分析 ID
 */
export function isBasicPromptId(id: number): boolean {
    return id >= 1 && id <= 9;
}

/**
 * 检查是否为高级分析 ID
 */
export function isAdvancedPromptId(id: number): boolean {
    return id >= 10 && id <= 19;
}
