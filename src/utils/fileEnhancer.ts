/**
 * File Context Enhancer
 * 
 * 为ProjectFile对象增强必要的上下文字段,用于AI洞察分析
 * 
 * @author AntiGravity
 * @date 2026-01-09
 */

import { ProjectFile } from './projectUtils';

/**
 * 增强后的ProjectFile接口
 * 包含AI洞察执行所需的所有字段
 */
export interface EnhancedProjectFile extends ProjectFile {
    /** 数据表名称 */
    tableName: string;
    /** 数据行数 */
    rowCount: number;
    /** 列类型映射 */
    columnTypes: Record<string, string>;
}

/**
 * 增强ProjectFile对象,添加tableName、rowCount和columnTypes
 * 
 * 用途:
 * - AI洞察生成需要完整的文件上下文
 * - EDA闭环需要准确的表名和列类型
 * - 代码执行需要rowCount进行内存评估
 * 
 * @param file 原始ProjectFile对象
 * @param tableName 数据表名称
 * @param rowCount 数据行数
 * @returns 增强后的文件对象,如果输入为undefined则返回undefined
 * 
 * @example
 * ```typescript
 * const enhancedFile = enhanceProjectFile(file, 't_123_working', 1000);
 * // enhancedFile.tableName === 't_123_working'
 * // enhancedFile.columnTypes === { 'col1': 'VARCHAR', 'col2': 'BIGINT' }
 * ```
 */
export function enhanceProjectFile(
    file: ProjectFile | undefined,
    tableName: string,
    rowCount: number
): EnhancedProjectFile | undefined {
    if (!file) return undefined;

    return {
        ...file,
        tableName,
        rowCount,
        // 规范化columns数组
        columns: file.columns || normalizeColumns(file.data?.columns),
        // 构建columnTypes映射
        columnTypes: (file as any).columnTypes || buildColumnTypes(
            file.columns || file.data?.columns
        )
    } as EnhancedProjectFile;
}

/**
 * 规范化列定义为统一格式
 * 
 * @param columns 原始列定义(可能是string[]或{name,type}[])
 * @returns 规范化后的列定义数组
 */
function normalizeColumns(columns: any[]): Array<{ name: string; type?: string }> {
    if (!columns) return [];

    return (columns as any[]).map((col: any) => ({
        name: typeof col === 'string' ? col : col.name,
        type: typeof col === 'object' && col.type ? col.type : 'VARCHAR'
    }));
}

/**
 * 从列定义构建列类型映射
 * 
 * @param columns 列定义数组
 * @returns 列名到类型的映射对象
 */
function buildColumnTypes(columns: any[]): Record<string, string> {
    if (!columns) return {};

    return (columns as any[]).reduce((acc, col) => {
        const name = typeof col === 'string' ? col : col.name;
        const type = typeof col === 'object' && col.type ? col.type : 'VARCHAR';
        acc[name] = type;
        return acc;
    }, {} as Record<string, string>);
}
