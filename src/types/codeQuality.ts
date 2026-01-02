/**
 * 代码质量优化相关类型定义
 * 支持双模式架构：本地模式 + 协同模式
 */

// ========== 用户同意与设置 ==========

/**
 * 用户参与模式
 */
export type ParticipationMode = 'local' | 'collaborative';

/**
 * 代码质量设置
 */
export interface CodeQualitySettings {
    /** 参与模式 */
    participationMode: ParticipationMode;

    /** 最后同意时间 */
    lastConsentTime?: number;

    /** 总贡献数 */
    totalContributions?: number;

    /** 是否可显示引导 */
    canShowOnboarding: boolean;

    /** 最后同步规则时间 */
    lastRulesSyncTime?: number;

    /** 当前规则版本 */
    rulesVersion?: string;
}

// ========== 失败案例 ==========

/**
 * 失败案例（本地存储）
 */
export interface FailureCase {
    /** 唯一ID */
    id: string;

    /** 时间戳 */
    timestamp: number;

    // === 上下文信息 ===

    /** Prompt类型 */
    promptType: string;

    /** Prompt ID */
    promptId: string;

    /** 列名列表 */
    columns: string[];

    /** 数据形状 */
    dataShape: {
        rows: number;
        cols: number;
    };

    // === 代码信息 ===

    /** 原始AI生成的代码 */
    originalCode: string;

    /** 增强后的代码 */
    enhancedCode: string;

    /** 应用的规则列表 */
    appliedRules: string[];

    // === 错误信息 ===

    /** 错误类型 */
    errorType: string;

    /** 错误消息 */
    errorMessage: string;

    /** 堆栈跟踪 */
    stackTrace: string;

    // === 分类标签 ===

    /** 错误分类 */
    category?: ErrorCategory;

    /** 严重程度 */
    severity?: 'low' | 'medium' | 'high';

    /** 是否已上传 */
    uploaded?: boolean;
}

/**
 * 错误分类
 */
export type ErrorCategory =
    | 'index_overflow'      // 索引越界
    | 'missing_column'      // 列不存在
    | 'empty_data'          // 空数据
    | 'type_mismatch'       // 类型错误
    | 'division_by_zero'    // 除零错误
    | 'unknown';            // 未知错误

/**
 * 执行上下文（用于记录失败）
 */
export interface ExecutionContext {
    promptType: string;
    promptId: string;
    columns: string[];
    dataShape: { rows: number; cols: number };
    originalCode: string;
    enhancedCode: string;
    appliedRules: string[];
}

// ========== 脱敏后的数据 ==========

/**
 * 脱敏后的失败报告（上传到服务端）
 */
export interface SanitizedFailureReport {
    // === 元信息 ===

    /** 匿名用户ID（SHA256哈希） */
    userId: string;

    /** 时间戳 */
    timestamp: number;

    /** 客户端版本 */
    clientVersion: string;

    // === 错误信息 ===

    /** 错误类型 */
    errorType: string;

    /** 脱敏后的错误消息 */
    errorMessage: string;

    // === 代码信息 ===

    /** 脱敏后的代码模式 */
    codePattern: string;

    // === 数据特征 ===

    /** 范围化的数据形状 */
    dataShape: {
        rowRange: string;   // "100-1000"
        colRange: string;   // "5-10"
    };

    // === 上下文 ===

    /** 泛化的Prompt类别 */
    promptCategory: string;
}

// ========== 统计数据 ==========

/**
 * 失败案例统计
 */
export interface FailureStatistics {
    /** 总数 */
    total: number;

    /** 按类别分组 */
    byCategory: Record<ErrorCategory, number>;

    /** 按严重程度分组 */
    bySeverity: {
        low: number;
        medium: number;
        high: number;
    };

    /** 最近趋势 */
    recentTrend: {
        date: string;
        count: number;
    }[];
}

// ========== 优化规则 ==========

/**
 * 动态规则（从服务端拉取）
 */
export interface DynamicRule {
    /** 规则ID */
    id: string;

    /** 规则名称 */
    name: string;

    /** 描述 */
    description?: string;

    /** 触发模式（正则或关键词） */
    triggerPattern: string;

    /** 增强代码模板 */
    enhancementCode: string;

    /** 优先级（数字越大越优先） */
    priority: number;

    /** 添加时间 */
    addedAt: string;

    /** 适用的客户端版本 */
    minVersion?: string;
}

/**
 * 规则同步响应
 */
export interface RuleSyncResponse {
    /** 规则版本 */
    version: string;

    /** 规则列表 */
    rules: DynamicRule[];

    /** 更新时间 */
    updatedAt: number;
}
