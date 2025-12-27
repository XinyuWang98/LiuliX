/**
 * 洞察树结构类型定义
 * 用于森林式下钻交互 (Forest Drill-down)
 * 
 * 设计文档: docs/01-架构设计/11-架构设计-洞察建议Prompt库时序图.md
 */

// ========== 常量定义 ==========

/**
 * 最大下钻深度
 * 到达此深度后，不再显示下钻按钮
 */
export const MAX_DRILL_DEPTH = 3;

// ========== 核心类型定义 ==========

/**
 * 下钻动作
 * 用于渲染 Action Chip 按钮
 */
export interface DrillDownAction {
    /** 按钮文案 */
    label: string;
    /** 对应的 Prompt ID */
    promptId: string;
    /** 预填的执行参数 */
    params: Record<string, unknown>;
    /** 是否为 AI 推荐 (高亮显示) */
    isRecommended?: boolean;
}

/**
 * L1 推荐项
 * L1 Prompt 返回的推荐结构
 */
export interface L1Recommendation {
    /** 对应的 L2 Prompt ID */
    promptId: string;
    /** 执行参数 */
    params: Record<string, unknown>;
    /** 推荐理由 */
    reason: string;
    /** 预测的下钻建议 */
    drillHint?: DrillDownAction;
}

/**
 * L1 响应结构
 */
export interface L1Response {
    recommendations: L1Recommendation[];
}

/**
 * 执行结果
 * L2 Prompt 执行后的返回结构
 */
export interface ExecutionResult {
    /** 生成的代码 */
    code: string;
    /** 分析结论摘要 */
    summary: string;
    /** 使用的列名 */
    columnsUsed: string[];
    /** 图表 Base64 (如果有) */
    image?: string;
}

/**
 * 洞察节点
 * 树状结构的单个节点
 */
export interface InsightNode {
    /** 唯一标识符 */
    id: string;
    /** 当前深度 (0=根, 1=子, 2=孙, 3=曾孙=终点) */
    depth: number;
    /** 节点标题 */
    title: string;
    /** 使用的列名 (继承自父节点或由 AI 生成) */
    columnsUsed: string[];
    /** 来源文件名称 */
    fileName?: string;
    /** 父节点的结论摘要 (用于上下文注入) */
    parentContext?: string;
    /** 触发此节点的 Prompt ID */
    promptId: string;
    /** 执行参数 */
    params: Record<string, unknown>;

    // 执行状态
    /**节点执行状态 */
    status?: 'loading' | 'completed' | 'error';
    /** 是否正在加载 */
    isLoading: boolean;
    /** 执行结果 */
    result?: ExecutionResult;
    /** 错误信息 */
    error?: string;

    // 扩展字段（用于聚焦模式展示）
    /** AI生成的洞察分析文本 */
    insight?: string;
    /** 图表Base64图片 */
    chartImage?: string;
    /** 生成的Python代码 */
    code?: string;
    /** 元数据（表名、列名等） */
    metadata?: {
        tableName?: string;
        columns?: string[];
        [key: string]: unknown;
    };
    /** 推荐的下钻操作（用于ActionGrid） */
    recommendedActions?: Array<{
        id: string;
        label: string;
        icon?: string;
        description?: string;
        isCustom?: boolean;
    }>;

    // 下钻入口
    /** 可用的下钻动作列表 */
    drillDownActions: DrillDownAction[];

    // 树结构
    /** 子节点数组 (并行展开) */
    children: InsightNode[];
    /** 是否展开 */
    isExpanded: boolean;
}

/**
 * 洞察链 (顶层容器)
 * 瀑布流中的根节点集合
 */
export interface InsightChain {
    /** 根节点数组 (L1 推荐的初始卡片) */
    rootCards: InsightNode[];
    /** 是否正在加载 L1 推荐 */
    isLoadingRecommendations: boolean;
    /** L1 推荐列表 (用于初始渲染) */
    recommendations: L1Recommendation[];
}

/**
 * 历史分析记录
 * 传递给 L1 用于上下文感知推荐
 */
export interface AnalysisHistory {
    /** 执行的 Prompt ID */
    promptId: string;
    /** 使用的列名 */
    columnsUsed: string[];
    /** 结果摘要 */
    resultSummary: string;
}
