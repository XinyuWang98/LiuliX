import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// 文件大小阈值


/**
 * 文件大小阈值配置
 */
export const FILE_SIZE_THRESHOLDS = {
    SMALL: 5 * 1024 * 1024,    // 5MB - 完整缓存
    MEDIUM: 50 * 1024 * 1024,  // 50MB - 抽样缓存
    SAMPLE_ROWS_MEDIUM: 5000,   // 中等文件抽样行数
    SAMPLE_ROWS_LARGE: 1000,    // 大文件抽样行数
};

/**
 * 文件解析结果
 */
export interface ParsedFileData {
    /** 文件名 */
    fileName: string;

    /** 文件类型 */
    fileType: 'CSV' | 'XLSX' | 'JSON';

    /** 文件大小(字节) */
    fileSize: number;

    /** 解析后的数据(二维数组) */
    data: any[][];

    /** 列名 */
    columns: string[];

    /** 行数 */
    rowCount: number;

    /** 列数 */
    columnCount: number;

    /** 原始文件内容(用于传给 Pyodide) */
    rawContent?: string;

    /** 缓存策略 */
    cacheStrategy?: 'full' | 'sampled' | 'metadata-only';

    /** 是否为抽样数据 */
    isSampled?: boolean;

    /** 原始文件对象 (用于 DuckDB) */
    originalFile?: File;

    /** 原始文件大小（未抽样前） */
    originalSize?: number;
}

/**
 * 解析 CSV 文件
 */
function parseCSV(file: File): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            complete: (results) => {
                const data = results.data as any[][];
                const columns = data[0] || [];
                const dataRows = data.slice(1);

                // Read file as text to get raw content for Pyodide
                const reader = new FileReader();
                reader.onload = (e) => {
                    const rawContent = e.target?.result as string;
                    resolve({
                        fileName: file.name,
                        fileType: 'CSV',
                        fileSize: file.size,
                        data: dataRows,
                        columns,
                        rowCount: dataRows.length,
                        columnCount: columns.length,
                        rawContent,
                        cacheStrategy: 'full',
                        isSampled: false,
                        originalSize: file.size,
                    });
                };
                reader.readAsText(file);
            },
            error: (error: any) => {
                reject(new Error(`CSV parsing failed: ${error.message}`));
            },
            skipEmptyLines: true,
        });
    });
}

/**
 * 解析 CSV 文件（抽样版）
 */
export function parseCSVSampled(file: File, maxRows: number): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n');

                // 获取表头 + 抽样数据
                const sampledLines = lines.slice(0, maxRows + 1).join('\n');

                // 使用 Papa.parse 解析抽样数据
                Papa.parse(sampledLines, {
                    complete: (results) => {
                        const data = results.data as any[][];
                        const columns = data[0] || [];
                        const dataRows = data.slice(1);

                        const cacheStrategy = file.size > FILE_SIZE_THRESHOLDS.MEDIUM ?
                            'metadata-only' : 'sampled';

                        resolve({
                            fileName: file.name,
                            fileType: 'CSV',
                            fileSize: sampledLines.length, // 抽样后的大小
                            data: dataRows,
                            columns,
                            rowCount: dataRows.length,
                            columnCount: columns.length,
                            rawContent: cacheStrategy === 'sampled' ? sampledLines : undefined,
                            cacheStrategy,
                            isSampled: true,
                            originalSize: file.size,
                        });
                    },
                    error: (error: any) => {
                        reject(new Error(`CSV sampling failed: ${error.message}`));
                    },
                    skipEmptyLines: true,
                });
            } catch (error) {
                reject(new Error(`File reading failed: ${(error as Error).message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('File reading failed'));
        };

        reader.readAsText(file);
    });
}

/**
 * 解析 XLSX 文件
 */
function parseXLSX(file: File): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // 读取第一个工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // 转换为二维数组
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                const columns = jsonData[0] || [];
                const dataRows = jsonData.slice(1);

                resolve({
                    fileName: file.name,
                    fileType: 'XLSX',
                    fileSize: file.size,
                    data: dataRows,
                    columns,
                    rowCount: dataRows.length,
                    columnCount: columns.length,
                });
            } catch (error) {
                reject(new Error(`XLSX parsing failed: ${(error as Error).message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('File reading failed'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * 解析 JSON 文件
 */
function parseJSON(file: File): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target?.result as string);

                // 假设 JSON 是对象数组
                if (!Array.isArray(jsonData)) {
                    throw new Error('Invalid JSON format, expected array of objects');
                }

                const columns = Object.keys(jsonData[0] || {});
                const data = jsonData.map(row => columns.map(col => row[col]));

                resolve({
                    fileName: file.name,
                    fileType: 'JSON',
                    fileSize: file.size,
                    data,
                    columns,
                    rowCount: data.length,
                    columnCount: columns.length,
                });
            } catch (error) {
                reject(new Error(`JSON parsing failed: ${(error as Error).message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('File reading failed'));
        };

        reader.readAsText(file);
    });
}

/**
 * 根据文件类型解析文件
 */
export async function parseFile(file: File): Promise<ParsedFileData> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'csv':
            return parseCSV(file);

        case 'xlsx':
        case 'xls':
            return parseXLSX(file);

        case 'json':
            return parseJSON(file);

        default:
            throw new Error(`Unsupported file type: ${extension}`);
    }
}

/**
 * 检查文件是否需要抽样
 */
export function shouldSampleFile(rowCount: number, fileSize: number): boolean {
    const MAX_ROWS = 50000;
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    return rowCount > MAX_ROWS || fileSize > MAX_SIZE;
}

/**
 * 对数据进行抽样
 */
export function sampleData(data: any[][], sampleRatio: number): any[][] {
    const sampleSize = Math.floor(data.length * sampleRatio);
    const sampledData: any[][] = [];

    const indices = new Set<number>();
    while (indices.size < sampleSize) {
        indices.add(Math.floor(Math.random() * data.length));
    }

    const sortedIndices = Array.from(indices).sort((a, b) => a - b);
    sortedIndices.forEach(index => {
        sampledData.push(data[index]);
    });

    return sampledData;
}
