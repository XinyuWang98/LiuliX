/**
 * 用户角色预设配置
 * 
 * 提供数据分析师和业务专家两种角色的预设配置
 * 仅影响核心业务功能，不修改AI配置、语言、主题等
 */

import type { UserRole, UserRoleConfig } from '../types/userRole';
export type { UserRole, UserRoleConfig };

/**
 * 角色预设配置
 */
export const USER_ROLE_PRESETS: Record<UserRole, UserRoleConfig> = {
    /** 数据分析师：完全控制、可定制、技术导向 */
    analyst: {
        role: 'analyst',

        // 数据清洗配置
        cleaning: {
            enableRouter: true,        // ✅ 开启Router快速模板
            enableAI: false,           // ✅ 禁用AI生成式（改用纯Router模式）
            minSuggestions: 5,         // 需要更多选择
            showSQL: true,             // P1: 显示SQL代码
            enableSQLEdit: true,       // P1: 允许编辑SQL
        },

        // 洞察分析配置
        insights: {
            maxColumns: 50,            // 分析更多列
            timeout: 120,              // 更长超时时间（秒）
            samplingRows: 100,         // 更大样本
            showCode: true,            // P1: 显示Python代码
            enableCodeEdit: true,      // P2: 允许编辑代码
            chartStyle: 'minimal',     // P2: 简洁图表风格
        },

        // 分析报告配置（P2阶段）
        reports: {
            template: 'technical',
            includeCodeAppendix: true,
            exportFormats: ['pdf', 'markdown', 'jupyter'],
        },
    },

    /** 业务专家：自动化、易用性、结果导向 */
    expert: {
        role: 'expert',

        // 数据清洗配置
        cleaning: {
            enableRouter: true,        // 使用Router快速标准化
            enableAI: false,           // ✅ 禁用AI生成式（改用纯Router模式）
            minSuggestions: 3,         // 基础建议数量
            showSQL: false,            // P1: 隐藏SQL代码
            enableSQLEdit: false,      // P1: 不允许编辑SQL
        },

        // 洞察分析配置
        insights: {
            maxColumns: 20,            // 默认列数
            timeout: 60,               // 默认超时时间（秒）
            samplingRows: 30,          // 默认样本大小
            showCode: false,           // P1: 隐藏Python代码
            enableCodeEdit: false,     // P2: 不允许编辑代码
            chartStyle: 'business',    // P2: 商务图表风格
        },

        // 分析报告配置（P2阶段）
        reports: {
            template: 'business',
            includeCodeAppendix: false,
            exportFormats: ['pdf', 'pptx'],
        },
    },
};

/**
 * 应用角色预设配置
 * 
 * 注意：仅修改核心功能配置，不影响：
 * - AI配置（use_local_model, ai_priority）
 * - 界面语言（language）
 * - 主题（theme）
 * - 布局显示（layout.showLeft/Right）
 * 
 * @param role 用户角色
 */
export function applyRolePreset(role: UserRole): void {
    const config = USER_ROLE_PRESETS[role];

    // === 数据清洗配置 ===
    localStorage.setItem('cleaning_router', String(config.cleaning.enableRouter));
    localStorage.setItem('cleaning_ai', String(config.cleaning.enableAI));
    localStorage.setItem('min_suggestions', String(config.cleaning.minSuggestions));

    // === 洞察分析配置 ===
    localStorage.setItem('analysis_max_columns', String(config.insights.maxColumns));
    localStorage.setItem('analysis_timeout', String(config.insights.timeout));
    localStorage.setItem('analysis_sampling_rows', String(config.insights.samplingRows));

    // === 保存角色标识 ===
    localStorage.setItem('user_role', role);

    // P1/P2阶段配置暂不写入（功能未实现）
    // showSQL, enableSQLEdit, showCode等将在后续阶段实现
}

/**
 * 获取当前用户角色
 * 
 * @returns 当前角色，默认为business expert
 */
export function getCurrentUserRole(): UserRole {
    const stored = localStorage.getItem('user_role');
    return (stored as UserRole) || 'expert';
}

/**
 * 获取当前角色配置
 * 
 * @returns 当前角色的完整配置
 */
export function getCurrentRoleConfig(): UserRoleConfig {
    const role = getCurrentUserRole();
    return USER_ROLE_PRESETS[role];
}
