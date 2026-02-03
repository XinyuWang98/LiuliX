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

        // 回退：如果没有原始文件，按优先级重建
        if (!rawFile) {
            // 方案1: 从 rawContent 重建（推荐路径）
            if (file.data.rawContent) {
                const blob = new Blob([file.data.rawContent], { type: 'text/csv' });
                rawFile = new File([blob], file.data.fileName, { type: 'text/csv' });
                logger.log('数据分析', '从rawContent重建File对象成功', {
                    data: { fileName: file.data.fileName, size: blob.size }
                });
            }
            // 方案2: 从 JSON 数据重建（备用路径，兼容旧数据）
            else if (file.data.data && Array.isArray(file.data.data) && file.data.data.length > 0) {
                logger.warn('数据分析', '使用data数组重建CSV（非最优路径）', {
                    data: {
                        rowCount: file.data.data.length
                    }
                });

                const headers = Object.keys(file.data.data[0]);
                let csvContent = headers.join(',') + '\n';
                file.data.data.forEach((row: any) => {
                    csvContent += headers.map((h: string) => {
                        const val = row[h];
                        return val === null || val === undefined ? '' : String(val);
                    }).join(',') + '\n';
                });

                const blob = new Blob([csvContent], { type: 'text/csv' });
                rawFile = new File([blob], file.data.fileName, { type: 'text/csv' });
                logger.log('数据分析', '从data数组重建CSV成功', {
                    data: { rowCount: file.data.data.length }
                });
            }
            // 方案3: 无法重建，抛出明确错误
            else {
                throw new Error(
                    '无法重建文件：缺少 rawContent 和 data 数组。' +
                    '可能原因：项目数据损坏或使用了旧版本保存格式。' +
                    '请尝试重新上传文件。'
                );
            }
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
