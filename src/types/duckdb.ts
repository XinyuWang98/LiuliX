export type ExecutionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ColumnMetadata {
    name: string;
    type: string;
}

export interface QueryResult<T = any> {
    data: T[];
    schema: ColumnMetadata[];
    rowCount: number;
}

export interface IngestionOptions {
    sampleSize?: number; // 如果未定义，则自动判断
    autoSampleThreshold?: number; // 默认 100000
    sampleRate?: number; // 默认 0.2
}

export interface IngestionResult {
    tableName: string;
    rowCount: number;
    isSampled: boolean;
    columns: ColumnMetadata[];
}

export interface ColumnStats {
    name: string;
    type: string;
    total: number;
    nullCount: number;
    uniqueCount: number;
    numericStats?: {
        min: number;
        q1: number;
        median: number;
        q3: number;
        max: number;
        stddev: number;
        skewness: number;
    };
    categoricalStats?: {
        topValues: Array<{ value: string; count: number }>;
    };
    distribution?: {
        bins: number;
        counts: number[];
        min: number;
        max: number;
        labels?: (string | number)[];
    };
    error?: boolean;
}
