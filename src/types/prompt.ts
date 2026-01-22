/**
 * Prompt 库核心类型定义
 * 基于 v2.0 四维矩阵架构 (Industry x Intent x Method x Output)
 */

// ========== 1. 核心架构定义 ==========

/**
 * Prompt 层级
 * L1_DECISION: 决策层 (Router) - 负责将业务问题转化为分析方法
 * L2_EXECUTION: 执行层 (Worker) - 负责将分析方法转化为可执行代码
 */
export type PromptLayer = 'L1_DECISION' | 'L2_EXECUTION';

/**
 * 四维矩阵维度 Key
 */
export type DimensionKey = 'industry' | 'intent' | 'method' | 'output';

/**
 * Prompt 标签
 * 用于矩阵分类和检索
 */
export interface PromptTag {
    category: DimensionKey;
    value: string; // e.g., "ecommerce", "visualize", "rdd"
    label: string; // e.g., "电商", "可视化", "断点回归"
}

// ========== 2. 实体定义 ==========

/**
 * 用户 Prompt 对象 (Do Object)
 * 存储在 Prompt 库中的原子单元
 */
export interface UserPrompt {
    id: string;          // 唯一标识符, e.g., "worker-distribution-v1"
    name: string;        // 内部名称/Key, e.g., "worker_distribution"
    title: string;       // 显示标题, e.g., "数据分布分析器"
    description: string; // 描述，用于 L1 决策时的语义匹配

    // ========== 新增字段 (v2.1架构) ==========

    /**
     * 语义化别名 (可选)
     * 用于代码引用、URL友好、向后兼容
     * 例如: 'worker-distribution-v1'
     */
    slug?: string;

    /**
     * 所需的Python包列表 (核心变更)
     * 用于能力包依赖管理和自动加载
     * 例如: ['pandas', 'numpy', 'matplotlib']
     */
    requiredPackages?: string[];

    /**
     * 所属的分析能力包ID
     * 用于自动生成 analysisPackages 配置
     * 例如: 'basic' | 'sklearn' | 'statsmodels' | 'nlp'
     */
    packageId?: string;

    /**
     * 输出的图表类型 (可选)
     * 用于UI展示和能力包方法描述
     * 例如: ['histogram', 'bar', 'scatter']
     */
    outputCharts?: string[];

    // 核心架构字段
    layer: PromptLayer;
    dimensions: PromptTag[]; // 四维标签集合

    // 关联逻辑 (用于 L1 找 L2)
    // 如果是 L1 Prompt，推荐它可以调用的 L2 Prompt ID 列表
    relatedWorkerIds?: string[];

    // 提示词模板 (System Prompt)
    // 支持 {{variable}} 占位符
    template: string;

    // 输入参数定义 (Schema)
    // 告诉调用者需要传入哪些变量 (e.g., "column_name", "df_summary")
    inputVariables: string[];

    /**
     * 🆕 输出列名定义 (可选)
     * 
     * 用途：声明此 prompt 执行后会在 DataFrame 中**动态生成**的列名
     * 
     * 使用场景：
     * 1. 列名校验：执行阶段校验时，这些列会被加入白名单（因为它们在代码运行前不存在于原始数据中）
     * 2. 依赖追踪：后续 prompt 可以引用这些生成列（未来功能）
     * 3. 文档生成：自动生成 prompt 的输入输出说明
     * 
     * 示例：
     * - worker-cluster-v1: ['Cluster']  → KMeans 聚类后生成 Cluster 列
     * - worker-outlier-v1: []           → 不生成新列，仅绘图（可省略此字段）
     * 
     * 架构扩展点（预留）：
     * - 未来可扩展为对象数组: { name: string, type: 'numeric'|'categorical', description: string }
     * - 支持用户编辑界面的输入提示
     * - 支持版本管理时的 schema diff 对比
     */
    outputColumns?: string[];

    // ========== Router 模式扩展 (L1 推荐式) ==========

    /**
     * 执行模式
     * - CODE_GEN: 传统模式，AI 直接输出完整代码 (适合 7B+)
     * - TEMPLATE_FILL: 模板模式，AI 输出参数，系统渲染模板 (适合 3B)
     */
    executionMode?: 'CODE_GEN' | 'TEMPLATE_FILL';

    /**
     * [仅 TEMPLATE_FILL 模式有效]
     * Python 代码模板，使用 {{variable}} 占位符
     * 系统会用 AI 返回的参数填充占位符后执行
     */
    codeTemplate?: string;

    /**
     * [仅 TEMPLATE_FILL 模式有效]
     * SQL 聚合模板 (用于 aggregated_mode)
     */
    sqlTemplate?: string;

