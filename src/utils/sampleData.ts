/**
 * 数据采样工具函数
 * 用于大文件的AI调用优化
 */

import { DuckDBEngine } from '../db/duckdbEngine';

/**
 * 采样数据用于AI调用
 * @param tableName DuckDB表名
 * @param limit 采样行数限制，默认1000
 * @returns 采样后的数据和元数据
 */
export async function sampleDataForAI(
    tableName: string,
    limit: number = 1000
): Promise<{
    sampledData: any[];
    metadata: {
        isSampled: boolean;
        sampleSize: number;
        totalSize: number;
    };
}> {
    const engine = DuckDBEngine.getInstance();
    await engine.init();

    // 获取总行数
    const countResult = await engine.runQuery(`SELECT COUNT(*) as total FROM ${tableName}`);
    const totalSize = countResult[0]?.total || 0;

    // 判断是否需要采样
    const isSampled = totalSize > limit;

    // 采样查询 (使用LIMIT获取前N行)
    const sampledData = isSampled
        ? await engine.runQuery(`SELECT * FROM ${tableName} LIMIT ${limit}`)
        : await engine.runQuery(`SELECT * FROM ${tableName}`);

    return {
        sampledData,
        metadata: {
            isSampled,
            sampleSize: sampledData.length,
            totalSize,
        },
    };
}

/**
 * 将采样数据转换为AI可读格式（CSV字符串或JSON）
 * @param data 采样数据
 * @param format 输出格式
 * @returns 格式化后的字符串
 */
export function formatDataForAI(data: any[], format: 'csv' | 'json' = 'csv'): string {
    if (data.length === 0) {
        return '';
    }

    if (format === 'json') {
        return JSON.stringify(data, null, 2);
    }

    // CSV格式
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // 表头
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // 处理包含逗号或双引号的值
                if (value === null || value === undefined) return '';
                const str = String(value);
                return str.includes(',') || str.includes('"')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
            }).join(',')
        ),
    ];

    return csvRows.join('\n');
}
