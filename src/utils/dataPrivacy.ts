/**
 * 数据隐私与脱敏模块
 * 根据用户设置决定发送给云端AI的数据形式
 */

import { logger } from './logger';

/** 脱敏设置选项 */
export type PrivacyMode = 'auto_sanitize' | 'send_raw';

/** 脱敏配置（存储在LocalStorage） */
export interface PrivacyConfig {
    mode: PrivacyMode;
    hidePrivacyGuide?: boolean;  // 是否不再显示Toast引导
}

/** 数据统计信息 */
export interface DataStatistics {
    columns: Array<{
        name: string;
        type: string;
        count: number;
        min?: number | string;
        max?: number | string;
        avg?: number;
        stddev?: number;
        nullCount: number;
    }>;
    totalRows: number;
}

const PRIVACY_CONFIG_KEY = 'dataprism_privacy_config';

/**
 * 获取用户隐私设置
 */
export function getPrivacyConfig(): PrivacyConfig {
    try {
        const stored = localStorage.getItem(PRIVACY_CONFIG_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        logger.warn('数据隐私', 'LocalStorage读取失败', error);
    }

    // 默认：自动脱敏（推荐）
    return { mode: 'auto_sanitize' };
}

/**
 * 保存用户隐私设置
 */
export function savePrivacyConfig(config: PrivacyConfig) {
    try {
        localStorage.setItem(PRIVACY_CONFIG_KEY, JSON.stringify(config));
        logger.log('数据隐私', '设置已保存', { data: config });
    } catch (error) {
        logger.error('数据隐私', 'LocalStorage保存失败', error);
    }
}

/**
 * 检查是否需要显示隐私引导Toast
 */
export function shouldShowPrivacyGuide(): boolean {
    const config = getPrivacyConfig();
    return !config.hidePrivacyGuide;
}

/**
 * 标记不再显示隐私引导
 */
export function hidePrivacyGuide() {
    const config = getPrivacyConfig();
    config.hidePrivacyGuide = true;
    savePrivacyConfig(config);
}

/**
 * 脱敏数据：仅保留元数据和统计信息
 * @param tableName DuckDB表名
 * @param sampleData 采样数据（用于推断列类型）
 * @param totalRows 总行数
 * @returns 脱敏后的数据描述
 */
export async function sanitizeData(
    sampleData: any[],
    totalRows: number
): Promise<DataStatistics> {
    logger.log('数据隐私', '脱敏处理', { data: { totalRows, sampleColumns: sampleData.length > 0 ? Object.keys(sampleData[0]).length : 0 } });

    if (sampleData.length === 0) {
        return {
            columns: [],
            totalRows: 0
        };
    }

    // 从采样数据推断列类型和统计信息
    const firstRow = sampleData[0];
    const columns: DataStatistics['columns'] = [];

    for (const [colName, value] of Object.entries(firstRow)) {
        const colType = inferColumnType(value);

        // 计算统计信息（仅用于数字列）
        let min, max, avg, stddev;
        if (colType === 'number') {
            const numericValues = sampleData
                .map(row => row[colName])
                .filter(v => typeof v === 'number' && !isNaN(v));

            if (numericValues.length > 0) {
                min = Math.min(...numericValues);
                max = Math.max(...numericValues);
                avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

                // 计算标准差
                const variance = numericValues.reduce((sum, val) =>
                    sum + Math.pow(val - avg!, 2), 0) / numericValues.length;
                stddev = Math.sqrt(variance);
            }
        } else if (colType === 'string') {
            // 字符串列：仅记录示例（不含具体值）
            min = `示例：${String(value).substring(0, 10)}...`;
            max = undefined;
        }

        // 计算空值数
        const nullCount = sampleData.filter(row => row[colName] === null || row[colName] === undefined).length;

        columns.push({
            name: colName,
            type: colType,
            count: sampleData.length,
            min,
            max,
            avg,
            stddev,
            nullCount
        });
    }

    return {
        columns,
        totalRows
    };
}

/**
 * 推断列数据类型
 */
function inferColumnType(value: any): string {
    if (value === null || value === undefined) {
        return 'unknown';
    }

    if (typeof value === 'number') {
        return 'number';
    }

    if (typeof value === 'boolean') {
        return 'boolean';
    }

    if (typeof value === 'string') {
        // 尝试判断是否为日期
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (dateRegex.test(value)) {
            return 'date';
        }
        return 'string';
    }

    if (typeof value === 'bigint') {
        return 'bigint';
    }

    return 'unknown';
}

/**
 * 根据隐私设置准备AI输入数据
 * @param tableName 表名
 * @param sampleData 采样数据
 * @param totalRows 总行数
 * @returns 准备好的数据（原始或脱敏）
 */
export async function prepareAIInput(
    _tableName: string,
    sampleData: any[],
    totalRows: number
): Promise<{ mode: PrivacyMode; data: any[] | DataStatistics }> {
    // 保留tableName参数供未来扩展（如日志记录、审计跟踪）
    void _tableName;

    const config = getPrivacyConfig();

    if (config.mode === 'auto_sanitize') {
        // 自动脱敏：返回统计信息
        const stats = await sanitizeData(sampleData, totalRows);
        logger.log('数据隐私', '使用脱敏模式', { data: { columns: stats.columns.length } });
        return {
            mode: 'auto_sanitize',
            data: stats
        };
    } else {
        // 发送原始数据
        logger.log('数据隐私', '使用原始数据模式', { data: { rows: sampleData.length } });
        return {
            mode: 'send_raw',
            data: sampleData
        };
    }
}
