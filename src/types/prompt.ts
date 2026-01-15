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

    // UI 展示增强字段
    isOfficial?: boolean; // 是否官方认证
    usageCount?: number; // 使用次数
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
