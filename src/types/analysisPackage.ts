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
