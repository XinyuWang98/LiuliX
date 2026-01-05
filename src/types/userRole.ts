/**
 * 用户角色配置类型定义
 * 
 * 角色配置仅影响核心业务功能：
 * - 数据清洗
 * - 洞察分析  
 * - 分析报告（P2阶段）
 * 
 * AI配置、语言、主题等保持独立管理
 */

export type UserRole = 'analyst' | 'expert';

/**
 * 用户角色配置接口
 */
export interface UserRoleConfig {
    role: UserRole;

    /** 数据清洗配置 */
    cleaning: {
        /** 是否启用Router快速模板 */
        enableRouter: boolean;
        /** 是否启用AI深度分析 */
        enableAI: boolean;
        /** 最少建议数量 */
        minSuggestions: number;

        /** 是否默认显示SQL代码 */
        showSQL: boolean;
        /** 是否允许编辑SQL */
        enableSQLEdit?: boolean;
    };

    /** 洞察分析配置 */
    insights: {
        /** 最大分析列数 */
        maxColumns: number;
        /** 分析超时时间（秒） */
        timeout: number;
        /** 采样行数 */
        samplingRows: number;

        /** 是否默认显示Live Notebook */
        showCode: boolean;

        // P2阶段配置
        /** 是否允许编辑代码 */
        enableCodeEdit?: boolean;
        /** 图表样式 */
        chartStyle?: 'minimal' | 'business';
    };

    /** 分析报告配置 */
    reports?: {
        /** 报告模板类型 */
        template?: 'technical' | 'business';
        /** 是否默认显示Notebook代码 */
        showNotebook?: boolean;
        /** 是否包含代码附录 */
        includeCodeAppendix?: boolean;
        /** 导出格式 */
        exportFormats?: string[];
    };
}
