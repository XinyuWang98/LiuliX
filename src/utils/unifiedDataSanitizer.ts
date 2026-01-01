/**
 * 统一数据脱敏工具
 * 整合数据清洗和洞察分析的脱敏逻辑，遵守用户隐私设置
 */

import { logger } from './logger';
import { getPrivacyConfig } from './dataPrivacy';
import {
    isSensitiveColumn,
    desensitizeValue,
    type DesensitizedColumnInfo
} from './dataSanitizer';

/**
 * 统一脱敏选项
 */
export interface UnifiedSanitizeOptions {
    /** 是否遵守用户隐私设置 */
    respectUserSettings: boolean;
    /** 是否启用敏感列智能检测 */
    intelligentDetection: boolean;
    /** 脱敏粒度：fine=细粒度（姓名、手机号等），coarse=粗粒度（仅统计） */
    granularity: 'fine' | 'coarse';
}

/**
 * 统一脱敏结果
 */
export interface UnifiedSanitizeResult {
    /** 脱敏后的列元数据 */
    metadata: DesensitizedColumnInfo[];
    /** 列名映射表（原列名 → 原列名） */
    columnMapping: Map<string, string>;
    /** 实际使用的隐私模式 */
    privacyMode: 'raw' | 'sanitized';
}

/**
 * 统一数据脱敏入口
 * 
 * @param columns 列定义数组
 * @param stats 列统计信息数组
 * @param sampleData 采样数据（可选）
 * @param options 脱敏选项
 * @returns 脱敏结果
 * 
 * @example
 * const result = await unifiedSanitize(
 *     columns,
 *     stats,
 *     sampleData,
 *     {
 *         respectUserSettings: true,
 *         intelligentDetection: true,
 *         granularity: 'fine'
 *     }
 * );
 */
export async function unifiedSanitize(
    columns: any[],
    stats: any[],
    sampleData: any[] = [],
    options: UnifiedSanitizeOptions = {
        respectUserSettings: true,
        intelligentDetection: true,
        granularity: 'fine'
    }
): Promise<UnifiedSanitizeResult> {
    // Step 1: 检查用户隐私设置
    const userConfig = getPrivacyConfig();

    if (options.respectUserSettings && userConfig.mode === 'send_raw') {
        // 用户选择发送原始数据，跳过脱敏
        logger.log('数据隐私', '用户设置: 发送原始数据');

        const rawMetadata = buildRawMetadata(columns, stats, sampleData);
        const columnMapping = new Map(columns.map(c => [c.name, c.name]));

        return {
            metadata: rawMetadata,
            columnMapping,
            privacyMode: 'raw'
        };
    }

    // Step 2: 智能检测敏感列
    const sensitiveColumns: string[] = [];
    if (options.intelligentDetection) {
        for (const col of columns) {
            if (isSensitiveColumn(col.name)) {
                sensitiveColumns.push(col.name);
            }
        }
        logger.log('数据隐私', `检测到${sensitiveColumns.length}个敏感列`, {
            data: sensitiveColumns
        });
    }

    // Step 3: 执行脱敏
    const metadata = columns.map((col, index) => {
        const stat = stats[index] || {};
        const isSensitive = sensitiveColumns.includes(col.name);

        // 构建脱敏样本
        const sampleValues: string[] = [];
        if (options.granularity === 'fine' && stat.sampleData) {
            for (let i = 0; i < Math.min(3, stat.sampleData.length); i++) {
                const value = stat.sampleData[i];
                const desensitized = isSensitive
                    ? desensitizeValue(value, col.name, col.type)  // 细粒度脱敏
                    : formatValueSafely(value, col.type);          // 格式化
                sampleValues.push(desensitized);
            }
        }

        return {
            name: col.name,
            type: col.type,
            nullable: col.nullable || false,
            isSensitive,
            stats: {
                totalRows: stat.total || 0,
                nullCount: stat.nullCount || 0,
                nullRate: stat.total > 0 ? ((stat.nullCount || 0) / stat.total * 100) : 0,
                uniqueCount: stat.uniqueCount || 0,
                min: isSensitive ? '已脱敏' : stat.min,
                max: isSensitive ? '已脱敏' : stat.max,
                mean: isSensitive ? undefined : stat.mean,
                median: isSensitive ? undefined : stat.median,
                avgLength: stat.avgLength,
                patternExample: buildPatternExample(col, stat, isSensitive)
            },
            sampleValues: options.granularity === 'fine' ? sampleValues : undefined
        };
    });

    const columnMapping = new Map(columns.map(c => [c.name, c.name]));

    logger.log('数据隐私', '脱敏完成', {
        data: {
            columns: columns.length,
            sensitiveColumns: sensitiveColumns.length,
            granularity: options.granularity
        }
    });

    return {
        metadata,
        columnMapping,
        privacyMode: 'sanitized'
    };
}

/**
 * 构建原始元数据（跳过脱敏）
 */
function buildRawMetadata(
    columns: any[],
    stats: any[],
    _sampleData: any[]  // 🔧 未使用，但保留参数签名一致性
): DesensitizedColumnInfo[] {
    return columns.map((col, index) => {
        const stat = stats[index] || {};

        return {
            name: col.name,
            type: col.type,
            nullable: col.nullable || false,
            isSensitive: false,  // 原始模式下标记为非敏感
            stats: {
                totalRows: stat.total || 0,
                nullCount: stat.nullCount || 0,
                nullRate: stat.total > 0 ? ((stat.nullCount || 0) / stat.total * 100) : 0,
                uniqueCount: stat.uniqueCount || 0,
                min: stat.min,
                max: stat.max,
                mean: stat.mean,
                median: stat.median,
                avgLength: stat.avgLength,
                patternExample: stat.patternExample
            },
            sampleValues: stat.sampleData?.slice(0, 3) || []
        };
    });
}

/**
 * 安全格式化值（非敏感列）
 */
function formatValueSafely(value: any, dataType: string): string {
    if (value === null || value === undefined) {
        return 'NULL';
    }

    const valueStr = String(value);

    // 保留部分信息用于 AI 理解
    if (dataType.includes('INT') || dataType.includes('DOUBLE') || dataType.includes('FLOAT')) {
        return valueStr;  // 数值直接保留
    }

    if (dataType.includes('DATE') || dataType.includes('TIME')) {
        return valueStr;  // 日期保留
    }

    // 文本：保留长度提示
    return `${valueStr.length}字符`;
}

/**
 * 构建模式示例
 */
function buildPatternExample(col: any, stat: any, isSensitive: boolean): string {
    if (isSensitive) {
        return '敏感信息（已脱敏）';
    }

    if (col.type.includes('VARCHAR')) {
        return `文本(平均${stat.avgLength || 0}字符)`;
    }

    if (col.type.includes('INT') || col.type.includes('DOUBLE')) {
        return `数值(${stat.min || 0}-${stat.max || 0})`;
    }

    if (col.type.includes('DATE')) {
        return '日期格式';
    }

    return '未知';
}
