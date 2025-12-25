/**
 * Prompt元数据压缩工具
 * 用于减少AI Prompt的Token消耗，提升推理速度
 */

import type { DesensitizedColumnInfo } from './dataSanitizer';

// ==================== 常量定义 ====================

/** 最大保留列数（超过则采样） */
const MAX_COLUMNS_IN_PROMPT = 20;

/** 每列最大样本值数量 */
const MAX_SAMPLE_VALUES = 3;

// ==================== 压缩函数 ====================

/**
 * 压缩列元数据以减少Prompt长度
 * 
 * 压缩策略（修正版，按数据类型精细化）：
 * 
 * **数值列** (INTEGER, DOUBLE, FLOAT):
 *   - 保留：name, type, nullRate, uniqueCount, min, max, mean, median
 *   - 移除：avgLength, patternExample
 *   - 原因：数据分析需要中位数填充（异常值场景）
 * 
 * **文本列** (VARCHAR, TEXT):
 *   - 保留：name, type, nullRate, uniqueCount, sampleValues
 *   - 移除：median, mean, min, max, avgLength, patternExample
 *   - 原因：统计值对文本列无意义，样本值已体现格式
 * 
 * **日期列** (DATE, TIMESTAMP):
 *   - 保留：name, type, nullRate, uniqueCount, min, max
 *   - 移除：median, mean, avgLength, patternExample
 *   - 原因：min/max定义时间范围即可
 * 
 * **列采样**: 超过20列时，智能采样关键列
 * **样本值**: 所有类型限制为3个
 * 
 * @param columns 原始列元数据
 * @returns 压缩后的列元数据
 */
export function compressMetadataForPrompt(
    columns: DesensitizedColumnInfo[]
): DesensitizedColumnInfo[] {
    // 1. 智能采样列（优先保留有问题的列）
    let sampledColumns = columns;
    if (columns.length > MAX_COLUMNS_IN_PROMPT) {
        sampledColumns = sampleKeyColumns(columns, MAX_COLUMNS_IN_PROMPT);
    }

    // 2. 按数据类型精细化压缩
    return sampledColumns.map(col => {
        // 基础字段（所有类型共有）
        const compressed: DesensitizedColumnInfo = {
            name: col.name,
            type: col.type,
            nullable: col.nullable,
            isSensitive: col.isSensitive,
            stats: {
                totalRows: col.stats.totalRows,
                nullCount: col.stats.nullCount,
                nullRate: col.stats.nullRate,
                uniqueCount: col.stats.uniqueCount,
            },
            // 限制样本值数量为3个
            sampleValues: col.sampleValues?.slice(0, MAX_SAMPLE_VALUES) || []
        };

        const typeUpper = col.type.toUpperCase();

        // 数值列：保留完整统计（包括median）
        if (typeUpper.includes('INT') || typeUpper.includes('DOUBLE') ||
            typeUpper.includes('FLOAT') || typeUpper.includes('DECIMAL')) {
            compressed.stats = {
                ...compressed.stats,
                min: col.stats.min,
                max: col.stats.max,
                mean: col.stats.mean,
                median: col.stats.median,  // ✅ 保留median用于填充
            };
        }
        // 日期列：保留min/max定义时间范围
        else if (typeUpper.includes('DATE') || typeUpper.includes('TIME')) {
            compressed.stats = {
                ...compressed.stats,
                min: col.stats.min,
                max: col.stats.max,
            };
        }
        // 文本列：只保留基础字段和样本值
        // 移除所有统计字段（median/mean/min/max/avgLength/patternExample）

        return compressed;
    });
}

/**
 * 智能采样关键列
 * 
 * 优先级：
 * 1. 高缺失率列（nullRate > 50%）
 * 2. 全空列（uniqueCount = 0）
 * 3. 低唯一值列（uniqueCount < 10）
 * 4. 其他列随机采样
 * 
 * @param columns 所有列
 * @param maxCount 最大保留数量
 * @returns 采样后的列
 */
function sampleKeyColumns(
    columns: DesensitizedColumnInfo[],
    maxCount: number
): DesensitizedColumnInfo[] {
    // 分类列
    const highNullCols = columns.filter(c => c.stats.nullRate > 50);
    const emptyNullCols = columns.filter(c => c.stats.uniqueCount === 0);
    const lowUniqueCols = columns.filter(c => c.stats.uniqueCount > 0 && c.stats.uniqueCount < 10);
    const normalCols = columns.filter(c =>
        c.stats.nullRate <= 50 &&
        c.stats.uniqueCount >= 10
    );

    // 优先级合并
    const prioritizedCols = [
        ...emptyNullCols,
        ...highNullCols,
        ...lowUniqueCols,
        ...normalCols
    ];

    // 去重（同一列可能在多个分类中）
    const uniqueCols = Array.from(
        new Map(prioritizedCols.map(col => [col.name, col])).values()
    );

    return uniqueCols.slice(0, maxCount);
}

/**
 * 计算压缩比率
 * 
 * @param original 原始元数据
 * @param compressed 压缩后的元数据
 * @returns 压缩比率（0-1），例如0.6表示压缩了40%
 */
export function calculateCompressionRatio(
    original: DesensitizedColumnInfo[],
    compressed: DesensitizedColumnInfo[]
): number {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = JSON.stringify(compressed).length;
    return compressedSize / originalSize;
}
