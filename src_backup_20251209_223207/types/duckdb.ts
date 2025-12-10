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
