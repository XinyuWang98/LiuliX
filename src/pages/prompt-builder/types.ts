/**
 * Prompt Builder 类型定义
 */

export enum CodeLanguage {
    PYTHON = 'python',
    SQL = 'sql',
    UNKNOWN = 'unknown'
}

export type DataType = 'numeric' | 'category' | 'date' | 'text' | 'unknown';

export interface DetectedParam {
    originalName: string;      // 原列名（如 'Age'）
    suggestedVarName: string;  // 建议变量名（如 'age_column'）
    type: 'input' | 'output';  // 输入/输出参数
    dataType: DataType;        // 数据类型
    occurrences: number;       // 出现次数（仅用于内部统计）
}

/**
 * Python 包导入信息
 */
export interface DetectedImport {
    statement: string;         // 完整的 import 语句（如 'import pandas as pd'）
    source: 'auto' | 'manual'; // 来源：自动识别 / 手动添加
    module: string;            // 模块名（如 'pandas'）
}

export interface RecognitionResult {
    language: CodeLanguage;
    params: DetectedParam[];
    imports: DetectedImport[]; // Python 包导入列表
    confidence: number;        // 识别置信度 0-100
}

export interface ValidationMap {
    [paramName: string]: boolean;  // 参数名 → 是否在 Mock 数据中存在
}
