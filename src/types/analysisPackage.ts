/**
 * 分析能力包类型定义
 * 用于配置 Pyodide 按需加载的 Python 库
 */

/**
 * 单个分析方法
 */
export interface AnalysisMethod {
    /** 对应的 Prompt ID */
    promptId: string;
    /** 方法名称 */
    name: string;
    /** 方法描述 */
    description: string;
    /** 输出图表类型 */
    outputCharts: string[];
}

/**
 * 分析能力包
 */
export interface AnalysisPackage {
    /** 能力包唯一标识 */
    id: string;
    /** 显示名称 */
    name: string;
    /** 能力包图标 (emoji) */
    icon: string;
    /** Pyodide 需要加载的包名列表 */
    pyodidePackages: string[];
    /** 预估下载大小 */
    sizeEstimate: string;
    /** 包含的分析方法 */
    methods: AnalysisMethod[];
    /** 是否内置 (内置包始终加载) */
    isBuiltIn: boolean;
    /** 排序优先级 */
    order: number;
}

/**
 * 用户的能力包选择设置
 */
export interface AnalysisPackageSettings {
    /** 已启用的能力包 ID 列表 */
    enabledPackages: string[];
    /** 上次更新时间 */
    lastUpdated: number;
}

/**
 * Python库配置（扁平化，取代能力包）
 */
export interface PyodideLibraryConfig {
    name: string;              // 库名：'seaborn'
    displayName: string;       // i18n key（自动生成）
    isRequired: boolean;       // 是否必需（pandas, numpy为true）
    enabledByDefault: boolean; // 默认启用状态
    sizeEstimate?: string;     // 大小估算（可选）
    loadTime?: string;         // 预计加载时间（可选）
    usedByPrompts: string[];   // 使用此库的Prompt ID列表
}

/**
 * 全局策略：缺失库的处理方式
 */
export enum LibraryMissingStrategy {
    AUTO_LOAD = 'auto_load',          // 自动临时加载
    FILTER_SUGGESTIONS = 'filter'      // 过滤掉需要未配置库的建议
}
