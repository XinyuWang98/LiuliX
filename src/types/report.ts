/**
 * 报告相关类型定义
 */

export interface ReportSection {
    title: string;
    content: string;
    chart?: string;  // Base64图表数据
    code?: string;   // SQL/Python代码
}

export interface ReportData {
    title: string;
    sections: ReportSection[];
    metadata?: {
        createdAt?: string;
        author?: string;
        version?: string;
    };
}

export interface ReportExportOptions {
    format: 'html' | 'markdown' | 'pdf';
    includeCharts?: boolean;
    includeCode?: boolean;
}

// ============ V0 双角色报告新增类型 ============

/**
 * 审计状态枚举
 */
export enum AuditStatus {
    /** 待审核 */
    Pending = 'pending',
    /** 已通过 */
    Approved = 'approved',
    /** 有问题 */
    Rejected = 'rejected'
}

/**
 * 报告Cell（只读版本）
 * 用于展示已生成的分析结果，不支持编辑执行
 */
export interface ReportCell {
    /** Cell唯一标识 */
    id: string;

    /** 代码内容（AST增强版，包含防护逻辑） */
    code: string;

    /** 纯净代码（无AST防护，适合复制到Colab运行） */
    rawCode?: string;

    /** 去除 import 后的展示代码（左右分栏用） */
    presentationCode?: string;

    /** 代码语言 */
    language: 'sql' | 'python';

    /** 输出结果 */
    output: {
        /** Base64编码的图表图片 */
        chartImage?: string;
        /** AI生成的摘要/结论 */
        summary?: string;
        /** Python stdout 输出（用于左侧显示） */
        stdout?: string;
        /** 错误信息（如果执行失败） */
        error?: string;
    };

    /** Cell 元数据 */
    metadata?: {
        /** 用户手写的业务解读 */
        annotation?: string;
        /** Cell 标题 */
        title?: string;
    };

    /** 深度层级（用于缩进显示） */
    depth: number;

    /** 父Cell ID（用于树状关系） */
    parentId?: string;

    /** 审计状态 */
    auditStatus: AuditStatus;

    /** 审计备注（标记问题时填写） */
    auditNote?: string;
}

/**
 * 报告文档
 * 包含多个Cell和审计签字信息
 */
export interface ReportDocument {
    /** 文档唯一标识 */
    id: string;

    /** 报告标题 */
    title: string;

    /** 报告摘要/业务背景 */
    summary?: string;

    /** Cell列表 */
    cells: ReportCell[];

    /** 全局设置块（合并的 import 语句） */
    globalSetup?: string;

    /** 是否已签字审计 */
    isSigned: boolean;

    /** 审计人姓名 */
    signedBy?: string;

    /** 签字时间戳 */
    signedAt?: number;
}

/**
 * 报告模式
 */
export type ReportMode = 'notebook' | 'report';

/**
 * Cell审计操作类型
 */
export interface CellAuditAction {
    cellId: string;
    status: AuditStatus;
    note?: string;
}

