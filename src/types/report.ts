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
