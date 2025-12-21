/**
 * Skills 系统类型定义
 * 定义所有 Skill 的 TypeScript 接口和 JSON Schema
 */

/** Skill 参数定义 */
export interface SkillParameter {
    type: 'string' | 'number' | 'boolean' | 'array';
    description: string;
    enum?: string[];
    required?: boolean;
    items?: SkillParameter; // 用于数组类型
}

/** Skill 完整定义 */
export interface SkillDefinition {
    name: string;
    description: string;
    parameters: Record<string, SkillParameter>;
}

/** Skill 执行参数（运行时） */
export interface SkillExecutionArgs {
    [key: string]: any;
}

/** Skill 执行结果 */
export interface SkillExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: {
        duration?: number;
        sql?: string;
        python?: string;
    };
}

// ============================================================
// 可视化技能定义
// ============================================================

/** 创建图表 Skill */
export const VIZ_CREATE_CHART: SkillDefinition = {
    name: 'viz_create_chart',
    description: '基于 DuckDB 查询结果生成图表，数据 100% 真实，非 AI 幻觉',
    parameters: {
        type: {
            type: 'string',
            description: '图表类型',
            enum: ['bar', 'line', 'scatter', 'pie'],
            required: true
        },
        x: {
            type: 'string',
            description: 'X 轴列名（必须是表中存在的列）',
            required: true
        },
        y: {
            type: 'string',
            description: 'Y 轴列名（必须是表中存在的列）',
            required: true
        },
        agg: {
            type: 'string',
            description: '聚合函数',
            enum: ['sum', 'avg', 'count', 'min', 'max']
        }
    }
};

// ============================================================
// 数据清洗技能定义
// ============================================================

/** 去除重复行 */
export const CLEAN_REMOVE_DUPLICATES: SkillDefinition = {
    name: 'clean_remove_duplicates',
    description: '删除表中的重复行，可指定去重列',
    parameters: {
        columns: {
            type: 'array',
            description: '用于判断重复的列名列表（为空则全列判断）',
            items: {
                type: 'string',
                description: '列名'
            }
        }
    }
};

/** 填充缺失值 */
export const CLEAN_FILL_MISSING: SkillDefinition = {
    name: 'clean_fill_missing',
    description: '填充指定列的缺失值（NULL 值）',
    parameters: {
        column: {
            type: 'string',
            description: '要填充的列名',
            required: true
        },
        strategy: {
            type: 'string',
            description: '填充策略',
            enum: ['mean', 'median', 'mode', 'zero', 'drop'],
            required: true
        }
    }
};

// ============================================================
// 系统操作技能定义
// ============================================================

/** 导出报告 */
export const SYS_EXPORT_REPORT: SkillDefinition = {
    name: 'sys_export_report',
    description: '导出当前分析报告',
    parameters: {
        format: {
            type: 'string',
            description: '导出格式',
            enum: ['pdf', 'markdown', 'html'],
            required: true
        }
    }
};

/** 切换主题 */
export const SYS_SWITCH_THEME: SkillDefinition = {
    name: 'sys_switch_theme',
    description: '切换应用主题',
    parameters: {
        theme: {
            type: 'string',
            description: '主题名称',
            enum: ['light', 'dark', 'cyber'],
            required: true
        }
    }
};
