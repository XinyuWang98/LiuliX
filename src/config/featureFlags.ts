/**
 * 特征开关配置系统
 * 用于控制MVP阶段未完成功能的展示状态
 */

export interface FeatureFlags {
    // AI功能
    REAL_AI_INSIGHT: boolean;           // 真实AI洞察（当前Mock）
    REAL_AI_CLEANING: boolean;          // 真实AI清洗建议（当前Mock）
    AI_CHAT_PANEL: boolean;             // AI聊天面板
    LOCAL_AI_MODEL: boolean;            // 本地AI模型（MVP阶段禁用）

    // 报告功能
    PDF_EXPORT: boolean;                // PDF导出（当前仅HTML）
    INTERACTIVE_HTML: boolean;          // 交互式HTML报告
    AUTO_REPORT: boolean;               // 自动报告生成

    // 数据源
    GOOGLE_SHEETS: boolean;             // Google Sheets集成
    DATABASE_CONNECT: boolean;          // 数据库连接
    API_IMPORT: boolean;                // API数据导入

    // 高级功能
    AGENT_MODE: boolean;                // 本地Agent模式
    ADVANCED_VIZ: boolean;              // 高级可视化
    COLLABORATION: boolean;             // 协作功能

    // 实验性功能
    SKILLS_ARCHITECTURE: boolean;       // Skills架构（已实现，默认关闭）
    PYODIDE_OFFLINE: boolean;           // Pyodide离线模式
    USE_AST_CODE_ENHANCER: boolean;     // AST代码增强器（v3.0，默认关闭）
}

/**
 * 默认特征开关状态（MVP阶段）
 * 规则：已完成的功能true，未完成的功能false
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
    // AI功能（Mock完成，真实AI未接入）
    REAL_AI_INSIGHT: false,
    REAL_AI_CLEANING: false,
    AI_CHAT_PANEL: false,
    LOCAL_AI_MODEL: false,  // MVP阶段禁用（质量未达标）

    // 报告功能（HTML完成，PDF未完成）
    PDF_EXPORT: false,
    INTERACTIVE_HTML: false,  // 开发中
    AUTO_REPORT: false,

    // 数据源（仅CSV/XLSX完成）
    GOOGLE_SHEETS: false,
    DATABASE_CONNECT: false,
    API_IMPORT: false,

    // 高级功能（全部未完成）
    AGENT_MODE: false,
    ADVANCED_VIZ: false,
    COLLABORATION: false,

    // 实验性功能
    SKILLS_ARCHITECTURE: false,  // 已实现，默认关闭
    PYODIDE_OFFLINE: false,
    USE_AST_CODE_ENHANCER: true  // ✅ v3.0 AST增强器已启用（2026-01-03测试）
};

/**
 * 获取特征开关状态
 */
export function getFeatureFlags(): FeatureFlags {
    try {
        const stored = localStorage.getItem('feature_flags');
        if (stored) {
            return { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.warn('[特征开关] 配置加载失败', error);
    }
    return DEFAULT_FEATURE_FLAGS;
}

/**
 * 设置特征开关状态
 */
export function setFeatureFlags(flags: Partial<FeatureFlags>) {
    const current = getFeatureFlags();
    const updated = { ...current, ...flags };
    localStorage.setItem('feature_flags', JSON.stringify(updated));
}

/**
 * 检查单个特征是否启用
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return getFeatureFlags()[feature];
}

/**
 * 重置为默认状态
 */
export function resetFeatureFlags() {
    localStorage.removeItem('feature_flags');
}
