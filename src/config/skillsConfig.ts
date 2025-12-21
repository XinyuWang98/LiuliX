/**
 * Skills架构配置与兼容性开关
 * 所有开关默认关闭，需手动启用
 */

export interface SkillsConfigType {
    // 全局总开关
    GLOBAL_ENABLED: boolean;

    // 模块级开关
    MODULES: {
        INSIGHT_CHAIN: boolean;     // 洞察链模块
        DATA_CLEANING: boolean;     // 数据清洗模块
        CHAT_PANEL: boolean;        // AI聊天面板
        AUTO_REPORT: boolean;       // 自动报告
    };

    // Phase 2 高级功能开关
    ADVANCED: {
        MULTI_STEP: boolean;        // 多步执行
        ERROR_RECOVERY: boolean;    // 错误修正
        MAX_RETRY: number;          // 最大重试次数
    };
}

/**
 * 默认配置（全部关闭）
 */
export const DEFAULT_SKILLS_CONFIG: SkillsConfigType = {
    GLOBAL_ENABLED: false,
    MODULES: {
        INSIGHT_CHAIN: false,
        DATA_CLEANING: false,
        CHAT_PANEL: false,
        AUTO_REPORT: false
    },
    ADVANCED: {
        MULTI_STEP: false,
        ERROR_RECOVERY: false,
        MAX_RETRY: 3
    }
};

/**
 * 获取Skills配置（合并localStorage + 默认值）
 */
export function getSkillsConfig(): SkillsConfigType {
    try {
        const stored = localStorage.getItem('skills_config');
        if (stored) {
            const parsed = JSON.parse(stored);
            // 深度合并，确保新增字段有默认值
            return {
                ...DEFAULT_SKILLS_CONFIG,
                ...parsed,
                MODULES: { ...DEFAULT_SKILLS_CONFIG.MODULES, ...parsed.MODULES },
                ADVANCED: { ...DEFAULT_SKILLS_CONFIG.ADVANCED, ...parsed.ADVANCED }
            };
        }
    } catch (error) {
        console.warn('[SkillsConfig] 配置加载失败，使用默认配置', error);
    }
    return DEFAULT_SKILLS_CONFIG;
}

/**
 * 保存Skills配置
 */
export function setSkillsConfig(config: Partial<SkillsConfigType>) {
    const current = getSkillsConfig();
    const updated = {
        ...current,
        ...config,
        MODULES: { ...current.MODULES, ...(config.MODULES || {}) },
        ADVANCED: { ...current.ADVANCED, ...(config.ADVANCED || {}) }
    };
    localStorage.setItem('skills_config', JSON.stringify(updated));
}

/**
 * 检查Skills是否启用
 */
export function isSkillsEnabled(module?: keyof SkillsConfigType['MODULES']): boolean {
    const config = getSkillsConfig();

    if (!config.GLOBAL_ENABLED) {
        return false;
    }

    if (module && !config.MODULES[module]) {
        return false;
    }

    return true;
}

/**
 * 检查高级功能是否启用
 */
export function isAdvancedFeatureEnabled(feature: keyof SkillsConfigType['ADVANCED']): boolean {
    const config = getSkillsConfig();

    // 特殊处理：MAX_RETRY是数字，返回值本身
    if (feature === 'MAX_RETRY') {
        return config.ADVANCED.MAX_RETRY as any;
    }

    return config.GLOBAL_ENABLED && config.ADVANCED[feature] === true;
}

// 导出单例配置（但推荐使用getSkillsConfig()获取最新值）
export const SKILLS_CONFIG = getSkillsConfig();
