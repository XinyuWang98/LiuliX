import { ParsedFileData } from './fileParser';
import { createProject, Project } from './projectUtils';
import { DuckDBEngine } from '../db/duckdbEngine';
import { pyodideManager } from '../services/PyodideManager';
import { logger } from './logger';

/**
 * 处理上传的文件数据，执行 DuckDB/Pyodide 摄取，并创建项目对象
 * @param filesData 解析后的文件数据
 * @param sampledFlags 采样标记
 * @param languageCode 当前语言
 * @param themeTranslations 主题翻译
 * @returns 创建的项目对象
 */
export async function ingestFilesAndCreateProject(
    filesData: ParsedFileData[],
    sampledFlags: boolean[],
    languageCode: 'zh-CN' | 'en-US',
    themeTranslations: Record<string, string>
): Promise<Project> {
    const engine = DuckDBEngine.getInstance();

    // 确保 DuckDB 初始化
    try {
        await engine.init();
    } catch (err) {
        logger.error('DuckDB', '初始化失败', err);
    }

    // 处理文件摄取
    for (let i = 0; i < filesData.length; i++) {
        const fileData = filesData[i];

        // 1. DuckDB Ingestion (CSV)
        if (fileData.fileName.toLowerCase().endsWith('.csv') && fileData.originalFile) {
            try {
                const result = await engine.ingestCSV(fileData.originalFile, {
                    sampleSize: fileData.isSampled ? 200000 : -1,
                    sampleRate: 0.2, // 默认采样率
                    autoSampleThreshold: 200000
                });

                // 更新文件数据中的表信息
                (fileData as any).data = {
                    tableName: result.tableName,
                    columns: result.columns || [],
                    rowCount: result.rowCount,
                    isSampled: result.isSampled
                };
                fileData.tableName = result.tableName;

                logger.log('DuckDB', 'CSV导入成功', { data: { table: result.tableName, rows: result.rowCount } });
            } catch (err) {
                logger.error('DuckDB', 'CSV导入失败', err);
            }
        }

        // 2. Pyodide Loading (All files with rawContent)
        if (fileData.rawContent) {
            try {
                await pyodideManager.loadData(fileData.fileName, fileData.rawContent);
                logger.log('Python', '数据加载到Python环境', { data: { file: fileData.fileName } });
            } catch (err) {
                logger.error('Python', '数据(Raw)加载失败', err);
            }
        } else if (fileData.originalFile) {
            // 对于大文件（无rawContent），尝试通过 ArrayBuffer 加载到 Pyodide FS
            try {
                const buffer = await fileData.originalFile.arrayBuffer();
                // 暂时只支持写入 FS，Pyodide 需要读取逻辑（通常由 parser 处理）
                // 这里主要是确保 Pyodide 环境有这个文件
                await pyodideManager.writeFile(fileData.fileName, new Uint8Array(buffer));
                logger.log('Python', '文件写入虚拟文件系统', { data: { file: fileData.fileName } });
            } catch (err) {
                logger.error('Python', 'FS写入失败', err);
            }
        }
    }

    // 创建项目对象
    const newProject = createProject(filesData, sampledFlags, languageCode, themeTranslations);
    return newProject;
}
