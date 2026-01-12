import { Project } from '@utils/projectUtils';
import { DuckDBEngine } from '../db/duckdbEngine';
import { ColumnMetadata } from '../types/duckdb';
import { logger } from '../utils/logger';

/**
 * 数据加载服务
 * 职责：提供纯函数处理数据加载逻辑，无 React 依赖
 */

export interface DuckDBLoadResult {
    tableName: string;
    rowCount: number;
    columns: ColumnMetadata[];
}

export class DataLoadingService {
    /**
     * 使用 DuckDB 加载 CSV 文件
     */
    static async loadWithDuckDB(
        file: any,
        engine: DuckDBEngine,
        options?: { sampleSize?: number; sampleRate?: number; autoSampleThreshold?: number }
    ): Promise<DuckDBLoadResult> {
        // 优先使用原始文件对象
        let rawFile = file.data.rawFile || file.data.originalFile || file.data.file;

        // 回退：如果没有原始文件，从 JSON 数据重建 CSV
        if (!rawFile) {
            console.warn('⚠️ 原始文件对象不存在，尝试从 JSON 数据重建 CSV');
            const data = file.data.data;

            if (!data || data.length === 0) {
                throw new Error('无法获取原始文件对象且无数据可重建');
            }

            // 从 JSON 重建 CSV
            const headers = Object.keys(data[0]);
            let csvContent = headers.join(',') + '\n';
            data.forEach((row: any) => {
                csvContent += headers.map((h: string) => {
                    const val = row[h];
                    return val === null || val === undefined ? '' : String(val);
                }).join(',') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv' });
            rawFile = new File([blob], file.data.fileName, { type: 'text/csv' });
            logger.log('数据分析', '从 JSON 重建CSV成功', { count: data.length });
        }

        const result = await engine.ingestCSV(rawFile, {
            sampleSize: options?.sampleSize ?? (file.data.isSampled ? 200000 : -1),
            sampleRate: options?.sampleRate ?? 0.2,
            autoSampleThreshold: options?.autoSampleThreshold ?? 1000000 // 提升至 100万行
        });

        return {
            tableName: result.tableName,
            rowCount: result.rowCount,
            columns: result.columns
        };
    }

    /**
     * 验证 DuckDB 表是否存在
     */
    static async validateTable(tableName: string, engine: DuckDBEngine): Promise<boolean> {
        try {
            await engine.getTableColumns(tableName);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 清理失效的 tableName
     * @returns 返回更新后的 Project，若 tableName 有效则返回 null
     */
    static async cleanupInvalidTableName(
        project: Project,
        fileId: string,
        engine: DuckDBEngine
    ): Promise<Project | null> {
        const file = project.files.find((f: any) => f.id === fileId);
        if (!file?.data?.tableName) return null;

        const isValid = await this.validateTable(file.data.tableName, engine);
        if (!isValid) {
            logger.warn('DuckDB', 'tableName 失效，已清理', { oldName: file.data.tableName });
            const updatedProject = { ...project };
            const targetFile = updatedProject.files.find((f: any) => f.id === fileId);
            if (targetFile) {
                delete targetFile.data.tableName;
            }
            return updatedProject;
        }
        return null;
    }

    /**
     * 更新项目中文件的 tableName
     */
    static updateProjectTableName(
        project: Project,
        fileId: string,
        tableName: string
    ): Project {
        const updatedProject = { ...project };
        const targetFile = updatedProject.files.find((f: any) => f.id === fileId);

        if (targetFile) {
            targetFile.data.tableName = tableName;
            // @ts-ignore
            targetFile.data.hasTableName = true;
        }

        return updatedProject;
    }
}
