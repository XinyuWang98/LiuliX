/**
 * 项目相关类型定义
 */

/** 数据文件 */
export interface DataFile {
    /** 文件唯一 ID */
    id: string;

    /** 文件名 */
    name: string;

    /** 文件类型 */
    type: 'CSV' | 'XLSX' | 'JSON' | 'Parquet' | 'HDF5';

    /** 文件大小(字节) */
    size: number;

    /** 行数 */
    row_count: number;

    /** 列数 */
    column_count: number;

    /** 是否为抽样数据 */
    is_sampled: boolean;

    /** 抽样比例(如果是抽样数据) */
    sample_ratio?: number;

    /** 上传时间 */
    uploaded_at: Date;

    /** 列元数据 */
    columns: import('./data').ColumnMetadata[];
}

/** 项目 */
export interface Project {
    /** 项目唯一 ID */
    id: string;

    /** 项目名称 */
    name: string;

    /** 是否置顶 */
    is_pinned: boolean;

    /** 是否展开 */
    is_expanded: boolean;

    /** 项目包含的文件 */
    files: DataFile[];

    /** 创建时间 */
    created_at: Date;

    /** 最后修改时间 */
    updated_at: Date;

    /** 项目全局配置 */
    settings: {
        /** 统计显著性水平 (alpha 值) */
        alpha_value: number;

        /** 默认抽样比例 */
        default_sample_ratio: number;
    };
}

/** 证据池项 */
export interface EvidenceItem {
    /** 证据唯一 ID */
    id: string;

    /** 证据类型 */
    type: 'chart' | 'code' | 'insight' | 'model_report';

    /** 证据标题 */
    title: string;

    /** 证据内容 */
    content: any;

    /** 是否被手动修改 */
    is_modified: boolean;

    /** 修改时间戳 */
    modified_at?: Date;

    /** 创建时间 */
    created_at: Date;

    /** 排序顺序 */
    order: number;
}