    // 元数据
    author: string;
    version: string;
    isBuiltIn: boolean; // 是否内置
    updatedAt: number;

    // 🆕 废弃标记 (v2.2)
    /**
     * 是否已废弃
     * 废弃的 Prompt 不会出现在 Router 推荐列表中
     */
    deprecated?: boolean;

    /**
     * 废弃原因说明
     * 建议包含替代方案（如：Use cleaner-fill-null-median-v1 instead）
     */
    deprecatedReason?: string;

    // 🆕 参数注入配置 (v2.3)
    /**
     * 统计参数自动注入配置（可选）
     * 
     * 用于声明哪些参数需要从 ColumnStats 自动注入精确值
     * 支持用户自定义 Prompt 时灵活配置注入规则
     * 
     * 使用场景：
     * - cleaner-fill-null-median-v1: 需要从 DuckDB 获取精确的 median 值
     * - cleaner-filter-outliers-iqr-v1: 需要计算 IQR 边界值
     * 
     * 示例：
     * ```typescript
     * statsInjection: {
     *   median_value: 'median',           // 简单映射：直接取 stats.median
     *   q1_minus_iqr: (stats) => stats.q1 - 1.5 * stats.iqr  // 计算公式
     * }
     * ```
     * 
     * 架构优势：
     * - 声明式配置：注入规则与 Prompt 定义在一起
     * - 用户可编辑：UI 界面可提供注入规则配置面板
     * - 完全动态：无需修改注入器代码即可支持新 Prompt
     */
    statsInjection?: StatsInjectionConfig;

    // UI 展示增强字段
    isOfficial?: boolean; // 是否官方认证
    usageCount?: number; // 使用次数
}

/**
 * 统计参数注入配置
 * 
 * Key: 参数名（必须在 inputVariables 中声明）
 * Value: 提取规则（字符串映射或计算函数）
 * 
 * 示例：
 * ```typescript
 * {
 *   median_value: 'median',  // 字符串：直接映射 ColumnStats 字段
 *   iqr_lower: (stats) => stats.q1 - 1.5 * stats.iqr  // 函数：自定义计算
 * }
 * ```
 */
export type StatsInjectionConfig = Record<string, StatsExtractor>;

/**
 * 统计值提取器
 * 
 * 两种模式：
 * 1. 字符串：直接映射 ColumnStats 字段名
 *    - 示例：'median' → stats.median
 *    - 适用场景：简单值提取
 * 
 * 2. 函数：自定义计算公式
 *    - 示例：(stats) => stats.q1 - 1.5 * stats.iqr
 *    - 适用场景：需要计算的复杂值
 * 
 * 返回值：
 * - number: 数值参数（如 median_value）
 * - string: 字符串参数（如 mode_value 的分类值）
 * - undefined: 值无法提取（将保留 AI 猜测值）
 */
export type StatsExtractor =
    | 'min' | 'max' | 'mean' | 'median' | 'std' | 'q1' | 'q3' | 'iqr' | 'mode' | 'skewness' | 'kurtosis' | 'cv'  // ColumnStats 字段名 (v2.3 新增 mean, cv)
    | ((stats: ColumnStats) => number | string | undefined);  // 计算函数

/**
 * 列统计信息（从 DuckDB 计算）
 * 
 * 注意：此类型在 src/types/data.ts 中已定义，这里仅引用
 */
export interface ColumnStats {
    name: string;
    dtype: string;
    total: number;
    nullCount: number;
    unique?: number;
    // 数值型统计
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    std?: number;
    q1?: number;
    q3?: number;
    iqr?: number;
    skewness?: number;
    kurtosis?: number;
    cv?: number;  // 🆕 v2.3 变异系数
    // 分类型统计
    mode?: string | number;
    topValues?: Array<{ value: any; count: number }>;
}

// ========== 3. 注册表接口 ==========

/**
 * Prompt 筛选条件
 */
export interface PromptFilter {
    layer?: PromptLayer;
    tagCategory?: DimensionKey;
    tagValue?: string;
    search?: string; // 模糊搜索 title/description
}

/**
 * Prompt 注册表服务接口
 */
export interface IPromptRegistry {
    // 获取单个 Prompt
    getPrompt(id: string): UserPrompt | undefined;

    // 获取 Prompt 列表 (支持筛选)
    listPrompts(filter?: PromptFilter): UserPrompt[];

    // 注册/更新 Prompt (由加载器调用)
    register(prompt: UserPrompt): void;

    // 获取所有可用标签 (用于 UI 筛选器)
    getAvailableTags(): Record<DimensionKey, string[]>;
}
