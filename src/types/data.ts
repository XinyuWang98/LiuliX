// 列统计信息接口
export interface ColumnStats {
    column_name: string;
    data_type: 'numeric' | 'categorical' | 'datetime' | 'text' | 'boolean';
    unique_count: number;
    missing_count: number;
    missing_ratio: number; // 0-1 之间的小数

    // 数值列统计（仅当 data_type === 'numeric' 时存在）
    numeric_stats?: {
        min: number;
        max: number;
        mean: number;
        median: number;
        std: number;
        q1: number; // 第一四分位数
        q3: number; // 第三四分位数
        histogram?: number[]; // 用于迷你柱状图的10个bin
        distribution?: {
            bins: number;
            counts: number[];
            min: number;
            max: number;
            labels?: (string | number)[]; // 新增：用于离散值的标签
        };
    };

    // 分类列统计（仅当 data_type === 'categorical' 时存在）
    categorical_stats?: {
        top_values: Array<{ value: string; count: number; percentage: number }>;
        value_counts?: { [key: string]: number }; // 完整的值计数
    };
}
// ColumnMetadata 别名，用于兼容 Project 类型定义
export type ColumnMetadata = ColumnStats;


// DataFrame 完整信息
export interface DataFrameInfo {
    columns: ColumnStats[];
    row_count: number;
    column_count: number;
    memory_usage?: string; // 如 "2.3 MB"
    preview_data: any[][]; // 前100行的数据（二维数组）
    column_names: string[]; // 列名数组（用于表头）
}

// 数据加载选项
export interface DataLoadOptions {
    max_rows?: number; // 最多加载多少行（用于大文件）
    sample_size?: number; // 抽样大小
    parse_dates?: string[]; // 需要解析为日期的列名
}

// 数据加载结果
export interface DataLoadResult {
    success: boolean;
    data?: DataFrameInfo;
    error?: string;
    warning?: string; // 如 "文件过大，已抽样10000行"
}
