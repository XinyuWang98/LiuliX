/**
 * 分析配置管理
 * 用于管理AI洞察分析的性能和质量参数
 */

/**
 * 分析配置接口
 */
export interface AnalysisConfig {
    /** 最大分析列数 */
    maxColumns: number;
    /** 超时时间（秒） */
    timeout: number;
    /** 采样行数 */
    samplingRows: number;
}

/**
 * 默认配置
 */
export const ANALYSIS_CONFIG_DEFAULTS: AnalysisConfig = {
    maxColumns: 20,      // 默认20列（平衡性能和质量）
    timeout: 60,         // 默认60秒
    samplingRows: 30     // 默认采样30行
};

/**
 * 配置限制范围
 */
export const ANALYSIS_CONFIG_LIMITS = {
    MAX_COLUMNS_MIN: 10,
    MAX_COLUMNS_MAX: 100,
    TIMEOUT_MIN: 30,
    TIMEOUT_MAX: 300,
    SAMPLING_ROWS_MIN: 10,
    SAMPLING_ROWS_MAX: 1000
};

/**
 * 获取分析配置
 * 从localStorage读取用户配置，如果不存在则使用默认值
 */
export function getAnalysisConfig(): AnalysisConfig {
    return {
        maxColumns: Number(localStorage.getItem('analysis_max_columns')) || ANALYSIS_CONFIG_DEFAULTS.maxColumns,
        timeout: Number(localStorage.getItem('analysis_timeout')) || ANALYSIS_CONFIG_DEFAULTS.timeout,
        samplingRows: Number(localStorage.getItem('analysis_sampling_rows')) || ANALYSIS_CONFIG_DEFAULTS.samplingRows
    };
}

/**
 * 设置分析配置
 * 保存到localStorage以实现持久化
 */
export function setAnalysisConfig(config: Partial<AnalysisConfig>): void {
    if (config.maxColumns !== undefined) {
        // 边界检查
        const maxColumns = Math.max(
            ANALYSIS_CONFIG_LIMITS.MAX_COLUMNS_MIN,
            Math.min(ANALYSIS_CONFIG_LIMITS.MAX_COLUMNS_MAX, config.maxColumns)
        );
        localStorage.setItem('analysis_max_columns', String(maxColumns));
    }

    if (config.timeout !== undefined) {
        // 边界检查
        const timeout = Math.max(
            ANALYSIS_CONFIG_LIMITS.TIMEOUT_MIN,
            Math.min(ANALYSIS_CONFIG_LIMITS.TIMEOUT_MAX, config.timeout)
        );
        localStorage.setItem('analysis_timeout', String(timeout));
    }

    if (config.samplingRows !== undefined) {
        // 边界检查
        const samplingRows = Math.max(
            ANALYSIS_CONFIG_LIMITS.SAMPLING_ROWS_MIN,
            Math.min(ANALYSIS_CONFIG_LIMITS.SAMPLING_ROWS_MAX, config.samplingRows)
        );
        localStorage.setItem('analysis_sampling_rows', String(samplingRows));
    }
}
